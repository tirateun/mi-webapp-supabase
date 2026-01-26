// src/MovilidadesManager.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import MovilidadForm from "./MovilidadForm";

interface Movilidad {
  id: string;
  tipo_participante: "estudiante" | "docente";
  tipo_programa: "intercambio" | "libre";
  direccion: "entrante" | "saliente";
  documento_identidad?: string;
  codigo_matricula?: string;
  codigo_docente?: string;
  nombres_completos: string;
  agreement_id?: string;
  institucion_id?: string;
  pais_texto?: string;
  institucion_texto?: string;
  pais?: string;
  nivel_academico?: string;
  escuela_programa?: string;
  tipo_estancia?: string;
  tipo_estancia_otra?: string;
  periodo?: string;
  fecha_inicio?: string;
  fecha_termino?: string;
  expediente_mesa_partes?: string;
  sede_rotacion?: string;
  especialidad?: string;
  resolucion_autorizacion?: string;
  antecedentes_seleccion?: string;
  apoyo_economico_resolucion?: string;
  modalidad?: string;
  status: string;
  notas?: string;
  informe_pdf_url?: string;
  informe_fecha?: string;
  created_at: string;
  // Relaciones
  agreement?: { id: string; name: string };
  institucion?: { id: string; nombre: string };
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

  // Filtros
  const [filterTipoParticipante, setFilterTipoParticipante] = useState<string>("all");
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

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMovilidades();
    }
  }, [currentUser, filterTipoParticipante, filterTipoPrograma, filterDireccion, filterStatus, filterPais, filterYear]);

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
          institucion:instituciones(id, nombre)
        `)
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filterTipoParticipante !== "all") {
        query = query.eq("tipo_participante", filterTipoParticipante);
      }
      if (filterTipoPrograma !== "all") {
        query = query.eq("tipo_programa", filterTipoPrograma);
      }
      if (filterDireccion !== "all") {
        query = query.eq("direccion", filterDireccion);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      if (filterPais !== "all") {
        query = query.eq("pais", filterPais);
      }
      if (filterYear !== "all") {
        const startOfYear = `${filterYear}-01-01`;
        const endOfYear = `${filterYear}-12-31`;
        query = query.gte("fecha_inicio", startOfYear).lte("fecha_inicio", endOfYear);
      }

      const { data, error } = await query;

      if (error) throw error;

      let resultado = data || [];

      // Filtro de búsqueda por texto
      if (searchText.trim()) {
        const search = searchText.toLowerCase();
        resultado = resultado.filter((m: any) =>
          m.nombres_completos?.toLowerCase().includes(search) ||
          m.documento_identidad?.toLowerCase().includes(search) ||
          m.codigo_matricula?.toLowerCase().includes(search) ||
          m.codigo_docente?.toLowerCase().includes(search) ||
          m.institucion_texto?.toLowerCase().includes(search) ||
          m.agreement?.name?.toLowerCase().includes(search)
        );
      }

      setMovilidades(resultado);

      // Extraer países únicos
      const paises = [...new Set(resultado.map((m: any) => m.pais).filter(Boolean))];
      setPaisesUnicos(paises.sort());

    } catch (err) {
      console.error("Error fetching movilidades:", err);
      alert("Error al cargar movilidades");
    } finally {
      setLoading(false);
    }
  }

  const handleNuevaMovilidad = () => {
    setEditingMovilidad(null);
    setShowForm(true);
  };

  const handleEditMovilidad = (movilidad: Movilidad) => {
    setEditingMovilidad(movilidad);
    setShowForm(true);
  };

  const handleViewMovilidad = (movilidad: Movilidad) => {
    setViewingMovilidad(movilidad);
  };

  const handleDeleteMovilidad = async (id: string) => {
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

  const handleCambiarStatus = async (id: string, nuevoStatus: string) => {
    try {
      const { error } = await supabase
        .from("movilidades")
        .update({ status: nuevoStatus })
        .eq("id", id);

      if (error) throw error;
      fetchMovilidades();
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("❌ Error al cambiar estado: " + err.message);
    }
  };

  const limpiarFiltros = () => {
    setFilterTipoParticipante("all");
    setFilterTipoPrograma("all");
    setFilterDireccion("all");
    setFilterStatus("all");
    setFilterPais("all");
    setFilterYear("all");
    setSearchText("");
  };

  // ==========================================
  // BADGES Y HELPERS
  // ==========================================

  const getStatusBadge = (status: string) => {
    const config: any = {
      pendiente: { bg: "bg-warning", icon: "⏳", label: "Pendiente" },
      en_curso: { bg: "bg-info", icon: "🔄", label: "En Curso" },
      completada: { bg: "bg-success", icon: "✅", label: "Completada" },
      cancelada: { bg: "bg-danger", icon: "❌", label: "Cancelada" },
    };
    return config[status] || { bg: "bg-secondary", icon: "📋", label: status };
  };

  const getTipoParticipanteBadge = (tipo: string) => {
    return tipo === "estudiante" 
      ? { bg: "bg-primary", icon: "🎓", label: "Estudiante" }
      : { bg: "bg-purple", icon: "👨‍🏫", label: "Docente" };
  };

  const getDireccionBadge = (dir: string) => {
    return dir === "entrante"
      ? { bg: "bg-success-subtle text-success", icon: "📥", label: "Entrante" }
      : { bg: "bg-warning-subtle text-warning", icon: "📤", label: "Saliente" };
  };

  const getProgramaBadge = (prog: string) => {
    return prog === "intercambio"
      ? { bg: "bg-info-subtle text-info", icon: "🤝", label: "Intercambio" }
      : { bg: "bg-secondary-subtle text-secondary", icon: "📝", label: "Libre" };
  };

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  const stats = {
    total: movilidades.length,
    estudiantes: movilidades.filter(m => m.tipo_participante === "estudiante").length,
    docentes: movilidades.filter(m => m.tipo_participante === "docente").length,
    entrantes: movilidades.filter(m => m.direccion === "entrante").length,
    salientes: movilidades.filter(m => m.direccion === "saliente").length,
    intercambio: movilidades.filter(m => m.tipo_programa === "intercambio").length,
    libre: movilidades.filter(m => m.tipo_programa === "libre").length,
    pendientes: movilidades.filter(m => m.status === "pendiente").length,
    enCurso: movilidades.filter(m => m.status === "en_curso").length,
    completadas: movilidades.filter(m => m.status === "completada").length,
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
  // RENDER: MODAL DE DETALLE
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
                <span className={`badge ${getTipoParticipanteBadge(m.tipo_participante).bg}`}>
                  {getTipoParticipanteBadge(m.tipo_participante).icon} {getTipoParticipanteBadge(m.tipo_participante).label}
                </span>
                <span className={`badge ${getProgramaBadge(m.tipo_programa).bg}`}>
                  {getProgramaBadge(m.tipo_programa).icon} {getProgramaBadge(m.tipo_programa).label}
                </span>
                <span className={`badge ${getDireccionBadge(m.direccion).bg}`}>
                  {getDireccionBadge(m.direccion).icon} {getDireccionBadge(m.direccion).label}
                </span>
                <span className={`badge ${getStatusBadge(m.status).bg}`}>
                  {getStatusBadge(m.status).icon} {getStatusBadge(m.status).label}
                </span>
              </div>

              {/* Datos personales */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <strong>👤 Datos del {m.tipo_participante === "estudiante" ? "Estudiante" : "Docente"}</strong>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <small className="text-muted">
                        {m.direccion === "entrante" ? "Documento" : m.tipo_participante === "estudiante" ? "Código Matrícula" : "Código Docente"}
                      </small>
                      <p className="mb-0 fw-bold">
                        {m.direccion === "entrante" ? m.documento_identidad : m.tipo_participante === "estudiante" ? m.codigo_matricula : m.codigo_docente || "-"}
                      </p>
                    </div>
                    <div className="col-md-8">
                      <small className="text-muted">Nombres Completos</small>
                      <p className="mb-0 fw-bold">{m.nombres_completos}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Origen/Destino */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <strong>🌍 {m.direccion === "entrante" ? "Origen" : "Destino"}</strong>
                </div>
                <div className="card-body">
                  {m.tipo_programa === "intercambio" ? (
                    <>
                      <p className="mb-1"><strong>Convenio:</strong> {m.agreement?.name || "-"}</p>
                      <p className="mb-1"><strong>Institución:</strong> {m.institucion?.nombre || "-"}</p>
                      <p className="mb-0"><strong>País:</strong> {m.pais || "-"}</p>
                    </>
                  ) : (
                    <>
                      <p className="mb-1"><strong>Institución:</strong> {m.institucion_texto || "-"}</p>
                      <p className="mb-0"><strong>País:</strong> {m.pais_texto || m.pais || "-"}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Nivel Académico */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <strong>🏫 Nivel Académico</strong>
                </div>
                <div className="card-body">
                  <p className="mb-1"><strong>Nivel:</strong> {m.nivel_academico === "pregrado" ? "Pregrado" : "Postgrado"}</p>
                  <p className="mb-0"><strong>{m.nivel_academico === "pregrado" ? "Escuela" : "Programa"}:</strong> {m.escuela_programa || "-"}</p>
                </div>
              </div>

              {/* Estancia y Fechas */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <strong>📅 Estancia y Fechas</strong>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Tipo de Estancia:</strong> {m.tipo_estancia === "Otra" ? m.tipo_estancia_otra : m.tipo_estancia || "-"}</p>
                      <p className="mb-0"><strong>Periodo:</strong> {m.periodo || "-"}</p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1"><strong>Fecha Inicio:</strong> {formatDateLocal(m.fecha_inicio)}</p>
                      <p className="mb-0"><strong>Fecha Término:</strong> {formatDateLocal(m.fecha_termino)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos Administrativos */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <strong>📋 Datos Administrativos</strong>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4">
                      <small className="text-muted">Expediente</small>
                      <p className="mb-0">{m.expediente_mesa_partes || "-"}</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Sede Rotación</small>
                      <p className="mb-0">{m.sede_rotacion || "-"}</p>
                    </div>
                    <div className="col-md-4">
                      <small className="text-muted">Especialidad</small>
                      <p className="mb-0">{m.especialidad || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solo Salientes */}
              {m.direccion === "saliente" && (
                <div className="card mb-3 border-warning">
                  <div className="card-header bg-warning bg-opacity-25">
                    <strong>📤 Datos de Saliente</strong>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Resolución:</strong> {m.resolucion_autorizacion || "-"}</p>
                        <p className="mb-0"><strong>Modalidad:</strong> {m.modalidad ? (m.modalidad === "presencial" ? "Presencial" : "Virtual") : "-"}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Antecedentes:</strong> {m.antecedentes_seleccion || "-"}</p>
                        <p className="mb-0"><strong>Apoyo Económico:</strong> {m.apoyo_economico_resolucion || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {m.notas && (
                <div className="card">
                  <div className="card-header bg-light">
                    <strong>📝 Notas</strong>
                  </div>
                  <div className="card-body">
                    <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{m.notas}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setViewingMovilidad(null)}
              >
                Cerrar
              </button>
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
      {/* Modal de detalle */}
      {renderModalDetalle()}

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
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card text-center h-100">
            <div className="card-body">
              <h3 className="mb-0">{stats.total}</h3>
              <small className="text-muted">Total</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center h-100 border-primary">
            <div className="card-body">
              <h3 className="mb-0 text-primary">{stats.estudiantes}</h3>
              <small className="text-muted">🎓 Estudiantes</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center h-100 border-info">
            <div className="card-body">
              <h3 className="mb-0 text-info">{stats.docentes}</h3>
              <small className="text-muted">👨‍🏫 Docentes</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center h-100 border-success">
            <div className="card-body">
              <h3 className="mb-0 text-success">{stats.entrantes}</h3>
              <small className="text-muted">📥 Entrantes</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center h-100 border-warning">
            <div className="card-body">
              <h3 className="mb-0 text-warning">{stats.salientes}</h3>
              <small className="text-muted">📤 Salientes</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center h-100 border-secondary">
            <div className="card-body">
              <h3 className="mb-0">{stats.completadas}</h3>
              <small className="text-muted">✅ Completadas</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">🔍 Filtros</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-2 mb-2">
              <label className="form-label small">Participante</label>
              <select
                className="form-select form-select-sm"
                value={filterTipoParticipante}
                onChange={(e) => setFilterTipoParticipante(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="estudiante">🎓 Estudiante</option>
                <option value="docente">👨‍🏫 Docente</option>
              </select>
            </div>

            <div className="col-md-2 mb-2">
              <label className="form-label small">Programa</label>
              <select
                className="form-select form-select-sm"
                value={filterTipoPrograma}
                onChange={(e) => setFilterTipoPrograma(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="intercambio">🤝 Intercambio</option>
                <option value="libre">📝 Libre</option>
              </select>
            </div>

            <div className="col-md-2 mb-2">
              <label className="form-label small">Dirección</label>
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

            <div className="col-md-2 mb-2">
              <label className="form-label small">Estado</label>
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="pendiente">⏳ Pendiente</option>
                <option value="en_curso">🔄 En Curso</option>
                <option value="completada">✅ Completada</option>
                <option value="cancelada">❌ Cancelada</option>
              </select>
            </div>

            <div className="col-md-2 mb-2">
              <label className="form-label small">País</label>
              <select
                className="form-select form-select-sm"
                value={filterPais}
                onChange={(e) => setFilterPais(e.target.value)}
              >
                <option value="all">Todos</option>
                {paisesUnicos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2 mb-2">
              <label className="form-label small">Año</label>
              <select
                className="form-select form-select-sm"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="🔍 Buscar por nombre, código, institución..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyUp={fetchMovilidades}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de movilidades */}
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
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr>
                <th>Participante</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>País</th>
                <th>Periodo</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movilidades.map((m) => (
                <tr key={m.id}>
                  <td>
                    <span className={`badge ${m.tipo_participante === "estudiante" ? "bg-primary" : "bg-info"}`}>
                      {m.tipo_participante === "estudiante" ? "🎓" : "👨‍🏫"} {m.tipo_participante}
                    </span>
                    <br />
                    <small className={`badge ${getDireccionBadge(m.direccion).bg}`}>
                      {getDireccionBadge(m.direccion).icon} {m.direccion}
                    </small>
                  </td>
                  <td>
                    <strong>{m.nombres_completos}</strong>
                    <br />
                    <small className="text-muted">
                      {m.direccion === "entrante" ? m.documento_identidad : (m.codigo_matricula || m.codigo_docente)}
                    </small>
                  </td>
                  <td>
                    <span className={`badge ${getProgramaBadge(m.tipo_programa).bg}`}>
                      {getProgramaBadge(m.tipo_programa).label}
                    </span>
                    <br />
                    <small className="text-muted">
                      {m.tipo_programa === "intercambio" 
                        ? (m.agreement?.name?.substring(0, 30) + "...")
                        : m.institucion_texto?.substring(0, 30)}
                    </small>
                  </td>
                  <td>
                    <span className="badge bg-success-subtle text-success">
                      {m.pais || m.pais_texto || "-"}
                    </span>
                  </td>
                  <td>
                    <small>
                      {formatDateLocal(m.fecha_inicio)}
                      <br />
                      {formatDateLocal(m.fecha_termino)}
                    </small>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(m.status).bg}`}>
                      {getStatusBadge(m.status).icon} {getStatusBadge(m.status).label}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => handleViewMovilidad(m)}
                        title="Ver detalle"
                      >
                        👁️
                      </button>
                      {userRole === "admin" && (
                        <>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => handleEditMovilidad(m)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteMovilidad(m.id)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                    {/* Cambiar estado */}
                    {userRole === "admin" && (
                      <div className="mt-1">
                        <select
                          className="form-select form-select-sm"
                          value={m.status}
                          onChange={(e) => handleCambiarStatus(m.id, e.target.value)}
                          style={{ fontSize: "0.75rem" }}
                        >
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="en_curso">🔄 En Curso</option>
                          <option value="completada">✅ Completada</option>
                          <option value="cancelada">❌ Cancelada</option>
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer con conteo */}
      <div className="text-muted text-center mt-3">
        Mostrando {movilidades.length} movilidad{movilidades.length !== 1 ? "es" : ""}
      </div>
    </div>
  );
}