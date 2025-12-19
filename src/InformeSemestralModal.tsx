// src/InformeSemestralModal.tsx - VERSIÓN MEJORADA
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
    periodo?: string | null;
    descripcion?: string | null;
    actividades?: string | null;
    logros?: string | null;
    dificultades?: string | null;
    resumen?: string | null;
    user_id?: string | null;
    internal_responsible_id?: string | null;
    year_id?: string | null;
    contenido?: string | null;
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
  const [contenido, setContenido] = useState(editing?.contenido ?? "");
  const [dificultades, setDificultades] = useState(editing?.dificultades ?? "");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) return;
    fetchProfile();
    setContenido(editing?.contenido ?? "");
    setDificultades(editing?.dificultades ?? "");
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
    setContenido("");
    setDificultades("");
  };

  const handleSave = async () => {
    if (!profile) {
      alert("No se pudo identificar al usuario. Refresca sesión.");
      return;
    }

    if (!contenido || contenido.trim() === "") {
      return alert("Por favor ingresa el contenido del informe.");
    }

    setLoading(true);

    try {
      const payload: any = {
        convenio_id: convenioId,
        periodo: null,
        contenido,
        dificultades,
        descripcion: null,
        actividades: null,
        logros: null,
        resumen: null,
        user_id: profile.id,
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
      alert("Error al guardar: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header bg-primary text-white py-3">
            <div>
              <h4 className="modal-title mb-1 fw-bold">
                {editing ? "📝 Editar Informe Anual" : "📄 Nuevo Informe Anual"}
              </h4>
              {profile && (
                <small className="opacity-75">
                  Responsable: <strong>{profile.full_name || profile.email}</strong>
                </small>
              )}
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            )}

            <div className="row g-4">
              {/* Contenido Principal */}
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="mb-0 text-primary fw-semibold">
                      <i className="bi bi-file-text me-2"></i>
                      Contenido del Informe
                    </h6>
                  </div>
                  <div className="card-body">
                    <label className="form-label fw-semibold">
                      Descripción de actividades y resultados <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control shadow-sm"
                      rows={12}
                      value={contenido}
                      onChange={(e) => setContenido(e.target.value)}
                      placeholder="Describe las actividades realizadas durante el periodo, resultados obtenidos, metas alcanzadas..."
                      style={{
                        resize: "vertical",
                        minHeight: "200px",
                        fontSize: "0.95rem",
                        lineHeight: "1.6"
                      }}
                    />
                    <div className="form-text">
                      <i className="bi bi-info-circle me-1"></i>
                      Incluye detalles sobre las actividades realizadas, beneficiarios, impacto y resultados cuantitativos.
                    </div>
                  </div>
                </div>
              </div>

              {/* Dificultades/Observaciones */}
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="mb-0 text-warning fw-semibold">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      Dificultades y Observaciones
                    </h6>
                  </div>
                  <div className="card-body">
                    <label className="form-label fw-semibold">
                      Desafíos encontrados y recomendaciones
                    </label>
                    <textarea
                      className="form-control shadow-sm"
                      rows={6}
                      value={dificultades}
                      onChange={(e) => setDificultades(e.target.value)}
                      placeholder="Describe obstáculos, limitaciones, áreas de mejora, recomendaciones..."
                      style={{
                        resize: "vertical",
                        minHeight: "120px",
                        fontSize: "0.95rem",
                        lineHeight: "1.6"
                      }}
                    />
                    <div className="form-text">
                      <i className="bi bi-info-circle me-1"></i>
                      Opcional: Menciona dificultades encontradas y sugerencias para mejorar.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light border-0 p-3">
            <button
              type="button"
              className="btn btn-light px-4"
              onClick={onClose}
              disabled={loading}
            >
              <i className="bi bi-x-circle me-2"></i>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 shadow-sm"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {editing ? "Actualizar Informe" : "Guardar Informe"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



