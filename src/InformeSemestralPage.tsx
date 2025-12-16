// src/InformeSemestralPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

/**
 * InformeSemestralPage.tsx
 * Versión CORREGIDA - Soluciona error "usuario no autenticado"
 *
 * Cambios principales:
 * - Validación de userId antes de cargar informes
 * - Mejor manejo de errores en autenticación
 * - userId agregado como dependencia en useEffect
 */

/* -------------------------
   Tipos
   ------------------------- */
interface AgreementYear {
  id: string;
  agreement_id: string;
  year_number: number;
  year_start?: string | null;
  year_end?: string | null;
}

interface InformeSemestralRow {
  id: string;
  convenio_id?: string | null;
  user_id?: string | null;
  period_label?: string | null;
  periodo?: string | null;
  year_id?: string | null;
  descripcion?: string | null;
  actividades?: string | null;
  logros?: string | null;
  dificultades?: string | null;
  resumen?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  internal_responsible_id?: string | null;
  user_full_name?: string | null;
}

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  // UI / carga
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // auth / usuario
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  // agreement years (periodos anuales)
  const [agreementYears, setAgreementYears] = useState<AgreementYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [yearLabelMode, setYearLabelMode] = useState<"periodo" | "anio">("anio");

  // informes
  const [informes, setInformes] = useState<InformeSemestralRow[]>([]);
  const [selectedInforme, setSelectedInforme] = useState<InformeSemestralRow | null>(null);

  // formulario
  const [periodoInput, setPeriodoInput] = useState<string>("");
  const [resumen, setResumen] = useState<string>("");
  const [actividades, setActividades] = useState<string>("");
  const [logros, setLogros] = useState<string>("");
  const [dificultades, setDificultades] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");

  // perfiles cache para mostrar nombres
  const [profilesCache, setProfilesCache] = useState<Record<string, string>>({});

  // permisos
  const isAdmin = useMemo(() => ["admin", "Admin", "Administrador"].includes(userRole), [userRole]);
  const canEditGlobal = useMemo(() => ["admin", "Admin", "Administrador", "internal", "interno"].includes(userRole), [userRole]);

  // mensajes y errores UI
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------
     CORREGIDO: Obtener usuario y rol con mejor manejo de errores
     --------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        
        if (userErr) {
          console.error("Auth getUser error:", userErr);
          setError("Error de autenticación. Por favor, recarga la página.");
          return;
        }
        
        const user = userData?.user;
        if (!user) {
          setError("No hay usuario autenticado. Por favor, inicia sesión.");
          return;
        }
        
        setUserId(user.id);

        // Cargar perfil
        const { data: profileRows, error: profileErr } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) {
          console.error("Error cargando profile actual:", profileErr);
          // Continuar con rol vacío
        } else if (profileRows) {
          const role = profileRows.role || "";
          setUserRole(role);
        } else {
          console.warn("No se encontró perfil para este usuario");
        }
      } catch (err) {
        console.error("Error obteniendo usuario/rol:", err);
        setError("Error inesperado al cargar el usuario.");
      }
    })();
  }, []);

  /* ---------------------------
     Cargar años (agreement_years) y cache de perfiles
     --------------------------- */
  useEffect(() => {
    if (!convenioId) return;
    loadAgreementYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId]);

  const loadAgreementYears = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agreement_years")
        .select("id, year_number, year_start, year_end")
        .eq("agreement_id", convenioId)
        .order("year_number", { ascending: true });

      if (error) {
        console.error("Error cargando agreement_years:", error);
        setAgreementYears([]);
      } else {
        setAgreementYears((data as AgreementYear[]) || []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedYearId(data[0].id);
        }
      }

      await loadProfilesCache();
    } catch (err) {
      console.error("loadAgreementYears error:", err);
      setAgreementYears([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProfilesCache = async () => {
    try {
      const { data: pData, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name", { ascending: true });

      if (pErr) {
        console.error("Error cargando profiles list:", pErr);
        setProfilesCache({});
      } else {
        const map: Record<string, string> = {};
        (pData || []).forEach((r: any) => {
          if (r.id) map[r.id] = r.full_name || r.email || "Usuario";
        });
        setProfilesCache(map);
      }
    } catch (err) {
      console.error("loadProfilesCache error:", err);
      setProfilesCache({});
    }
  };

  /* ---------------------------
     CORREGIDO: Cargar informes solo cuando userId esté disponible
     --------------------------- */
  useEffect(() => {
    // ✅ VALIDACIÓN CRÍTICA: Solo cargar si tenemos convenioId Y userId
    if (!convenioId || !userId) return;
    loadInformes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId, selectedYearId, userId]); // ← userId agregado como dependencia

  const loadInformes = async () => {
    // ✅ VALIDACIÓN ADICIONAL: No cargar si no hay usuario
    if (!userId) {
      console.warn("loadInformes: userId no disponible aún");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from("informes_semestrales")
        .select("id, convenio_id, user_id, periodo, year_id, descripcion, actividades, logros, dificultades, resumen, created_at, updated_at");

      query = query.eq("convenio_id", convenioId);

      if (selectedYearId) {
        query = query.eq("year_id", selectedYearId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando informes:", error);
        setInformes([]);
        setError("No se pudieron cargar los informes. Revisa consola.");
      } else {
        const rows: InformeSemestralRow[] = (data || []).map((r: any) => ({
          ...r,
          user_full_name: r.user_id ? profilesCache[r.user_id] ?? null : null,
        }));
        setInformes(rows);
      }
    } catch (err) {
      console.error("loadInformes catch:", err);
      setInformes([]);
      setError("Error inesperado cargando informes.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     Util: limpiar formulario
     --------------------------- */
  const resetForm = () => {
    setPeriodoInput("");
    setResumen("");
    setActividades("");
    setLogros("");
    setDificultades("");
    setDescripcion("");
    setSelectedInforme(null);
  };

  /* ---------------------------
     Guardar nuevo informe / actualizar existente
     --------------------------- */
  const handleSave = async () => {
    if (!convenioId) {
      alert("No se encontró el convenio.");
      return;
    }
    const uid = userId;
    if (!uid) {
      alert("Usuario no autenticado.");
      return;
    }

    const yearIdToSave = selectedYearId || null;
    const periodoToSave = periodoInput?.trim() || null;

    if (!yearIdToSave && !periodoToSave) {
      alert("Selecciona un año o ingresa el periodo manualmente.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (selectedInforme) {
        // editar: solo autor o admin
        if (!isAdmin && selectedInforme.user_id !== uid) {
          alert("No puedes editar este informe (solo autor o admin).");
          setSaving(false);
          return;
        }

        const payload: any = {
          descripcion: descripcion || null,
          actividades: actividades || null,
          logros: logros || null,
          dificultades: dificultades || null,
          resumen: resumen || null,
          updated_at: new Date().toISOString(),
        };

        if (yearIdToSave) payload.year_id = yearIdToSave;
        if (periodoToSave) payload.periodo = periodoToSave;

        const { error } = await supabase.from("informes_semestrales").update(payload).eq("id", selectedInforme.id);

        if (error) {
          console.error("Error actualizar informe:", error);
          alert("Error al actualizar: " + error.message);
        } else {
          setMessage("Informe actualizado correctamente.");
          resetForm();
          await loadInformes();
        }
        setSaving(false);
        return;
      }

      // Validar existencia previa
      if (yearIdToSave) {
        const { data: existing, error: checkErr } = await supabase
          .from("informes_semestrales")
          .select("id")
          .eq("convenio_id", convenioId)
          .eq("user_id", uid)
          .eq("year_id", yearIdToSave)
          .maybeSingle();

        if (checkErr) {
          console.error("check existing error:", checkErr);
          alert("Error en validación de existencia.");
          setSaving(false);
          return;
        }

        if (existing) {
          alert("Ya registraste un informe para este año. Si necesitas corregirlo, contacta al administrador.");
          setSaving(false);
          return;
        }
      } else if (periodoToSave) {
        const { data: existing, error: checkErr } = await supabase
          .from("informes_semestrales")
          .select("id")
          .eq("convenio_id", convenioId)
          .eq("user_id", uid)
          .eq("periodo", periodoToSave)
          .maybeSingle();

        if (checkErr) {
          console.error("check existing error:", checkErr);
          alert("Error en validación de existencia.");
          setSaving(false);
          return;
        }

        if (existing) {
          alert("Ya registraste un informe para ese periodo. Si necesitas corregirlo, contacta al administrador.");
          setSaving(false);
          return;
        }
      }

      // Insertar
      const insertObj: any = {
        convenio_id: convenioId,
        user_id: uid,
        descripcion: descripcion || null,
        actividades: actividades || null,
        logros: logros || null,
        dificultades: dificultades || null,
        resumen: resumen || null,
        created_at: new Date().toISOString(),
      };

      if (yearIdToSave) insertObj.year_id = yearIdToSave;
      if (periodoToSave) insertObj.periodo = periodoToSave;

      const { error: insertErr } = await supabase.from("informes_semestrales").insert([insertObj]);

      if (insertErr) {
        console.error("Error insert informes_semestrales:", insertErr);
        alert("Error al guardar informe: " + insertErr.message);
      } else {
        setMessage("Informe guardado correctamente.");
        resetForm();
        await loadInformes();
      }
    } catch (err: any) {
      console.error("handleSave catch:", err);
      alert("Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------
     Eliminar informe (solo admin)
     --------------------------- */
  const handleDelete = async (id?: string) => {
    if (!isAdmin) {
      alert("Solo administrador puede eliminar informes. Contacte al admin.");
      return;
    }
    if (!id) return;
    if (!confirm("¿Eliminar este informe?")) return;

    try {
      const { error } = await supabase.from("informes_semestrales").delete().eq("id", id);
      if (error) {
        console.error("Error eliminar informe:", error);
        alert("Error al eliminar: " + error.message);
      } else {
        setMessage("Informe eliminado.");
        await loadInformes();
      }
    } catch (err) {
      console.error("handleDelete catch:", err);
      alert("Error inesperado eliminando.");
    }
  };

  /* ---------------------------
     Ver detalle de informe
     --------------------------- */
  const handleView = (inf: InformeSemestralRow) => {
    setSelectedInforme(inf);
    setPeriodoInput(inf.periodo ?? (inf.period_label ?? ""));
    setResumen(inf.resumen ?? "");
    setActividades(inf.actividades ?? "");
    setLogros(inf.logros ?? "");
    setDificultades(inf.dificultades ?? "");
    setDescripcion(inf.descripcion ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------------------
     Editar (preparar form para edición)
     --------------------------- */
  const handleEdit = (inf: InformeSemestralRow) => {
    if (!isAdmin && inf.user_id !== userId) {
      alert("Solo el autor o admin puede editar este informe.");
      return;
    }
    setSelectedInforme(inf);
    setPeriodoInput(inf.periodo ?? (inf.period_label ?? ""));
    setResumen(inf.resumen ?? "");
    setActividades(inf.actividades ?? "");
    setLogros(inf.logros ?? "");
    setDificultades(inf.dificultades ?? "");
    setDescripcion(inf.descripcion ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------------------
     Helpers UI: obtener etiqueta de año
     --------------------------- */
  const yearOptions = useMemo(() => {
    return agreementYears.map((y) => ({
      id: y.id,
      label: `Año ${y.year_number}${y.year_start ? ` (${new Date(y.year_start!).toLocaleDateString("es-PE")} — ${new Date(y.year_end!).toLocaleDateString("es-PE")})` : ""}`,
    }));
  }, [agreementYears]);

  /* ---------------------------
     Render
     --------------------------- */
  return (
    <div className="container py-4" style={{ maxWidth: 1000 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">📝 Informes Anuales / Semestrales</h3>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => { loadAgreementYears(); loadInformes(); }}>
            🔄 Refrescar
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      {/* mensajes */}
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Año del convenio</label>
              <select
                className="form-select"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
              >
                <option value="">(Todos los años)</option>
                {yearOptions.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-8">
              <small className="text-muted">
                Si tu institución usa periodos semestrales dentro del año, selecciona el año y en "Periodo"
                anota el semestre (ej. "Semestre 1 (ene-jun)").
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5>{selectedInforme ? "Editar informe" : "Nuevo informe"}</h5>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Periodo (texto libre o semestre)</label>
              <input className="form-control" value={periodoInput} onChange={(e) => setPeriodoInput(e.target.value)} placeholder="Ej: Semestre 1 (ene-jun) — 1° año" />
            </div>
            <div className="col-md-6">
              <label className="form-label">(Opcional) Asociar a año</label>
              <select className="form-select" value={selectedYearId} onChange={(e) => setSelectedYearId(e.target.value)}>
                <option value="">No asociar</option>
                {yearOptions.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">Resumen</label>
              <textarea className="form-control" rows={3} value={resumen} onChange={(e) => setResumen(e.target.value)} />
            </div>

            <div className="col-12">
              <label className="form-label">Actividades</label>
              <textarea className="form-control" rows={2} value={actividades} onChange={(e) => setActividades(e.target.value)} />
            </div>

            <div className="col-12">
              <label className="form-label">Logros</label>
              <textarea className="form-control" rows={2} value={logros} onChange={(e) => setLogros(e.target.value)} />
            </div>

            <div className="col-12">
              <label className="form-label">Dificultades</label>
              <textarea className="form-control" rows={2} value={dificultades} onChange={(e) => setDificultades(e.target.value)} />
            </div>

            <div className="col-12">
              <label className="form-label">Descripción</label>
              <textarea className="form-control" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-3 gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                resetForm();
                setSelectedInforme(null);
              }}
              disabled={saving}
            >
              Limpiar
            </button>

            {canEditGlobal ? (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {selectedInforme ? (saving ? "Actualizando..." : "Actualizar informe") : (saving ? "Guardando..." : "Guardar informe")}
              </button>
            ) : (
              <button className="btn btn-primary" disabled>
                No tienes permiso para guardar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de informes */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Informes registrados</h5>

          {loading ? (
            <div>Cargando...</div>
          ) : informes.length === 0 ? (
            <div className="text-muted">No hay informes registrados para este convenio/año.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Fecha</th>
                    <th style={{ width: 220 }}>Periodo / Año</th>
                    <th>Resumen</th>
                    <th style={{ width: 160 }}>Responsable</th>
                    <th style={{ width: 220 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {informes.map((inf) => (
                    <tr key={inf.id}>
                      <td>{inf.created_at ? new Date(inf.created_at).toLocaleString("es-PE") : "-"}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {inf.periodo ??
                            inf.period_label ??
                            (inf.year_id
                              ? (() => {
                                  const yr = agreementYears.find((y) => y.id === inf.year_id);
                                  return yr ? `Año ${yr.year_number}` : "Año (sin etiqueta)";
                                })()
                              : "—")}
                        </div>
                        <small className="text-muted">{inf.year_id ? `year_id: ${inf.year_id}` : ""}</small>
                      </td>
                      <td style={{ maxWidth: 420, whiteSpace: "pre-wrap" }}>{inf.resumen ?? inf.descripcion ?? "-"}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inf.user_full_name ?? profilesCache[inf.user_id || ""] ?? "Usuario"}</div>
                        <small className="text-muted">{inf.user_id ?? ""}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-info" onClick={() => handleView(inf)}>Ver</button>
                          {(isAdmin || inf.user_id === userId) && (
                            <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(inf)}>Editar</button>
                          )}
                          {isAdmin && (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(inf.id)}>Eliminar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Panel detalle rapido cuando se pulsa Ver */}
      {selectedInforme && (
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h5>Detalle del informe</h5>
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th style={{ width: 200 }}>Periodo</th>
                  <td>{selectedInforme.periodo ?? selectedInforme.period_label ?? (selectedInforme.year_id ? `Año ${agreementYears.find(y => y.id === selectedInforme.year_id)?.year_number ?? "-"}` : "-")}</td>
                </tr>
                <tr>
                  <th>Resumen</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{selectedInforme.resumen ?? "-"}</td>
                </tr>
                <tr>
                  <th>Actividades</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{selectedInforme.actividades ?? "-"}</td>
                </tr>
                <tr>
                  <th>Logros</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{selectedInforme.logros ?? "-"}</td>
                </tr>
                <tr>
                  <th>Dificultades</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{selectedInforme.dificultades ?? "-"}</td>
                </tr>
                <tr>
                  <th>Descripción</th>
                  <td style={{ whiteSpace: "pre-wrap" }}>{selectedInforme.descripcion ?? "-"}</td>
                </tr>
                <tr>
                  <th>Responsable</th>
                  <td>{selectedInforme.user_full_name ?? profilesCache[selectedInforme.user_id ?? ""] ?? "Usuario"}</td>
                </tr>
                <tr>
                  <th>Creado</th>
                  <td>{selectedInforme.created_at ? new Date(selectedInforme.created_at).toLocaleString("es-PE") : "-"}</td>
                </tr>
              </tbody>
            </table>

            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary" onClick={() => setSelectedInforme(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}