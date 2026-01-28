// src/MovilidadesManager.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import MovilidadForm from "./MovilidadForm";

interface Movilidad {
  id: string;
  categoria: string;
  tipo_programa: string;
  direccion: string;
  documento_identidad?: string;
  codigo_matricula?: string;
  codigo_docente?: string;
  nombre_completo: string;
  agreement_id?: string;
  institucion_id?: string;
  pais_origen?: string;
  institucion_origen?: string;
  pais_destino?: string;
  institucion_destino?: string;
  destination_country?: string;
  destination_place?: string;
  nivel_academico?: string;
  escuela?: string;
  programa_especifico?: string;
  tipo_estancia?: string;
  tipo_estancia_otro?: string;
  periodo?: string;
  start_date?: string;
  end_date?: string;
  num_expediente_mesa_partes?: string;
  sede_rotacion?: string;
  especialidad_texto?: string;
  resolucion_autorizacion?: string;
  antecedentes_seleccion?: string;
  apoyo_economico?: string;
  modalidad?: string;
  status: string;
  notes?: string;
  // Campos de cumplimiento
  informe_texto?: string;
  informe_pdf_url?: string;
  informe_fecha?: string;
  informe_enviado?: boolean;
  informe_uploaded_by?: string;
  created_at: string;
  responsible_id: string;
  // Relaciones
  agreement?: { id: string; name: string };
  institucion?: { id: string; nombre: string };
  responsible?: { id: string; full_name: string; email: string };
}

// Función para formatear fechas sin problema de zona horaria
const formatDateLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  let fechaPura = dateString;
  if (dateString.includes("T")) {
    fechaPura = dateString.split("T")[0];
  }
  const [year, month, day] = fechaPura.split("-").map(Number);
  if (!year || !month || !day) return "-";
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
};

export default function MovilidadesManager() {
  const [movilidades, setMovilidades] = useState<Movilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovilidad, setEditingMovilidad] = useState<any>(null);
  const [viewingMovilidad, setViewingMovilidad] = useState<Movilidad | null>(null);
  const [cumplimientoMovilidad, setCumplimientoMovilidad] = useState<Movilidad | null>(null);

  // Filtros
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [filterTipoPrograma, setFilterTipoPrograma] = useState<string>("all");
  const [filterDireccion, setFilterDireccion] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPais, setFilterPais] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");

  // Usuario actual
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");

  // Catálogos para filtros
  const [paisesUnicos, setPaisesUnicos] = useState<string[]>([]);

  // Modal de cumplimiento
  const [informeTexto, setInformeTexto] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [enviandoInforme, setEnviandoInforme] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMovilidades();
    }
  }, [currentUser, filterCategoria, filterTipoPrograma, filterDireccion, filterStatus, filterPais, filterYear]);

  async function fetchCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("user_id", user.id)
        .single();

      setCurrentUser(profile);
      setUserRole(profile?.role || "");
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  }

  async function fetchMovilidades() {
    try {
      setLoading(true);

      let query = supabase
        .from("movilidades")
        .select(`
          *,
          agreement:agreements(id, name),
          institucion:instituciones(id, nombre),
          responsible:profiles!responsible_id(id, full_name, email)
        `)
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filterCategoria !== "all") {
        query = query.or(`categoria.eq.${filterCategoria},categoria.eq.${filterCategoria === 'estudiante' ? 'Estudiantil' : 'Docente'}`);
      }
      if (filterTipoPrograma !== "all") {
        query = query.or(`tipo_programa.eq.${filterTipoPrograma},tipo_programa.eq.${filterTipoPrograma === 'intercambio' ? 'Programa de Intercambio' : 'Programa Libre'}`);
      }
      if (filterDireccion !== "all") {
        query = query.or(`direccion.eq.${filterDireccion},direccion.eq.${filterDireccion.charAt(0).toUpperCase() + filterDireccion.slice(1)}`);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      if (filterYear !== "all") {
        const startOfYear = `${filterYear}-01-01`;
        const endOfYear = `${filterYear}-12-31`;
        query = query.gte("start_date", startOfYear).lte("start_date", endOfYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      let resultado = data || [];

      // Filtro de país
      if (filterPais !== "all") {
        resultado = resultado.filter((m: any) => 
          m.pais_origen === filterPais || 
          m.pais_destino === filterPais || 
          m.destination_country === filterPais
        );
      }

      // Filtro de búsqueda por texto
      if (searchText.trim()) {
        const search = searchText.toLowerCase();
        resultado = resultado.filter((m: any) =>
          m.nombre_completo?.toLowerCase().includes(search) ||
          m.documento_identidad?.toLowerCase().includes(search) ||
          m.codigo_matricula?.toLowerCase().includes(search) ||
          m.codigo_docente?.toLowerCase().includes(search) ||
          m.institucion_origen?.toLowerCase().includes(search) ||
          m.institucion_destino?.toLowerCase().includes(search) ||
          m.agreement?.name?.toLowerCase().includes(search)
        );
      }

      setMovilidades(resultado);

      // Extraer países únicos
      const paises = new Set<string>();
      resultado.forEach((m: any) => {
        if (m.pais_origen) paises.add(m.pais_origen);
        if (m.pais_destino) paises.add(m.pais_destino);
        if (m.destination_country && m.destination_country !== 'N/A') paises.add(m.destination_country);
      });
      setPaisesUnicos([...paises].sort());

    } catch (err) {
      console.error("Error fetching movilidades:", err);
      alert("Error al cargar movilidades");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleNuevaMovilidad = () => {
    setEditingMovilidad(null);
    setShowForm(true);
  };

  const handleEditMovilidad = (movilidad: Movilidad) => {
    if (movilidad.informe_enviado) {
      alert("⚠️ Esta movilidad ya tiene el informe enviado y no puede ser editada.");
      return;
    }
    setEditingMovilidad(movilidad);
    setShowForm(true);
  };

  const handleViewMovilidad = (movilidad: Movilidad) => {
    setViewingMovilidad(movilidad);
  };

  const handleCumplimiento = (movilidad: Movilidad) => {
    setCumplimientoMovilidad(movilidad);
    setInformeTexto(movilidad.informe_texto || "");
    setPdfUrl(movilidad.informe_pdf_url || null);
  };

  const handleDeleteMovilidad = async (id: string, informe_enviado?: boolean) => {
    if (informe_enviado) {
      alert("⚠️ No se puede eliminar una movilidad con informe enviado.");
      return;
    }
    if (!confirm("¿Seguro que deseas eliminar esta movilidad? Esta acción no se puede deshacer.")) return;

    try {
      const { error } = await supabase.from("movilidades").delete().eq("id", id);
      if (error) throw error;
      alert("✅ Movilidad eliminada correctamente");
      fetchMovilidades();
    } catch (err: any) {
      console.error("Error deleting movilidad:", err);
      alert("❌ Error al eliminar: " + err.message);
    }
  };

  const limpiarFiltros = () => {
    setFilterCategoria("all");
    setFilterTipoPrograma("all");
    setFilterDireccion("all");
    setFilterStatus("all");
    setFilterPais("all");
    setFilterYear("all");
    setSearchText("");
  };

  // ==========================================
  // CUMPLIMIENTO - Subir PDF
  // ==========================================

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("⚠️ Solo se permiten archivos PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert("⚠️ El archivo no debe superar los 10MB");
      return;
    }

    setUploadingPdf(true);
    try {
      const fileName = `movilidad_${cumplimientoMovilidad?.id}_${Date.now()}.pdf`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("movilidades-informes")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("movilidades-informes")
        .getPublicUrl(fileName);

      setPdfUrl(urlData.publicUrl);

      // Guardar URL en la movilidad
      await supabase
        .from("movilidades")
        .update({ informe_pdf_url: urlData.publicUrl })
        .eq("id", cumplimientoMovilidad?.id);

      alert("✅ PDF subido correctamente");
    } catch (err: any) {
      console.error("Error uploading PDF:", err);
      alert("❌ Error al subir PDF: " + err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  // ==========================================
  // CUMPLIMIENTO - Guardar Informe (sin enviar)
  // ==========================================

  const handleGuardarInforme = async () => {
    if (!cumplimientoMovilidad) return;

    try {
      const { error } = await supabase
        .from("movilidades")
        .update({
          informe_texto: informeTexto,
          updated_at: new Date().toISOString()
        })
        .eq("id", cumplimientoMovilidad.id);

      if (error) throw error;
      alert("✅ Informe guardado (aún no enviado)");
      fetchMovilidades();
    } catch (err: any) {
      console.error("Error saving informe:", err);
      alert("❌ Error al guardar: " + err.message);
    }
  };

  // ==========================================
  // CUMPLIMIENTO - Enviar Informe (bloquea edición)
  // ==========================================

  const handleEnviarInforme = async () => {
    if (!cumplimientoMovilidad) return;

    if (!informeTexto.trim()) {
      alert("⚠️ Debe escribir el informe del viaje");
      return;
    }

    if (!pdfUrl) {
      alert("⚠️ Debe subir el PDF con los medios verificables");
      return;
    }

    if (!confirm("¿Está seguro de enviar el informe? Una vez enviado NO podrá modificarse.")) {
      return;
    }

    setEnviandoInforme(true);
    try {
      const { error } = await supabase
        .from("movilidades")
        .update({
          informe_texto: informeTexto,
          informe_enviado: true,
          informe_fecha: new Date().toISOString().split("T")[0],
          informe_uploaded_by: currentUser?.id,
          status: "Completada",
          updated_at: new Date().toISOString()
        })
        .eq("id", cumplimientoMovilidad.id);

      if (error) throw error;

      alert("✅ Informe enviado correctamente. La movilidad ha sido marcada como Completada.");
      setCumplimientoMovilidad(null);
      fetchMovilidades();
    } catch (err: any) {
      console.error("Error sending informe:", err);
      alert("❌ Error al enviar: " + err.message);
    } finally {
      setEnviandoInforme(false);
    }
  };

  // ==========================================
  // BADGES Y HELPERS
  // ==========================================

  const getStatusBadge = (status: string) => {
    const config: any = {
      "Pendiente": { bg: "bg-warning text-dark", icon: "⏳" },
      "pendiente": { bg: "bg-warning text-dark", icon: "⏳" },
      "En curso": { bg: "bg-info", icon: "🔄" },
      "en_curso": { bg: "bg-info", icon: "🔄" },
      "Completada": { bg: "bg-success", icon: "✅" },
      "completada": { bg: "bg-success", icon: "✅" },
      "Cancelada": { bg: "bg-danger", icon: "❌" },
      "cancelada": { bg: "bg-danger", icon: "❌" },
    };
    return config[status] || { bg: "bg-secondary", icon: "📋" };
  };

  const getCategoriaBadge = (cat: string) => {
    const isEstudiante = cat?.toLowerCase().includes("estudi");
    return isEstudiante 
      ? { bg: "bg-primary", icon: "🎓", label: "Estudiante" }
      : { bg: "bg-info", icon: "👨‍🏫", label: "Docente" };
  };

  const getDireccionBadge = (dir: string) => {
    const isEntrante = dir?.toLowerCase() === "entrante";
    return isEntrante
      ? { bg: "bg-success-subtle text-success", icon: "📥", label: "Entrante" }
      : { bg: "bg-warning-subtle text-warning", icon: "📤", label: "Saliente" };
  };

  const getTipoProgramaBadge = (tipo: string) => {
    const isIntercambio = tipo?.toLowerCase().includes("intercambio");
    return isIntercambio
      ? { bg: "bg-info-subtle text-info", label: "Intercambio" }
      : { bg: "bg-secondary-subtle text-secondary", label: "Libre" };
  };

  const getPais = (m: Movilidad) => {
    if (m.direccion?.toLowerCase() === "entrante") {
      return m.pais_origen || "-";
    }
    return m.pais_destino || m.destination_country || "-";
  };

  const getInstitucion = (m: Movilidad) => {
    if (m.tipo_programa?.toLowerCase().includes("intercambio")) {
      return m.agreement?.name || m.institucion?.nombre || "-";
    }
    if (m.direccion?.toLowerCase() === "entrante") {
      return m.institucion_origen || "-";
    }
    return m.institucion_destino || m.destination_place || "-";
  };

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  const stats = {
    total: movilidades.length,
    estudiantes: movilidades.filter(m => m.categoria?.toLowerCase().includes("estudi")).length,
    docentes: movilidades.filter(m => m.categoria?.toLowerCase() === "docente").length,
    entrantes: movilidades.filter(m => m.direccion?.toLowerCase() === "entrante").length,
    salientes: movilidades.filter(m => m.direccion?.toLowerCase() === "saliente").length,
    completadas: movilidades.filter(m => m.status?.toLowerCase() === "completada").length,
    pendientes: movilidades.filter(m => m.status?.toLowerCase() === "pendiente").length,
  };

  // ==========================================
  // RENDER: FORMULARIO
  // ==========================================

  if (showForm) {
    return (
      <MovilidadForm
        existingMovilidad={editingMovilidad}
        onSave={() => {
          setShowForm(false);
          fetchMovilidades();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  // ==========================================
  // RENDER: MODAL DE DETALLE (VER)
  // ==========================================

  const renderModalDetalle = () => {
    if (!viewingMovilidad) return null;
    const m = viewingMovilidad;

    return (
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={() => setViewingMovilidad(null)}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div
              className="modal-header text-white"
              style={{ background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)" }}
            >
              <h5 className="modal-title">📋 Detalle de Movilidad</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setViewingMovilidad(null)}
              />
            </div>

            <div className="modal-body">
              {/* Badges de clasificación */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                <span className={`badge ${getCategoriaBadge(m.categoria).bg}`}>
                  {getCategoriaBadge(m.categoria).icon} {getCategoriaBadge(m.categoria).label}
                </span>
                <span className={`badge ${getTipoProgramaBadge(m.tipo_programa).bg}`}>
                  {getTipoProgramaBadge(m.tipo_programa).label}
                </span>
                <span className={`badge ${getDireccionBadge(m.direccion).bg}`}>
                  {getDireccionBadge(m.direccion).icon} {getDireccionBadge(m.direccion).label}
                </span>
                <span className={`badge ${getStatusBadge(m.status).bg}`}>
                  {getStatusBadge(m.status).icon} {m.status}
                </span>
                {m.informe_enviado && (
                  <span className="badge bg-success">
                    ✅ Informe Enviado
                  </span>
                )}
              </div>

              {/* Datos personales */}
              <div className="card mb-3">
                <div className="card-header bg-light py-2">
                  <strong>👤 Datos del Participante</strong>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <small className="text-muted">Identificación</small>
                      <p className="mb-0 fw-bold">
                        {m.documento_identidad || m.codigo_matricula || m.codigo_docente || "-"}
                      </p>
                    </div>
                    <div className="col-md-8">
                      <small className="text-muted">Nombres Completos</small>
                      <p className="mb-0 fw-bold">{m.nombre_completo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Origen/Destino */}
              <div className="card mb-3">
                <div className="card-header bg-light py-2">
                  <strong>🌍 {m.direccion?.toLowerCase() === "entrante" ? "Origen" : "Destino"}</strong>
                </div>
                <div className="card-body">
                  <p className="mb-1"><strong>País:</strong> {getPais(m)}</p>
                  <p className="mb-1"><strong>Institución:</strong> {getInstitucion(m)}</p>
                  {m.agreement && (
                    <p className="mb-0"><strong>Convenio:</strong> {m.agreement.name}</p>
                  )}
                </div>
              </div>

              {/* Nivel Académico */}
              <div className="card mb-3">
                <div className="card-header bg-light py-2">
                  <strong>🏫 Nivel Académico</strong>
                </div>
                <div className="card-body">
                  <p className="mb-1"><strong>Nivel:</strong> {m.nivel_academico || "-"}</p>
                  <p className="mb-0"><strong>Escuela/Programa:</strong> {m.programa_especifico || m.escuela || "-"}</p>
                </div>
              </div>

              {/* Fechas */}
              <div className="card mb-3">
                <div className="card-header bg-light py-2">
                  <strong>📅 Periodo</strong>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <small className="text-muted">Fecha Inicio</small>
                      <p className="mb-0">{formatDateLocal(m.start_date)}</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Fecha Término</small>
                      <p className="mb-0">{formatDateLocal(m.end_date)}</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Tipo Estancia</small>
                      <p className="mb-0">{m.tipo_estancia || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsable */}
              {m.responsible && (
                <div className="card mb-3">
                  <div className="card-header bg-light py-2">
                    <strong>👤 Responsable Interno</strong>
                  </div>
                  <div className="card-body">
                    <p className="mb-1"><strong>Nombre:</strong> {m.responsible.full_name}</p>
                    <p className="mb-0"><strong>Email:</strong> {m.responsible.email}</p>
                  </div>
                </div>
              )}

              {/* Informe (si existe) */}
              {m.informe_enviado && (
                <div className="card mb-3 border-success">
                  <div className="card-header bg-success text-white py-2">
                    <strong>📄 Informe de Viaje</strong>
                  </div>
                  <div className="card-body">
                    <p className="mb-2"><strong>Fecha de envío:</strong> {formatDateLocal(m.informe_fecha)}</p>
                    {m.informe_texto && (
                      <>
                        <p className="mb-1"><strong>Informe:</strong></p>
                        <p className="mb-2 p-2 bg-light rounded" style={{ whiteSpace: "pre-wrap" }}>
                          {m.informe_texto}
                        </p>
                      </>
                    )}
                    {m.informe_pdf_url && (
                      <a
                        href={m.informe_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success btn-sm"
                      >
                        📎 Ver Medios Verificables (PDF)
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewingMovilidad(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER: MODAL DE CUMPLIMIENTO
  // ==========================================

  const renderModalCumplimiento = () => {
    if (!cumplimientoMovilidad) return null;
    const m = cumplimientoMovilidad;
    const puedeEnviar = informeTexto.trim() && pdfUrl;
    const yaEnviado = m.informe_enviado;

    return (
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={() => setCumplimientoMovilidad(null)}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div
              className="modal-header text-white"
              style={{ background: yaEnviado ? "#28a745" : "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)" }}
            >
              <h5 className="modal-title">
                {yaEnviado ? "✅ Informe Enviado" : "📝 Cumplimiento de Movilidad"}
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setCumplimientoMovilidad(null)}
              />
            </div>

            <div className="modal-body">
              {/* Info del participante */}
              <div className="alert alert-info">
                <strong>{m.nombre_completo}</strong>
                <br />
                <small>
                  {getCategoriaBadge(m.categoria).label} | {getDireccionBadge(m.direccion).label} | {getTipoProgramaBadge(m.tipo_programa).label}
                </small>
                <br />
                <small>
                  {formatDateLocal(m.start_date)} - {formatDateLocal(m.end_date)}
                </small>
              </div>

              {yaEnviado ? (
                <>
                  {/* Vista de informe enviado (solo lectura) */}
                  <div className="alert alert-success">
                    <strong>✅ Este informe fue enviado el {formatDateLocal(m.informe_fecha)}</strong>
                    <br />
                    <small>No se pueden realizar modificaciones.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Informe del Viaje</label>
                    <div className="form-control bg-light" style={{ minHeight: "150px", whiteSpace: "pre-wrap" }}>
                      {m.informe_texto || "-"}
                    </div>
                  </div>

                  {m.informe_pdf_url && (
                    <div className="mb-3">
                      <label className="form-label fw-bold">Medios Verificables</label>
                      <br />
                      <a
                        href={m.informe_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-success"
                      >
                        📎 Ver PDF de Medios Verificables
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Formulario de cumplimiento */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      📝 Informe del Viaje *
                    </label>
                    <textarea
                      className="form-control"
                      rows={6}
                      value={informeTexto}
                      onChange={(e) => setInformeTexto(e.target.value)}
                      placeholder="Describa las actividades realizadas durante la movilidad, logros, observaciones, etc."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      📎 Medios Verificables (PDF) *
                    </label>
                    <p className="text-muted small mb-2">
                      Suba un PDF con fotos, copias de tickets, constancia de rotación, certificados, etc.
                    </p>
                    
                    {pdfUrl ? (
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-success">✅ PDF cargado</span>
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                          Ver PDF
                        </a>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setPdfUrl(null)}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        className="form-control"
                        accept=".pdf"
                        onChange={handleUploadPdf}
                        disabled={uploadingPdf}
                      />
                    )}
                    {uploadingPdf && (
                      <div className="mt-2">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Subiendo PDF...
                      </div>
                    )}
                  </div>

                  {/* Checklist de cumplimiento */}
                  <div className="card bg-light mb-3">
                    <div className="card-body">
                      <h6 className="mb-3">✓ Checklist de Cumplimiento</h6>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!informeTexto.trim()}
                          readOnly
                        />
                        <label className="form-check-label">
                          Informe del viaje redactado
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!pdfUrl}
                          readOnly
                        />
                        <label className="form-check-label">
                          PDF de medios verificables cargado
                        </label>
                      </div>
                    </div>
                  </div>

                  {puedeEnviar && (
                    <div className="alert alert-warning">
                      <strong>⚠️ Importante:</strong> Al enviar el informe, la movilidad quedará marcada como 
                      "Completada" y <strong>no podrá modificarse</strong>.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setCumplimientoMovilidad(null)}
              >
                Cerrar
              </button>
              
              {!yaEnviado && (
                <>
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleGuardarInforme}
                    disabled={!informeTexto.trim()}
                  >
                    💾 Guardar Borrador
                  </button>
                  
                  <button
                    className="btn btn-success"
                    onClick={handleEnviarInforme}
                    disabled={!puedeEnviar || enviandoInforme}
                  >
                    {enviandoInforme ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Enviando...
                      </>
                    ) : (
                      "📤 Enviar Informe"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER: PRINCIPAL
  // ==========================================

  return (
    <div style={{ padding: "2rem" }}>
      {/* Modales */}
      {renderModalDetalle()}
      {renderModalCumplimiento()}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1" style={{ color: "#3D1A4F" }}>
            🌍 Movilidades Académicas
          </h2>
          <p className="text-muted mb-0">
            Gestión de movilidad estudiantil y docente
          </p>
        </div>
        {userRole === "admin" && (
          <button
            className="btn btn-primary"
            onClick={handleNuevaMovilidad}
            style={{
              background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
              border: "none",
            }}
          >
            ➕ Registrar Movilidad
          </button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="row mb-4 g-3">
        <div className="col-6 col-md-2">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body py-3">
              <h3 className="mb-0">{stats.total}</h3>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card text-center h-100 border-0 shadow-sm" style={{ borderLeft: "4px solid #0d6efd !important" }}>
            <div className="card-body py-3">
              <h3 className="mb-0 text-primary">{stats.estudiantes}</h3>
              <small className="text-muted">🎓 Estudiantes</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body py-3">
              <h3 className="mb-0 text-info">{stats.docentes}</h3>
              <small className="text-muted">👨‍🏫 Docentes</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body py-3">
              <h3 className="mb-0 text-success">{stats.entrantes}</h3>
              <small className="text-muted">📥 Entrantes</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card text-center h-100 border-0 shadow-sm">
            <div className="card-body py-3">
              <h3 className="mb-0 text-warning">{stats.salientes}</h3>
              <small className="text-muted">📤 Salientes</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card text-center h-100 border-0 shadow-sm" style={{ borderLeft: "4px solid #198754 !important" }}>
            <div className="card-body py-3">
              <h3 className="mb-0 text-success">{stats.completadas}</h3>
              <small className="text-muted">✅ Completadas</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0">🔍 Filtros</h6>
            <button className="btn btn-sm btn-outline-secondary" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
        </div>
        <div className="card-body pt-0">
          <div className="row g-2">
            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="estudiante">🎓 Estudiante</option>
                <option value="docente">👨‍🏫 Docente</option>
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterTipoPrograma}
                onChange={(e) => setFilterTipoPrograma(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="intercambio">Intercambio</option>
                <option value="libre">Libre</option>
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterDireccion}
                onChange={(e) => setFilterDireccion(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="entrante">📥 Entrante</option>
                <option value="saliente">📤 Saliente</option>
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="Pendiente">⏳ Pendiente</option>
                <option value="En curso">🔄 En Curso</option>
                <option value="Completada">✅ Completada</option>
                <option value="Cancelada">❌ Cancelada</option>
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="all">Año</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            <div className="col-md-2">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="🔍 Buscar..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de movilidades */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-3 text-muted">Cargando movilidades...</p>
        </div>
      ) : movilidades.length === 0 ? (
        <div className="alert alert-info text-center">
          📭 No hay movilidades registradas con los filtros seleccionados
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: "#5B2C6F", color: "white" }}>
                <tr>
                  <th className="px-3">PARTICIPANTE</th>
                  <th>NOMBRE</th>
                  <th>TIPO</th>
                  <th>PAÍS</th>
                  <th>PERIODO</th>
                  <th>ESTADO</th>
                  <th className="text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {movilidades.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3">
                      <span className={`badge ${getCategoriaBadge(m.categoria).bg} me-1`}>
                        {getCategoriaBadge(m.categoria).icon} {getCategoriaBadge(m.categoria).label.toLowerCase()}
                      </span>
                      <br />
                      <small className={`badge ${getDireccionBadge(m.direccion).bg}`}>
                        {getDireccionBadge(m.direccion).icon} {getDireccionBadge(m.direccion).label}
                      </small>
                    </td>
                    <td>
                      <strong>{m.nombre_completo}</strong>
                      <br />
                      <small className="text-muted">
                        {getInstitucion(m)?.substring(0, 35)}...
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${getTipoProgramaBadge(m.tipo_programa).bg}`}>
                        {getTipoProgramaBadge(m.tipo_programa).label}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">
                        {getPais(m)}
                      </span>
                    </td>
                    <td>
                      <small>
                        {formatDateLocal(m.start_date)}
                        <br />
                        {formatDateLocal(m.end_date)}
                      </small>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(m.status).bg}`}>
                        {getStatusBadge(m.status).icon} {m.status}
                      </span>
                      {m.informe_enviado && (
                        <>
                          <br />
                          <small className="text-success">📄 Informe ✓</small>
                        </>
                      )}
                    </td>
                    <td className="text-center">
                      <div className="btn-group btn-group-sm">
                        {/* Ver */}
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleViewMovilidad(m)}
                          title="Ver detalle"
                        >
                          👁️
                        </button>
                        
                        {/* Editar (solo admin y si no está enviado) */}
                        {userRole === "admin" && !m.informe_enviado && (
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => handleEditMovilidad(m)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                        )}
                        
                        {/* Cumplimiento (admin o responsable) */}
                        {(userRole === "admin" || currentUser?.id === m.responsible_id) && (
                          <button
                            className={`btn ${m.informe_enviado ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => handleCumplimiento(m)}
                            title={m.informe_enviado ? "Ver informe" : "Registrar cumplimiento"}
                          >
                            {m.informe_enviado ? "✅" : "📝"}
                          </button>
                        )}
                        
                        {/* Eliminar (solo admin y si no está enviado) */}
                        {userRole === "admin" && !m.informe_enviado && (
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteMovilidad(m.id, m.informe_enviado)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="card-footer bg-white text-muted text-center">
            Mostrando {movilidades.length} movilidad{movilidades.length !== 1 ? "es" : ""}
          </div>
        </div>
      )}
    </div>
  );
}