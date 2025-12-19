// src/InformeSemestralPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

/**
 * VERSIÓN SIMPLIFICADA Y MEJORADA
 * - UN solo selector de año (eliminado campo "periodo texto libre")
 * - Formulario simplificado (3 campos en lugar de 6)
 * - Vista diferenciada: Interno vs Admin
 * - Mejor UX con indicadores de estado
 */

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
  year_id?: string | null;
  contenido?: string | null; // 🆕 Campo unificado
  dificultades?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_full_name?: string | null;
}

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const [agreementYears, setAgreementYears] = useState<AgreementYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>("");

  const [informes, setInformes] = useState<InformeSemestralRow[]>([]);
  const [selectedInforme, setSelectedInforme] = useState<InformeSemestralRow | null>(null);

  // 🆕 Formulario simplificado (solo 2 campos)
  const [contenido, setContenido] = useState<string>("");
  const [dificultades, setDificultades] = useState<string>("");

  const [profilesCache, setProfilesCache] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    return ["admin", "Admin", "Administrador"].includes(userRole);
  }, [userRole]);

  const isInternal = useMemo(() => {
    return ["internal", "Internal", "interno", "Interno"].includes(userRole);
  }, [userRole]);

  // 🆕 Obtener informe del usuario actual para el año seleccionado
  const miInforme = useMemo(() => {
    if (!userId || !selectedYearId) return null;
    return informes.find(inf => inf.user_id === userId && inf.year_id === selectedYearId);
  }, [informes, userId, selectedYearId]);

  /* ---------------------------
     Autenticación
     --------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        
        if (userErr || !userData?.user) {
          setError("No hay usuario autenticado.");
          return;
        }
        
        setUserId(userData.user.id);

        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("user_id, full_name, role")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (!profileErr && profileData) {
          setUserRole(profileData.role || "");
        }
      } catch (err) {
        console.error("Error en autenticación:", err);
        setError("Error al cargar usuario.");
      }
    })();
  }, []);

  /* ---------------------------
     Cargar años
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
        console.error("Error cargando años:", error);
        setAgreementYears([]);
      } else {
        setAgreementYears((data as AgreementYear[]) || []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedYearId(data[0].id);
        }
      }

      await loadProfilesCache();
    } catch (err) {
      console.error("Error loadAgreementYears:", err);
      setAgreementYears([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProfilesCache = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .order("full_name", { ascending: true });

      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => {
          if (r.user_id) map[r.user_id] = r.full_name || "Usuario";
        });
        setProfilesCache(map);
      }
    } catch (err) {
      console.error("Error loadProfilesCache:", err);
    }
  };

  /* ---------------------------
     Cargar informes
     --------------------------- */
  useEffect(() => {
    if (!convenioId || !userId) return;
    loadInformes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId, selectedYearId, userId]);

  const loadInformes = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from("informes_semestrales")
        .select("id, convenio_id, user_id, year_id, contenido, dificultades, created_at, updated_at")
        .eq("convenio_id", convenioId);

      if (selectedYearId) {
        query = query.eq("year_id", selectedYearId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando informes:", error);
        setInformes([]);
      } else {
        const rows: InformeSemestralRow[] = (data || []).map((r: any) => ({
          ...r,
          user_full_name: r.user_id ? profilesCache[r.user_id] ?? null : null,
        }));
        setInformes(rows);
      }
    } catch (err) {
      console.error("Error loadInformes:", err);
      setInformes([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     Guardar/Actualizar informe
     --------------------------- */
  const handleSave = async () => {
    if (!convenioId || !userId || !selectedYearId) {
      alert("Faltan datos requeridos.");
      return;
    }

    if (!contenido.trim()) {
      alert("El contenido del informe es obligatorio.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (selectedInforme) {
        // Editar: solo autor o admin
        if (!isAdmin && selectedInforme.user_id !== userId) {
          alert("Solo puedes editar tu propio informe.");
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from("informes_semestrales")
          .update({
            contenido: contenido || null,
            dificultades: dificultades || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedInforme.id);

        if (error) {
          alert("Error al actualizar: " + error.message);
        } else {
          setMessage("✅ Informe actualizado correctamente.");
          resetForm();
          await loadInformes();
        }
      } else {
        // Validar si ya existe
        const { data: existing } = await supabase
          .from("informes_semestrales")
          .select("id")
          .eq("convenio_id", convenioId)
          .eq("user_id", userId)
          .eq("year_id", selectedYearId)
          .maybeSingle();

        if (existing) {
          alert("⚠️ Ya registraste un informe para este año.");
          setSaving(false);
          return;
        }

        // Insertar nuevo
        const { error } = await supabase.from("informes_semestrales").insert({
          convenio_id: convenioId,
          user_id: userId,
          year_id: selectedYearId,
          contenido: contenido || null,
          dificultades: dificultades || null,
          created_at: new Date().toISOString(),
        });

        if (error) {
          alert("Error al guardar: " + error.message);
        } else {
          setMessage("✅ Informe guardado correctamente.");
          resetForm();
          await loadInformes();
        }
      }
    } catch (err: any) {
      console.error("Error handleSave:", err);
      alert("Error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setContenido("");
    setDificultades("");
    setSelectedInforme(null);
  };

  /* ---------------------------
     Eliminar (solo admin)
     --------------------------- */
  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      alert("Solo administradores pueden eliminar.");
      return;
    }
    if (!confirm("¿Eliminar este informe?")) return;

    try {
      const { error } = await supabase.from("informes_semestrales").delete().eq("id", id);
      if (error) {
        alert("Error al eliminar: " + error.message);
      } else {
        setMessage("Informe eliminado.");
        await loadInformes();
      }
    } catch (err) {
      console.error("Error handleDelete:", err);
    }
  };

  /* ---------------------------
     Ver/Editar
     --------------------------- */
  const handleView = (inf: InformeSemestralRow) => {
    setSelectedInforme(inf);
    setContenido(inf.contenido ?? "");
    setDificultades(inf.dificultades ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = (inf: InformeSemestralRow) => {
    if (!isAdmin && inf.user_id !== userId) {
      alert("Solo puedes editar tu propio informe.");
      return;
    }
    setSelectedInforme(inf);
    setContenido(inf.contenido ?? "");
    setDificultades(inf.dificultades ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------------------
     RENDER
     --------------------------- */
  return (
    <div className="container py-4" style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">📝 Informes Anuales</h3>
        <div>
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => { loadAgreementYears(); loadInformes(); }}>
            🔄 Refrescar
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
            ← Volver
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {message && <div className="alert alert-success alert-dismissible fade show">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Selector de año */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <label className="form-label fw-bold">Año del convenio</label>
          <select
            className="form-select form-select-lg"
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
          >
            <option value="">Seleccione un año</option>
            {agreementYears.map((y) => (
              <option key={y.id} value={y.id}>
                Año {y.year_number} ({y.year_start ? new Date(y.year_start).toLocaleDateString("es-PE") : "—"} — {y.year_end ? new Date(y.year_end).toLocaleDateString("es-PE") : "—"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🆕 Vista para INTERNOS: Solo su informe */}
      {isInternal && selectedYearId && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Tu informe</h5>
              {miInforme ? (
                <span className="badge bg-success">✅ Completado</span>
              ) : (
                <span className="badge bg-warning text-dark">⚠️ Pendiente</span>
              )}
            </div>

            {miInforme ? (
              // Ya tiene informe → modo lectura
              <div>
                <div className="alert alert-info">
                  Ya enviaste tu informe para este año. Si necesitas editarlo, contacta al administrador.
                </div>
                <div className="mb-3">
                  <strong>Contenido:</strong>
                  <div className="border rounded p-3 bg-light mt-2" style={{ whiteSpace: "pre-wrap" }}>
                    {miInforme.contenido || "—"}
                  </div>
                </div>
                {miInforme.dificultades && (
                  <div className="mb-3">
                    <strong>Dificultades/Observaciones:</strong>
                    <div className="border rounded p-3 bg-light mt-2" style={{ whiteSpace: "pre-wrap" }}>
                      {miInforme.dificultades}
                    </div>
                  </div>
                )}
                <small className="text-muted">
                  Enviado: {miInforme.created_at ? new Date(miInforme.created_at).toLocaleString("es-PE") : "—"}
                </small>
              </div>
            ) : (
              // No tiene informe → formulario
              <div>
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Contenido del informe <span className="text-danger">*</span>
                  </label>
                  <small className="text-muted d-block mb-2">
                    Incluye: resumen de actividades, logros alcanzados y resultados obtenidos durante el periodo.
                  </small>
                  <textarea
                    className="form-control"
                    rows={8}
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    placeholder="Describe las actividades realizadas, logros y resultados..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Dificultades/Observaciones (opcional)</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={dificultades}
                    onChange={(e) => setDificultades(e.target.value)}
                    placeholder="Describe cualquier dificultad encontrada o comentarios adicionales..."
                  />
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                    Limpiar
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Guardando..." : "📤 Enviar informe"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🆕 Vista para ADMIN: Todos los informes */}
      {isAdmin && (
        <>
          {/* Formulario de edición/creación */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5>{selectedInforme ? "Editar informe" : "Nuevo informe"}</h5>

              <div className="mb-3">
                <label className="form-label fw-bold">Contenido <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Dificultades/Observaciones</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={dificultades}
                  onChange={(e) => setDificultades(e.target.value)}
                />
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                  Limpiar
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {selectedInforme ? (saving ? "Actualizando..." : "Actualizar") : (saving ? "Guardando..." : "Guardar")}
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de todos los informes */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Todos los informes</h5>

              {loading ? (
                <div>Cargando...</div>
              ) : informes.length === 0 ? (
                <div className="text-muted text-center py-4">
                  No hay informes registrados para este año.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Responsable</th>
                        <th>Año</th>
                        <th>Contenido</th>
                        <th style={{ width: 140 }}>Fecha</th>
                        <th style={{ width: 200 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {informes.map((inf) => (
                        <tr key={inf.id}>
                          <td>
                            <strong>{inf.user_full_name ?? profilesCache[inf.user_id || ""] ?? "Usuario"}</strong>
                          </td>
                          <td>
                            Año {agreementYears.find((y) => y.id === inf.year_id)?.year_number ?? "?"}
                          </td>
                          <td style={{ maxWidth: 400 }}>
                            <div style={{ 
                              overflow: "hidden", 
                              textOverflow: "ellipsis", 
                              display: "-webkit-box", 
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical"
                            }}>
                              {inf.contenido ?? "—"}
                            </div>
                          </td>
                          <td>
                            <small>{inf.created_at ? new Date(inf.created_at).toLocaleDateString("es-PE") : "—"}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-outline-info" onClick={() => handleView(inf)}>
                                Ver
                              </button>
                              <button className="btn btn-sm btn-outline-warning" onClick={() => handleEdit(inf)}>
                                Editar
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(inf.id)}>
                                Eliminar
                              </button>
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
        </>
      )}

      {/* Panel de detalle (modal-like) */}
      {selectedInforme && (
        <div className="card shadow-sm mt-4">
          <div className="card-body">
            <h5>Detalle del informe</h5>
            <hr />
            <div className="mb-3">
              <strong>Responsable:</strong> {selectedInforme.user_full_name ?? profilesCache[selectedInforme.user_id ?? ""] ?? "Usuario"}
            </div>
            <div className="mb-3">
              <strong>Año:</strong> Año {agreementYears.find(y => y.id === selectedInforme.year_id)?.year_number ?? "?"}
            </div>
            <div className="mb-3">
              <strong>Contenido:</strong>
              <div className="border rounded p-3 bg-light mt-2" style={{ whiteSpace: "pre-wrap" }}>
                {selectedInforme.contenido ?? "—"}
              </div>
            </div>
            {selectedInforme.dificultades && (
              <div className="mb-3">
                <strong>Dificultades/Observaciones:</strong>
                <div className="border rounded p-3 bg-light mt-2" style={{ whiteSpace: "pre-wrap" }}>
                  {selectedInforme.dificultades}
                </div>
              </div>
            )}
            <div className="mb-3">
              <small className="text-muted">
                Creado: {selectedInforme.created_at ? new Date(selectedInforme.created_at).toLocaleString("es-PE") : "—"}
              </small>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelectedInforme(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}