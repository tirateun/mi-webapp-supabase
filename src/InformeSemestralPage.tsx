// src/InformeSemestralPage.tsx - VERSIÓN PROFESIONAL MEJORADA
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from 'xlsx';

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
  subtype_id?: string | null; // 🆕 AGREGAR ESTA LÍNEA
  contenido?: string | null;
  dificultades?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_full_name?: string | null;
}

interface Subtype {
  id: string;
  subtipo_nombre: string;
  agreement_id: string;
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

  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [selectedSubtype, setSelectedSubtype] = useState<string>("");
  const [mySubtypes, setMySubtypes] = useState<string[]>([]); // IDs de subtipos donde soy responsable

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
    
    return informes.find(inf => 
      inf.user_id === userId && 
      inf.year_id === selectedYearId &&
      // 🆕 Comparar subtipo (o ambos null)
      (subtypes.length > 0 
        ? inf.subtype_id === selectedSubtype 
        : !inf.subtype_id)
    );
  }, [informes, userId, selectedYearId, selectedSubtype, subtypes]);

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
    loadSubtypes(); // 🆕 Cargar subtipos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId, userId, isInternal]);

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

  const loadSubtypes = async () => {
    if (!convenioId) return;
    
    try {
      // 1. Cargar todos los subtipos del convenio
      const { data: subtypesData, error: subtypesError } = await supabase
        .from("agreement_subtypes")
        .select("id, subtipo_nombre, agreement_id")
        .eq("agreement_id", convenioId)
        .order("subtipo_nombre", { ascending: true });
  
      if (subtypesError) throw subtypesError;
  
      setSubtypes(subtypesData || []);
  
      // 2. Si soy usuario interno, cargar MIS subtipos (donde soy responsable)
      if (isInternal && userId) {
        const subtypeIds = (subtypesData || []).map(s => s.id);
        
        if (subtypeIds.length > 0) {
          const { data: myResponsibilities } = await supabase
            .from("subtype_internal_responsibles")
            .select("subtype_id")
            .eq("internal_responsible_id", userId)
            .in("subtype_id", subtypeIds);
  
          const myIds = (myResponsibilities || []).map(r => r.subtype_id);
          setMySubtypes(myIds);
          
          // Auto-seleccionar el primer subtipo donde soy responsable
          if (myIds.length > 0 && !selectedSubtype) {
            setSelectedSubtype(myIds[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error cargando subtipos:", err);
      setSubtypes([]);
      setMySubtypes([]);
    }
  };

  useEffect(() => {
    if (!convenioId || !userId) return;
    loadInformes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convenioId, selectedYearId, userId, selectedSubtype]); // 🆕 Agregado selectedSubtype

  const loadInformes = async () => {
    if (!userId) return;
  
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from("informes_semestrales")
        .select("id, convenio_id, user_id, year_id, subtype_id, contenido, dificultades, created_at, updated_at")
        .eq("convenio_id", convenioId);
  
      // Filtrar por año seleccionado
      if (selectedYearId) {
        query = query.eq("year_id", selectedYearId);
      }
  
      // 🔥 CORRECCIÓN PRINCIPAL: Filtro por subtipo
      if (subtypes.length > 0) {
        // Si hay subtipos en el convenio
        if (selectedSubtype) {
          // Si hay un subtipo seleccionado, filtrar por él
          query = query.eq("subtype_id", selectedSubtype);
        } else {
          // NO hay subtipo seleccionado
          if (isInternal && !isAdmin) {
            // Usuario interno SIN subtipo seleccionado → No mostrar nada
            setInformes([]);
            setLoading(false);
            return;
          }
          // Si es ADMIN y NO hay subtipo seleccionado → Mostrar TODOS (no aplicar filtro)
          // No agregamos query = query.eq(...) aquí
        }
      } else {
        // Si el convenio NO tiene subtipos, solo mostrar informes generales (sin subtipo)
        query = query.is("subtype_id", null);
      }
  
      // Si soy usuario interno (no admin), solo ver MIS informes
      if (isInternal && !isAdmin) {
        query = query.eq("user_id", userId);
      }
      // Si soy ADMIN, NO filtrar por user_id (ver todos los informes)
  
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
          .eq("subtype_id", subtypes.length > 0 ? selectedSubtype : null) // 🆕
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
          subtype_id: subtypes.length > 0 ? selectedSubtype : null, // 🆕
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

  // AGREGAR ESTA FUNCIÓN antes del return principal, después de handleView
  const exportarAExcel = () => {
    try {
      if (informes.length === 0) {
        alert("No hay informes para exportar");
        return;
      }

      // Preparar datos para exportar
      const datosParaExportar = informes.map((inf, index) => {
        const year = agreementYears.find(y => y.id === inf.year_id);
        const subtype = subtypes.find(s => s.id === inf.subtype_id); // 🆕
        
        return {
          'N°': index + 1,
          'Responsable': inf.user_full_name ?? profilesCache[inf.user_id || ""] ?? "Usuario",
          'Subtipo': subtype?.subtipo_nombre ?? 'General', // 🆕
          'Año': `Año ${year?.year_number ?? "?"}`,
          'Periodo': year ? `${new Date(year.year_start!).toLocaleDateString('es-PE')} - ${new Date(year.year_end!).toLocaleDateString('es-PE')}` : '-',
          'Contenido': inf.contenido ?? "Sin contenido",
          'Dificultades/Observaciones': inf.dificultades ?? "Sin observaciones",
          'Fecha de Envío': inf.created_at ? new Date(inf.created_at).toLocaleDateString('es-PE') : '-',
          'Última Actualización': inf.updated_at ? new Date(inf.updated_at).toLocaleDateString('es-PE') : '-'
        };
      });

      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosParaExportar);

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 5 },   // N°
        { wch: 30 },  // Responsable
        { wch: 40 },  // 🆕 Subtipo
        { wch: 10 },  // Año
        { wch: 25 },  // Periodo
        { wch: 80 },  // Contenido
        { wch: 60 },  // Dificultades
        { wch: 15 },  // Fecha Envío
        { wch: 15 },  // Última Actualización
      ];
      ws['!cols'] = columnWidths;

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Informes Anuales');

      // Generar nombre de archivo con fecha
      const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      const yearInfo = selectedYearId 
        ? `Año_${agreementYears.find(y => y.id === selectedYearId)?.year_number}`
        : 'Todos_los_años';
      const nombreArchivo = `Informes_${yearInfo}_${fecha}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      alert(`✅ Archivo exportado exitosamente: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('❌ Error al exportar a Excel. Revisa la consola.');
    }
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

      {/* 🆕 SELECTOR DE SUBTIPO (si hay subtipos) */}
      {subtypes.length > 0 && selectedYearId && (
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  <label className="form-label fw-bold mb-3">
                    <i className="bi bi-folder me-2 text-primary"></i>
                    Selecciona el Subtipo
                  </label>
                  
                  {isInternal && mySubtypes.length === 0 ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      No estás asignado como responsable de ningún subtipo de este convenio.
                    </div>
                  ) : (
                    <>
                      <div className="d-flex flex-wrap gap-2">
                        {subtypes
                          .filter(s => isAdmin || mySubtypes.includes(s.id)) // 🔒 Solo mis subtipos si soy interno
                          .map((subtype) => (
                            <button
                              key={subtype.id}
                              className={`btn ${
                                selectedSubtype === subtype.id 
                                  ? 'btn-primary' 
                                  : 'btn-outline-primary'
                              }`}
                              onClick={() => setSelectedSubtype(subtype.id)}
                            >
                              📚 {subtype.subtipo_nombre}
                              {selectedSubtype === subtype.id && informes.length > 0 && (
                                <span className="badge bg-light text-primary ms-2">
                                  {informes.length}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                      
                      {selectedSubtype && (
                        <div className="mt-3 p-3 bg-success bg-opacity-10 border border-success rounded">
                          <strong>✓ Subtipo seleccionado:</strong>{' '}
                          {subtypes.find(s => s.id === selectedSubtype)?.subtipo_nombre}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

      {/* VISTA PARA USUARIOS INTERNOS */}
      {isInternal && selectedYearId && (subtypes.length === 0 || selectedSubtype) && (
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
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4" style={{ maxWidth: '900px' }}>
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                  <h4 className="mb-0 fw-bold">
                    Tu Informe Anual
                  </h4>
                  {miInforme ? (
                    <span className="badge bg-success px-3 py-2">✅ Completado</span>
                  ) : (
                    <span className="badge bg-warning text-dark px-3 py-2">⚠️ Pendiente</span>
                  )}
                </div>

                {miInforme ? (
                  <>
                    <div className="alert alert-info mb-4">
                      ℹ️ Ya enviaste tu informe para este año. Si necesitas modificarlo, contacta al administrador.
                    </div>
                    
                    <div className="mb-4">
                      <h6 className="fw-bold mb-2">Contenido del Informe</h6>
                      <div className="border rounded p-3 bg-light" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {miInforme.contenido || "Sin contenido"}
                      </div>
                    </div>
                    
                    {miInforme.dificultades && (
                      <div className="mb-4">
                        <h6 className="fw-bold mb-2">Dificultades y Observaciones</h6>
                        <div className="border rounded p-3 bg-light" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                          {miInforme.dificultades}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-muted mt-3">
                      <small>📅 Enviado: {miInforme.created_at ? new Date(miInforme.created_at).toLocaleString("es-PE") : "—"}</small>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="alert alert-light border mb-4">
                      <strong>💡 Instrucciones:</strong> Completa los campos requeridos para enviar tu informe anual del convenio.
                    </div>

                    {/* Campo 1: Contenido */}
                    <div className="mb-4">
                      <label className="form-label fw-bold mb-1">
                        Contenido del Informe <span className="text-danger">*</span>
                      </label>
                      <div className="text-muted small mb-2">
                        Incluye: resumen de actividades, logros alcanzados y resultados obtenidos.
                      </div>
                      <textarea
                        className="form-control"
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        placeholder="Escribe aquí el contenido de tu informe..."
                        style={{ 
                          minHeight: '300px',
                          fontSize: '15px',
                          lineHeight: '1.6',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
                        }}
                      />
                    </div>

                    {/* Campo 2: Dificultades */}
                    <div className="mb-4">
                      <label className="form-label fw-bold mb-1">
                        Dificultades y Observaciones <span className="text-muted small">(opcional)</span>
                      </label>
                      <div className="text-muted small mb-2">
                        Describe obstáculos, limitaciones o recomendaciones.
                      </div>
                      <textarea
                        className="form-control"
                        value={dificultades}
                        onChange={(e) => setDificultades(e.target.value)}
                        placeholder="Escribe aquí las dificultades u observaciones..."
                        style={{ 
                          minHeight: '150px',
                          fontSize: '15px',
                          lineHeight: '1.6',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
                        }}
                      />
                    </div>

                    {/* Botones */}
                    <div className="d-flex gap-2 pt-3 border-top">
                      <button 
                        className="btn btn-outline-secondary" 
                        onClick={resetForm} 
                        disabled={saving}
                      >
                        Limpiar
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSave} 
                        disabled={saving || !contenido.trim()}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Guardando...
                          </>
                        ) : (
                          "Enviar Informe"
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
          {/* Panel de Estadísticas y Exportación */}
          <div className="row g-3 mb-4">
            {/* KPI: Total Informes */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Total Informes</h6>
                      <h2 className="mb-0 fw-bold">{informes.length}</h2>
                    </div>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>📋</div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI: Responsables Únicos */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Responsables</h6>
                      <h2 className="mb-0 fw-bold">
                        {new Set(informes.map(i => i.user_id)).size}
                      </h2>
                    </div>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>👥</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Exportar Excel */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="card-body text-white d-flex flex-column justify-content-center">
                  <button 
                    className="btn btn-light btn-lg shadow w-100"
                    onClick={exportarAExcel}
                    disabled={informes.length === 0}
                  >
                    <i className="bi bi-file-earmark-excel me-2"></i>
                    📥 Exportar a Excel
                  </button>
                  {informes.length === 0 && (
                    <small className="text-white opacity-75 mt-2 text-center">
                      No hay informes para exportar
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de informes */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 p-4">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0 fw-bold">
                  <i className="bi bi-list-ul me-2 text-primary"></i>
                  Todos los Informes del Año
                </h4>
                <span className="badge bg-primary px-3 py-2">
                  {informes.length} {informes.length === 1 ? 'informe' : 'informes'}
                </span>
              </div>
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
                  <p className="text-muted mt-3 mb-1">No hay informes registrados para este año</p>
                  <small className="text-muted">Los responsables internos podrán enviar sus informes cuando el periodo esté disponible</small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-4 py-3 fw-bold">Responsable</th>
                      <th className="px-4 py-3 fw-bold">Subtipo</th> {/* 🆕 */}
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
                          
                          {/* 🆕 PEGAR AQUÍ - Columna de Subtipo */}
                          <td className="px-4 py-3">
                            {subtypes.find(s => s.id === inf.subtype_id)?.subtipo_nombre ? (
                              <span className="badge bg-info">
                                📚 {subtypes.find(s => s.id === inf.subtype_id)?.subtipo_nombre}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">General</span>
                            )}
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
                                title="Ver detalles completos"
                              >
                                <i className="bi bi-eye"></i> Ver
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleDelete(inf.id)}
                                title="Eliminar informe"
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