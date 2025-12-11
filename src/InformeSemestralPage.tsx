// src/InformeSemestralPage.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { useParams, useNavigate } from "react-router-dom";

interface AgreementYear {
  id: string;
  agreement_id: string;
  year_number: number;
  year_start?: string;
  year_end?: string;
}

interface InformeSemestral {
  id: string;
  convenio_id: string | null;
  user_id: string | null;
  internal_responsible_id?: string | null;
  periodo: string;
  descripcion: string | null;
  actividades: string | null;
  logros: string | null;
  dificultades: string | null;
  created_at: string;
  resumen: string | null;
  updated_at?: string | null;
}

interface Profile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
}

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  const [years, setYears] = useState<AgreementYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [allInformes, setAllInformes] = useState<InformeSemestral[]>([]);
  const [displayedInformes, setDisplayedInformes] = useState<InformeSemestral[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(false);

  // formulario
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [resumen, setResumen] = useState("");

  // usuario actual y profile
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  // carga inicial: años + usuario actual
  useEffect(() => {
    if (!convenioId) return;
    loadYears();
    loadCurrentUserAndProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId]);

  // cada vez que cambie selectedYearId recargar (o filtrar) informes
  useEffect(() => {
    if (!convenioId) return;
    loadInformesSemestrales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId, selectedYearId]);

  // cuando cambien todos los informes o years actualizamos el listado mostrado
  useEffect(() => {
    applyYearFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allInformes, years, selectedYearId]);

  async function loadCurrentUserAndProfile() {
    try {
      // getUser() retorna { data: { user }, error }
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user ?? null;
      if (!user) {
        setCurrentUserId(null);
        setCurrentProfile(null);
        return;
      }
      setCurrentUserId(user.id);

      // cargar profile
      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, username, email")
        .eq("id", user.id)
        .maybeSingle();

      if (pErr) {
        console.error("Error cargando profile actual:", pErr);
      } else {
        setCurrentProfile(pData || null);
      }
    } catch (err) {
      console.error("Error cargando usuario actual:", err);
    }
  }

  async function loadYears() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agreement_years")
        .select("id, agreement_id, year_number, year_start, year_end")
        .eq("agreement_id", convenioId)
        .order("year_number", { ascending: true });

      if (error) throw error;
      setYears(data || []);
      if (data && data.length > 0 && !selectedYearId) setSelectedYearId(data[0].id);
    } catch (err) {
      console.error("Error cargando years:", err);
      setYears([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadInformesSemestrales() {
    setLoading(true);
    try {
      // traer todos los informes para este convenio (mantener históricos para trazabilidad)
      const { data, error } = await supabase
        .from("informes_semestrales")
        .select("*")
        .eq("convenio_id", convenioId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const informes = (data || []) as InformeSemestral[];
      setAllInformes(informes);

      // cargar profiles asociados (user_id / internal_responsible_id)
      const userIds = Array.from(
        new Set(
          informes.flatMap((i) =>
            [i.user_id, i.internal_responsible_id].filter(Boolean) as string[]
          )
        )
      );
      if (userIds.length > 0) {
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, full_name, username, email")
          .in("id", userIds);

        if (!pErr && profiles) {
          const map: Record<string, Profile> = {};
          profiles.forEach((p: any) => (map[p.id] = p));
          setProfilesMap(map);
        }
      } else {
        setProfilesMap({});
      }
    } catch (err) {
      console.error("Error cargando informes semestrales:", err);
      setAllInformes([]);
      setProfilesMap({});
    } finally {
      setLoading(false);
    }
  }

  // Aplica filtro por year seleccionado (si hay), sino muestra todos
  function applyYearFilter() {
    if (!selectedYearId || !years || years.length === 0) {
      setDisplayedInformes(allInformes);
      return;
    }

    const year = years.find((y) => y.id === selectedYearId);
    if (!year) {
      setDisplayedInformes(allInformes);
      return;
    }

    // si year_start/year_end existen, filtrar por created_at entre esos rangos (inclusive)
    if (year.year_start && year.year_end) {
      const start = new Date(year.year_start);
      const end = new Date(year.year_end);
      end.setHours(23, 59, 59, 999);
      const filtered = allInformes.filter((inf) => {
        if (!inf.created_at) return false;
        const c = new Date(inf.created_at);
        return c >= start && c <= end;
      });
      setDisplayedInformes(filtered);
    } else {
      // fallback: no hay rango, mostrar todos (para no perder historial)
      setDisplayedInformes(allInformes);
    }
  }

  function limpiarFormulario() {
    setPeriodo("");
    setDescripcion("");
    setActividades("");
    setLogros("");
    setDificultades("");
    setResumen("");
    setIsEditing(false);
    setEditId(null);
  }

  // Guardar informe: si el currentProfile tiene internal_responsible_id en su perfil
  // usaremos internal_responsible_id = currentProfile.id para detectar duplicados.
  const saveInforme = async () => {
    if (!periodo.trim()) return alert("Ingresa el periodo (ej. '2025 - Año 1').");
    if (!convenioId) return alert("Convenio inválido.");
    if (!currentProfile?.id) return alert("Usuario no autenticado.");

    setLoading(true);
    try {
      // validar duplicado: mismo convenio + mismo periodo + mismo responsable interno
      const { data: existing, error: existErr } = await supabase
        .from("informes_semestrales")
        .select("id")
        .eq("convenio_id", convenioId)
        .eq("periodo", periodo)
        .eq("internal_responsible_id", currentProfile.id)
        .maybeSingle();

      if (existErr) {
        console.error("Error comprobando duplicado:", existErr);
      } else if (existing) {
        // ya existe -> bloquear creación/duplicado (solo admin puede borrar/editar)
        alert(
          "Ya existe un informe para este periodo creado por usted. Si necesita modificarlo, edítelo o contacte al administrador."
        );
        setLoading(false);
        return;
      }

      const payload: any = {
        convenio_id: convenioId,
        periodo,
        descripcion,
        actividades,
        logros,
        dificultades,
        resumen,
        user_id: currentProfile.id, // quien lo creó (trazabilidad)
        internal_responsible_id: currentProfile.id,
      };

      if (isEditing && editId) {
        const { error } = await supabase
          .from("informes_semestrales")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("informes_semestrales")
          .insert([payload]);
        if (error) throw error;
      }

      await loadInformesSemestrales();
      limpiarFormulario();
    } catch (err: any) {
      console.error("Error guardando informe:", err);
      alert("Error guardando informe: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const editar = (inf: InformeSemestral) => {
    // solo puede editar quien sea el creador o admin — aquí no hacemos verificación de roles,
    // asume que el frontend controla permisos. Si quieres, implemento check adicional.
    setPeriodo(inf.periodo);
    setDescripcion(inf.descripcion ?? "");
    setActividades(inf.actividades ?? "");
    setLogros(inf.logros ?? "");
    setDificultades(inf.dificultades ?? "");
    setResumen(inf.resumen ?? "");
    setIsEditing(true);
    setEditId(inf.id);
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar informe? Esta acción es irreversible.")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("informes_semestrales").delete().eq("id", id);
      if (error) throw error;
      await loadInformesSemestrales();
    } catch (err: any) {
      console.error("Error eliminando informe:", err);
      alert("No se pudo eliminar: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // helper para mostrar username/full_name del autor
  const getAuthorLabel = (inf: InformeSemestral) => {
    const uid = inf.user_id ?? inf.internal_responsible_id;
    if (!uid) return "—";
    const p = profilesMap[uid];
    if (!p) return uid.slice(0, 8) + "...";
    return p.full_name ?? p.username ?? p.email ?? uid.slice(0, 8);
  };

  return (
    <div className="container py-4" style={{ maxWidth: 1000 }}>
      <h3 className="mb-3">📄 Informes Anuales del Convenio</h3>

      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {/* Selector de año */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label">Año del convenio (filtrar)</label>
              <select
                className="form-select"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
              >
                <option value="">— Mostrar todos los años —</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    Año {y.year_number} {y.year_start && `(${y.year_start} - ${y.year_end})`}
                  </option>
                ))}
              </select>
              <small className="text-muted d-block mt-1">
                Si necesitas ver informes históricos, selecciona "Mostrar todos".
              </small>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-primary w-100 mt-4" onClick={loadInformesSemestrales}>
                Refrescar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">{isEditing ? "Editar informe" : "Nuevo informe"}</h5>

          <div className="mb-3">
            <label className="form-label">Periodo</label>
            <input
              type="text"
              className="form-control"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              placeholder="Ej: 2025 - Año 1"
            />
            <small className="text-muted">Un mismo responsable no puede crear dos informes para el mismo periodo.</small>
          </div>

          <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea className="form-control" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Actividades</label>
            <textarea className="form-control" rows={2} value={actividades} onChange={(e) => setActividades(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Logros</label>
            <textarea className="form-control" rows={2} value={logros} onChange={(e) => setLogros(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Dificultades</label>
            <textarea className="form-control" rows={2} value={dificultades} onChange={(e) => setDificultades(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Resumen</label>
            <textarea className="form-control" rows={2} value={resumen} onChange={(e) => setResumen(e.target.value)} />
          </div>

          <button className="btn btn-primary me-2" onClick={saveInforme} disabled={loading}>
            {isEditing ? "Actualizar" : "Guardar"}
          </button>
          {isEditing && (
            <button className="btn btn-secondary" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Informes registrados ({displayedInformes.length})</h5>

          {loading ? (
            <div>Cargando...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Descripción</th>
                    <th>Autor</th>
                    <th>Fecha</th>
                    <th style={{ width: 160 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedInformes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-muted">No hay informes para el filtro seleccionado.</td>
                    </tr>
                  ) : (
                    displayedInformes.map((inf) => (
                      <tr key={inf.id}>
                        <td>{inf.periodo}</td>
                        <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>{inf.descripcion ?? "-"}</td>
                        <td>{getAuthorLabel(inf)}</td>
                        <td>{inf.created_at ? new Date(inf.created_at).toLocaleString("es-PE") : "-"}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editar(inf)}>Editar</button>
                          <button className="btn btn-sm btn-danger" onClick={() => eliminar(inf.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}