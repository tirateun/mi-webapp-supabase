// src/InformeSemestralPage.tsx - VERSIÓN PROFESIONAL MEJORADA
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

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
  contenido?: string | null;
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

  const yearOptionsWithStatus = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return agreementYears.map((y) => {
      const inicio = new Date(y.year_start!);
      const fin = new Date(y.year_end!);
      
      const fechaInformarDesde = new Date(fin);
      fechaInformarDesde.setMonth(fechaInformarDesde.getMonth() - 2);

      let estado: 'vencido' | 'vigente' | 'proximo' | 'futuro';
      let puedeInformar = false;
      let icono = '';
      let razon = '';

      if (hoy > fin) {
        estado = 'vencido';
        puedeInformar = true;
        icono = '✅';
        razon = 'Periodo finalizado';
      } else if (hoy >= inicio && hoy <= fin) {
        estado = 'vigente';
        if (hoy >= fechaInformarDesde) {
          puedeInformar = true;
          icono = '📝';
          razon = 'Ya puedes informar';
        } else {
          puedeInformar = false;
          icono = '⏳';
          razon = `Disponible desde ${fechaInformarDesde.toLocaleDateString('es-PE')}`;
        }
      } else if (hoy < inicio) {
        const mesesHastaInicio = Math.ceil((inicio.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (mesesHastaInicio <= 2) {
          estado = 'proximo';
          puedeInformar = false;
          icono = '🔜';
          razon = `Inicia ${inicio.toLocaleDateString('es-PE')}`;
        } else {
          estado = 'futuro';
          puedeInformar = false;
          icono = '🔒';
          razon = `No disponible hasta ${fechaInformarDesde.toLocaleDateString('es-PE')}`;
        }
      } else {
        estado = 'futuro';
        puedeInformar = false;
        icono = '🔒';
        razon = 'No disponible aún';
      }

      return {
        ...y,
        estado,
        puedeInformar,
        icono,
        razon,
        fechaInformarDesde,
      };
    });
  }, [agreementYears]);

  const miInforme = useMemo(() => {
    if (!userId || !selectedYearId) return null;
    return informes.find(inf => inf.user_id === userId && inf.year_id === selectedYearId);
  }, [informes, userId, selectedYearId]);

  const yearSeleccionado = useMemo(() => {
    return yearOptionsWithStatus.find(y => y.id === selectedYearId);
  }, [yearOptionsWithStatus, selectedYearId]);

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

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 1400, backgroundColor: '#f8f9fa' }}>
      {/* HEADER */}
      <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-white">
              <h2 className="mb-1 fw-bold">📋 Informes Anuales</h2>
              <p className="mb-0 opacity-75">Gestión y seguimiento de informes del convenio</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-light shadow-sm" 
                onClick={() => { loadAgreementYears(); loadInformes(); }}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                {loading ? "Cargando..." : "Refrescar"}
              </button>
              <button className="btn btn-outline-light" onClick={() => navigate(-1)}>
                <i className="bi bi-arrow-left me-2"></i>
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      {message && (
        <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* SELECTOR DE AÑO */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-8">
              <label className="form-label fw-bold mb-3">
                <i className="bi bi-calendar-check me-2 text-primary"></i>
                Selecciona el año del convenio
              </label>
              <select
                className="form-select form-select-lg shadow-sm"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                style={{ fontSize: '1rem' }}
              >
                <option value="">-- Seleccione un año --</option>
                {yearOptionsWithStatus.map((y) => (
                  <option 
                    key={y.id} 
                    value={y.id}
                    disabled={!y.puedeInformar}
                  >
                    {y.icono} Año {y.year_number} ({y.year_start ? new Date(y.year_start).toLocaleDateString("es-PE") : "—"} — {y.year_end ? new Date(y.year_end).toLocaleDateString("es-PE") : "—"}) - {y.razon}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedYearId && yearSeleccionado && (
              <div className="col-md-4 mt-3 mt-md-0">
                <div className={`card border-0 h-100 ${
                  yearSeleccionado.estado === 'vencido' ? 'bg-secondary bg-opacity-10' :
                  yearSeleccionado.puedeInformar ? 'bg-success bg-opacity-10' : 'bg-warning bg-opacity-10'
                }`}>
                  <div className="card-body text-center">
                    <div style={{ fontSize: '2rem' }}>{yearSeleccionado.icono}</div>
                    <strong className="d-block mt-2">{yearSeleccionado.razon}</strong>
                    {yearSeleccionado.estado === 'vigente' && !yearSeleccionado.puedeInformar && (
                      <small className="text-muted d-block mt-1">
                        Disponible: {yearSeleccionado.fechaInformarDesde.toLocaleDateString('es-PE')}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VISTA PARA USUARIOS INTERNOS */}
      {isInternal && selectedYearId && (
        <>
          {yearSeleccionado && !yearSeleccionado.puedeInformar && (
            <div className="card border-0 shadow-sm mb-4 border-start border-warning border-4">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="me-3" style={{ fontSize: '2.5rem' }}>⏳</div>
                  <div>
                    <h5 className="mb-1 fw-bold">Periodo no disponible</h5>
                    <p className="mb-0">
                      Podrás enviar tu informe a partir del: <strong>{yearSeleccionado.fechaInformarDesde.toLocaleDateString('es-PE')}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {yearSeleccionado?.puedeInformar && (
            <div className="card border-0 shadow mb-4">
              <div className="card-header bg-white border-0 p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h3 className="mb-0 fw-bold text-primary">
                    📄 Tu Informe Anual
                  </h3>
                  {miInforme ? (
                    <span className="badge bg-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      ✅ Completado
                    </span>
                  ) : (
                    <span className="badge bg-warning text-dark" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      ⚠️ Pendiente
                    </span>
                  )}
                </div>
              </div>

              <div className="card-body p-4">
                {miInforme ? (
                  <>
                    <div className="alert alert-info border-0 shadow-sm mb-4" style={{ fontSize: '1rem' }}>
                      ℹ️ Ya enviaste tu informe para este año. Si necesitas modificarlo, contacta al administrador.
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="text-primary fw-bold mb-3">
                        📝 Contenido del Informe
                      </h5>
                      <div className="border rounded-3 p-4 bg-light" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: '1rem' }}>
                        {miInforme.contenido || "Sin contenido"}
                      </div>
                    </div>
                    
                    {miInforme.dificultades && (
                      <div className="mb-4">
                        <h5 className="text-warning fw-bold mb-3">
                          ⚠️ Dificultades y Observaciones
                        </h5>
                        <div className="border rounded-3 p-4 bg-light" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: '1rem' }}>
                          {miInforme.dificultades}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-muted">
                      <small>
                        📅 Enviado el: {miInforme.created_at ? new Date(miInforme.created_at).toLocaleString("es-PE") : "—"}
                      </small>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="alert alert-primary border-0 shadow-sm mb-4" style={{ fontSize: '1.05rem', padding: '1.25rem' }}>
                      💡 <strong>Completa los campos requeridos</strong> para enviar tu informe anual del convenio.
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold mb-2" style={{ fontSize: '1.25rem', color: '#0d6efd' }}>
                        📝 Contenido del Informe <span className="text-danger">*</span>
                      </label>
                      <small className="text-muted d-block mb-3" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                        Incluye: resumen ejecutivo de actividades, logros principales alcanzados y resultados cuantitativos obtenidos durante el periodo.
                      </small>
                      <textarea
                        className="form-control shadow-sm"
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        placeholder="Ejemplo:

Durante el año se realizaron las siguientes actividades...

Los logros principales incluyen...

Los resultados obtenidos fueron..."
                        style={{ 
                          fontSize: '1rem',
                          lineHeight: 1.8,
                          resize: 'vertical',
                          minHeight: '350px',
                          padding: '1rem'
                        }}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold mb-2" style={{ fontSize: '1.25rem', color: '#ffc107' }}>
                        ⚠️ Dificultades y Observaciones <span className="text-muted" style={{ fontSize: '1rem' }}>(opcional)</span>
                      </label>
                      <textarea
                        className="form-control shadow-sm"
                        value={dificultades}
                        onChange={(e) => setDificultades(e.target.value)}
                        placeholder="Describe los principales obstáculos encontrados, limitaciones, áreas de mejora o recomendaciones para el siguiente periodo..."
                        style={{ 
                          fontSize: '1rem',
                          lineHeight: 1.8,
                          resize: 'vertical',
                          minHeight: '200px',
                          padding: '1rem'
                        }}
                      />
                    </div>

                    <div className="d-flex gap-3 justify-content-end pt-4 border-top">
                      <button 
                        className="btn btn-outline-secondary px-4 py-2" 
                        onClick={resetForm} 
                        disabled={saving}
                        style={{ fontSize: '1.05rem' }}
                      >
                        ❌ Limpiar
                      </button>
                      <button 
                        className="btn btn-primary px-5 py-2 shadow" 
                        onClick={handleSave} 
                        disabled={saving || !contenido.trim()}
                        style={{ fontSize: '1.05rem', fontWeight: '600' }}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Guardando...
                          </>
                        ) : (
                          <>
                            📤 Enviar Informe
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* VISTA PARA ADMINISTRADORES */}
      {isAdmin && selectedYearId && (
        <>
          {/* Formulario de edición */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0 p-4">
              <h4 className="mb-0 fw-bold">
                <i className="bi bi-pencil-square me-2 text-primary"></i>
                {selectedInforme ? "Editar Informe" : "Nuevo Informe"}
              </h4>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <label className="form-label fw-bold">
                  Contenido <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control shadow-sm"
                  rows={8}
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">Dificultades/Observaciones</label>
                <textarea
                  className="form-control shadow-sm"
                  rows={5}
                  value={dificultades}
                  onChange={(e) => setDificultades(e.target.value)}
                  style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
                />
              </div>

              <div className="d-flex gap-2 justify-content-end pt-3 border-top">
                <button className="btn btn-outline-secondary px-4" onClick={resetForm} disabled={saving}>
                  <i className="bi bi-x-circle me-2"></i>
                  Cancelar
                </button>
                <button className="btn btn-primary px-4 shadow-sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {selectedInforme ? "Actualizando..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      {selectedInforme ? "Actualizar" : "Guardar"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Lista de informes */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 p-4">
              <h4 className="mb-0 fw-bold">
                <i className="bi bi-list-ul me-2 text-primary"></i>
                Todos los Informes
              </h4>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="text-muted mt-3">Cargando informes...</p>
                </div>
              ) : informes.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '4rem', opacity: 0.3 }}>📋</div>
                  <p className="text-muted mt-3 mb-0">No hay informes registrados para este año</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="px-4 py-3 fw-bold">Responsable</th>
                        <th className="px-4 py-3 fw-bold">Año</th>
                        <th className="px-4 py-3 fw-bold" style={{ width: '40%' }}>Contenido</th>
                        <th className="px-4 py-3 fw-bold">Fecha</th>
                        <th className="px-4 py-3 fw-bold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {informes.map((inf, idx) => (
                        <tr key={inf.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                          <td className="px-4 py-3">
                            <strong>
                              <i className="bi bi-person me-2 text-primary"></i>
                              {inf.user_full_name ?? profilesCache[inf.user_id || ""] ?? "Usuario"}
                            </strong>
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge bg-primary">
                              Año {agreementYears.find((y) => y.id === inf.year_id)?.year_number ?? "?"}
                            </span>
                          </td>
                          <td className="px-4 py-3" style={{ maxWidth: 500 }}>
                            <div style={{ 
                              overflow: "hidden", 
                              textOverflow: "ellipsis", 
                              display: "-webkit-box", 
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              lineHeight: 1.5
                            }}>
                              {inf.contenido ?? "Sin contenido"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <small className="text-muted">
                              <i className="bi bi-calendar me-1"></i>
                              {inf.created_at ? new Date(inf.created_at).toLocaleDateString("es-PE") : "—"}
                            </small>
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex gap-2 justify-content-center">
                              <button 
                                className="btn btn-sm btn-outline-info" 
                                onClick={() => handleView(inf)}
                                title="Ver detalles"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-warning" 
                                onClick={() => handleEdit(inf)}
                                title="Editar"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDelete(inf.id)}
                                title="Eliminar"
                              >
                                <i className="bi bi-trash"></i>
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

      {/* MODAL DE DETALLE (cuando se hace clic en Ver) */}
      {selectedInforme && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setSelectedInforme(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-primary text-white">
                <h4 className="modal-title mb-0">
                  <i className="bi bi-file-text me-2"></i>
                  Detalle del Informe
                </h4>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedInforme(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <strong className="text-primary">
                      <i className="bi bi-person me-2"></i>
                      Responsable:
                    </strong>
                    <div className="mt-1">{selectedInforme.user_full_name ?? profilesCache[selectedInforme.user_id ?? ""] ?? "Usuario"}</div>
                  </div>
                  <div className="col-md-6">
                    <strong className="text-primary">
                      <i className="bi bi-calendar-check me-2"></i>
                      Año:
                    </strong>
                    <div className="mt-1">
                      Año {agreementYears.find(y => y.id === selectedInforme.year_id)?.year_number ?? "?"}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="text-primary fw-bold mb-3">
                    <i className="bi bi-file-text me-2"></i>
                    Contenido del Informe
                  </h6>
                  <div className="border rounded-3 p-4 bg-light" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                    {selectedInforme.contenido ?? "Sin contenido"}
                  </div>
                </div>

                {selectedInforme.dificultades && (
                  <div className="mb-4">
                    <h6 className="text-warning fw-bold mb-3">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Dificultades y Observaciones
                    </h6>
                    <div className="border rounded-3 p-4 bg-light" style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                      {selectedInforme.dificultades}
                    </div>
                  </div>
                )}

                <div className="text-muted">
                  <small>
                    <i className="bi bi-clock me-1"></i>
                    Fecha de creación: {selectedInforme.created_at ? new Date(selectedInforme.created_at).toLocaleString("es-PE") : "—"}
                  </small>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button className="btn btn-secondary" onClick={() => setSelectedInforme(null)}>
                  <i className="bi bi-x-circle me-2"></i>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}