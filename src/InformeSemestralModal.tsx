// src/InformeSemestralModal.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Props {
  show: boolean;
  onClose: () => void;
  convenioId: string;
  selectedYearId: string | null;
  onSaved: () => void;
  editing?: {
    id: string;
    periodo: string;
    descripcion?: string | null;
    actividades?: string | null;
    logros?: string | null;
    dificultades?: string | null;
    resumen?: string | null;
    user_id?: string | null;
    internal_responsible_id?: string | null;
    year_id?: string | null;
  } | null;
}

export default function InformeSemestralModal({
  show,
  onClose,
  convenioId,
  selectedYearId,
  onSaved,
  editing = null,
}: Props) {
  const [periodo, setPeriodo] = useState(editing?.periodo ?? "");
  const [descripcion, setDescripcion] = useState(editing?.descripcion ?? "");
  const [actividades, setActividades] = useState(editing?.actividades ?? "");
  const [logros, setLogros] = useState(editing?.logros ?? "");
  const [dificultades, setDificultades] = useState(editing?.dificultades ?? "");
  const [resumen, setResumen] = useState(editing?.resumen ?? "");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    fetchProfile();
    // if editing changes, load values
    setPeriodo(editing?.periodo ?? "");
    setDescripcion(editing?.descripcion ?? "");
    setActividades(editing?.actividades ?? "");
    setLogros(editing?.logros ?? "");
    setDificultades(editing?.dificultades ?? "");
    setResumen(editing?.resumen ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, editing]);

  const fetchProfile = async () => {
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp?.user ?? null;
      if (!user) {
        setError("No se encontró sesión. Inicia sesión.");
        return;
      }

      const { data: profileData, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profErr) {
        console.error("Error cargando profile:", profErr);
        setError("Error cargando datos de perfil.");
        return;
      }
      setProfile(profileData || null);
    } catch (err) {
      console.error("fetchProfile error:", err);
      setError("Error cargando perfil.");
    }
  };

  const clearForm = () => {
    setPeriodo("");
    setDescripcion("");
    setActividades("");
    setLogros("");
    setDificultades("");
    setResumen("");
  };

  const handleSave = async () => {
    if (!profile) {
      alert("No se pudo identificar al usuario. Refresca sesión.");
      return;
    }
    if (!periodo || periodo.trim() === "") {
      return alert("Ingresa el periodo (ej. 'Año 1' o '2025 - 2026').");
    }

    setLoading(true);

    try {
      // Prevención duplicados:
      // Buscamos si el mismo responsable (profiles.id) ya registró un informe
      // para el mismo convenio y mismo year_id OR mismo periodo textual.
      const filters: any[] = [
        { column: "convenio_id", operator: "eq", value: convenioId },
      ];
      if (selectedYearId) {
        // si existe columna year_id en la tabla, la usaremos en la consulta
        // (si no existe, supabase devolverá error y capturamos).
        filters.push({ column: "year_id", operator: "eq", value: selectedYearId });
      } else {
        // fallback: usamos texto periodo
        filters.push({ column: "periodo", operator: "eq", value: periodo });
      }

      // Ejecutar consulta combinada: buscar por convenio + (year_id o periodo) + mismo responsable
      let existsQuery = supabase.from("informes_semestrales").select("id, user_id, internal_responsible_id").eq("convenio_id", convenioId);

      if (selectedYearId) existsQuery = existsQuery.eq("year_id", selectedYearId);
      else existsQuery = existsQuery.eq("periodo", periodo);

      existsQuery = existsQuery.eq("internal_responsible_id", profile.id);

      const { data: existing, error: existingErr } = await existsQuery.limit(1).maybeSingle();

      if (existingErr) {
        // Si la consulta falla por esquema (p ej. column year_id no existe),
        // intentamos consulta alternativa usando periodo + user_id
        console.warn("Consulta existencia inicial falló, intentando alternativa:", existingErr);
        const { data: alt, error: altErr } = await supabase
          .from("informes_semestrales")
          .select("id")
          .eq("convenio_id", convenioId)
          .eq("periodo", periodo)
          .eq("internal_responsible_id", profile.id)
          .limit(1)
          .maybeSingle();

        if (altErr) throw altErr;
        if (alt) {
          alert("Ya existe un informe para este periodo por tu usuario. Contacta al administrador para editarlo.");
          setLoading(false);
          return;
        }
      } else {
        if (existing) {
          // si está editando ese mismo registro, permitir actualizar
          if (editing && existing.id === editing.id) {
            // permitimos actualización
          } else {
            alert("Ya existe un informe para este periodo por tu usuario. Contacta al administrador para editarlo.");
            setLoading(false);
            return;
          }
        }
      }

      // Construir payload; incluir year_id si hay selectedYearId
      const payload: any = {
        convenio_id: convenioId,
        periodo,
        descripcion,
        actividades,
        logros,
        dificultades,
        resumen,
        user_id: profile.id, // referencia a profiles.id para trazabilidad
        internal_responsible_id: profile.id,
      };

      if (selectedYearId) payload.year_id = selectedYearId;

      if (editing && editing.id) {
        const { error: updateErr } = await supabase
          .from("informes_semestrales")
          .update(payload)
          .eq("id", editing.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase.from("informes_semestrales").insert([payload]);
        if (insertErr) throw insertErr;
      }

      onSaved();
      clearForm();
      onClose();
    } catch (err: any) {
      console.error("Error guardar informe:", err);
      alert("Error al guardar informe: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal" style={{ display: "block", background: "rgba(0,0,0,0.4)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{editing ? "Editar Informe" : "Nuevo Informe"}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {profile && (
              <div className="mb-2">
                <small className="text-muted">Enviado por: <strong>{profile.full_name}</strong></small>
              </div>
            )}
            <div className="mb-2">
              <label className="form-label">Periodo</label>
              <input className="form-control" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            </div>

            <div className="mb-2">
              <label className="form-label">Descripción</label>
              <textarea className="form-control" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>

            <div className="mb-2">
              <label className="form-label">Actividades</label>
              <textarea className="form-control" rows={2} value={actividades} onChange={(e) => setActividades(e.target.value)} />
            </div>

            <div className="mb-2">
              <label className="form-label">Logros</label>
              <textarea className="form-control" rows={2} value={logros} onChange={(e) => setLogros(e.target.value)} />
            </div>

            <div className="mb-2">
              <label className="form-label">Dificultades</label>
              <textarea className="form-control" rows={2} value={dificultades} onChange={(e) => setDificultades(e.target.value)} />
            </div>

            <div className="mb-2">
              <label className="form-label">Resumen</label>
              <textarea className="form-control" rows={2} value={resumen} onChange={(e) => setResumen(e.target.value)} />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



