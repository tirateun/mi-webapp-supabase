// src/MovilidadForm.tsx
import { useEffect, useState } from "react";
import Select from "react-select";
import { supabase } from "./supabaseClient";

interface MovilidadFormProps {
  existingMovilidad?: any;
  onSave: () => void;
  onCancel: () => void;
}

interface Option {
  value: string;
  label: string;
}

// ==========================================
// CATÁLOGOS
// ==========================================

const ESCUELAS_PREGRADO = [
  "Escuela Profesional de Medicina Humana",
  "Escuela Profesional de Nutrición",
  "Escuela Profesional de Obstetricia",
  "Escuela de Tecnología Médica",
  "Escuela Profesional de Tecnología Médica",
];

const PROGRAMAS_POSTGRADO = [
  "Programa de Segunda Especialización en Medicina Humana",
  "Programa de Segunda Especialización en Enfermería",
  "Programa de Segunda Especialidad para Nutricionista",
  "Programa de Segunda Especialidad para Obstetras",
  "Sección Maestría",
  "Sección Segunda Especialidad",
  "Sección Educación Médica Continua",
  "Sección Doctorado",
];

const TIPOS_ESTANCIA_ESTUDIANTE = [
  "Estancia académica",
  "Estancia en investigación",
  "Estancia de prácticas pre profesionales",
  "Estancia de pasantía",
  "Otra",
];

const TIPOS_ESTANCIA_DOCENTE = [
  "Estancia académica",
  "Estancia en investigación",
  "Estancia de pasantía",
  "Ponencia en evento científico",
  "Otra",
];

const PAISES_COMUNES = [
  "PERÚ", "ARGENTINA", "BRASIL", "CHILE", "COLOMBIA", "MÉXICO", "ESPAÑA",
  "ESTADOS UNIDOS", "ALEMANIA", "FRANCIA", "ITALIA", "REINO UNIDO", "JAPÓN",
  "CHINA", "CANADÁ", "AUSTRALIA", "PORTUGAL", "ECUADOR", "BOLIVIA", "PARAGUAY",
  "URUGUAY", "VENEZUELA", "COSTA RICA", "PANAMÁ", "CUBA", "REPÚBLICA DOMINICANA"
].sort();

export default function MovilidadForm({
  existingMovilidad,
  onSave,
  onCancel,
}: MovilidadFormProps) {
  const [loading, setLoading] = useState(false);

  // ==========================================
  // CLASIFICACIÓN
  // ==========================================
  const [tipoParticipante, setTipoParticipante] = useState<"estudiante" | "docente">("estudiante");
  const [tipoPrograma, setTipoPrograma] = useState<"intercambio" | "libre">("intercambio");
  const [direccion, setDireccion] = useState<"entrante" | "saliente">("entrante");

  // ==========================================
  // IDENTIFICACIÓN
  // ==========================================
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  const [codigoMatricula, setCodigoMatricula] = useState("");
  const [codigoDocente, setCodigoDocente] = useState("");
  const [nombresCompletos, setNombresCompletos] = useState("");

  // ==========================================
  // ORIGEN/DESTINO
  // ==========================================
  const [convenios, setConvenios] = useState<any[]>([]);
  const [selectedConvenio, setSelectedConvenio] = useState<Option | null>(null);
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [selectedInstitucion, setSelectedInstitucion] = useState<Option | null>(null);
  const [paisTexto, setPaisTexto] = useState("");
  const [institucionTexto, setInstitucionTexto] = useState("");
  const [paisConvenio, setPaisConvenio] = useState("");

  // ==========================================
  // NIVEL ACADÉMICO
  // ==========================================
  const [nivelAcademico, setNivelAcademico] = useState<"pregrado" | "postgrado" | "">("");
  const [escuelaPrograma, setEscuelaPrograma] = useState("");

  // ==========================================
  // ESTANCIA
  // ==========================================
  const [tipoEstancia, setTipoEstancia] = useState("");
  const [tipoEstanciaOtra, setTipoEstanciaOtra] = useState("");

  // ==========================================
  // PERIODO Y FECHAS
  // ==========================================
  const [periodo, setPeriodo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaTermino, setFechaTermino] = useState("");

  // ==========================================
  // ADMINISTRATIVO
  // ==========================================
  const [expedienteMesaPartes, setExpedienteMesaPartes] = useState("");
  const [sedeRotacion, setSedeRotacion] = useState("");
  const [especialidad, setEspecialidad] = useState("");

  // ==========================================
  // SOLO SALIENTES
  // ==========================================
  const [resolucionAutorizacion, setResolucionAutorizacion] = useState("");
  const [antecedentesSeleccion, setAntecedentesSeleccion] = useState("");
  const [apoyoEconomico, setApoyoEconomico] = useState("");
  const [modalidad, setModalidad] = useState<"presencial" | "virtual" | "">("");

  // ==========================================
  // NOTAS
  // ==========================================
  const [notas, setNotas] = useState("");

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    fetchConvenios();
    fetchInstituciones();
  }, []);

  useEffect(() => {
    if (existingMovilidad) {
      cargarDatosExistentes();
    }
  }, [existingMovilidad, convenios, instituciones]);

  // Cuando cambia el convenio, actualizar país e institución
  useEffect(() => {
    if (selectedConvenio && tipoPrograma === "intercambio") {
      const convenio = convenios.find(c => c.id === selectedConvenio.value);
      if (convenio) {
        setPaisConvenio(convenio.pais || "");
        if (convenio.institucion_id) {
          const inst = instituciones.find(i => i.id === convenio.institucion_id);
          if (inst) {
            setSelectedInstitucion({ value: inst.id, label: inst.nombre });
          }
        }
      }
    }
  }, [selectedConvenio, convenios, instituciones, tipoPrograma]);

  // ==========================================
  // FUNCIONES
  // ==========================================

  const cargarDatosExistentes = () => {
    const m = existingMovilidad;
    // Clasificación - usar categoria si existe
    setTipoParticipante(m.tipo_participante || (m.categoria === 'docente' ? 'docente' : 'estudiante'));
    setTipoPrograma(m.tipo_programa || "intercambio");
    setDireccion(m.direccion || "entrante");
    
    // Identificación
    setDocumentoIdentidad(m.documento_identidad || "");
    setCodigoMatricula(m.codigo_matricula || "");
    setCodigoDocente(m.codigo_docente || "");
    setNombresCompletos(m.nombres_completos || m.nombre_completo || "");
    
    // Origen/Destino
    if (m.direccion === "entrante") {
      setPaisTexto(m.pais_origen || m.pais_texto || "");
      setInstitucionTexto(m.institucion_origen || m.institucion_texto || "");
    } else {
      setPaisTexto(m.pais_destino || m.pais_texto || "");
      setInstitucionTexto(m.institucion_destino || m.institucion_texto || m.destination_place || "");
    }
    
    // Nivel académico
    setNivelAcademico(m.nivel_pregrado_postgrado || m.nivel_academico || "");
    setEscuelaPrograma(m.programa_especifico || m.escuela_programa || m.escuela || "");
    
    // Estancia
    setTipoEstancia(m.tipo_estancia || "");
    setTipoEstanciaOtra(m.tipo_estancia_otro || m.tipo_estancia_otra || "");
    
    // Periodo y fechas
    setPeriodo(m.periodo || "");
    setFechaInicio(m.fecha_inicio || m.start_date || "");
    setFechaTermino(m.fecha_termino || m.end_date || "");
    
    // Administrativo
    setExpedienteMesaPartes(m.num_expediente_mesa_partes || m.expediente_mesa_partes || "");
    setSedeRotacion(m.sede_rotacion || "");
    setEspecialidad(m.especialidad_texto || m.especialidad || "");
    
    // Solo salientes
    setResolucionAutorizacion(m.resolucion_autorizacion || "");
    setAntecedentesSeleccion(m.antecedentes_seleccion || "");
    setApoyoEconomico(m.apoyo_economico || m.apoyo_economico_resolucion || "");
    setModalidad(m.modalidad || "");
    
    // Notas
    setNotas(m.notas || m.notes || "");

    // Cargar convenio si existe
    if (m.agreement_id && convenios.length > 0) {
      const conv = convenios.find(c => c.id === m.agreement_id);
      if (conv) {
        setSelectedConvenio({ value: conv.id, label: conv.name });
      }
    }

    // Cargar institución si existe
    if (m.institucion_id && instituciones.length > 0) {
      const inst = instituciones.find(i => i.id === m.institucion_id);
      if (inst) {
        setSelectedInstitucion({ value: inst.id, label: inst.nombre });
      }
    }
  };

  async function fetchConvenios() {
    try {
      const { data, error } = await supabase
        .from("agreements")
        .select("id, name, tipo_convenio, pais, institucion_id")
        .order("name");

      if (error) throw error;

      // Filtrar convenios que incluyen "Movilidad"
      const filtered = (data || []).filter((conv: any) => {
        if (!conv.tipo_convenio) return false;
        if (Array.isArray(conv.tipo_convenio)) {
          return conv.tipo_convenio.some((t: string) => 
            t.toLowerCase().includes("movilidad")
          );
        }
        return conv.tipo_convenio.toLowerCase().includes("movilidad");
      });

      setConvenios(filtered);
    } catch (err) {
      console.error("Error fetching convenios:", err);
    }
  }

  async function fetchInstituciones() {
    try {
      const { data, error } = await supabase
        .from("instituciones")
        .select("id, nombre, pais")
        .order("nombre");

      if (error) throw error;
      setInstituciones(data || []);
    } catch (err) {
      console.error("Error fetching instituciones:", err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!nombresCompletos.trim()) {
        alert("⚠️ Debe ingresar los nombres completos");
        setLoading(false);
        return;
      }

      if (tipoPrograma === "intercambio" && !selectedConvenio) {
        alert("⚠️ Debe seleccionar un convenio para programa de intercambio");
        setLoading(false);
        return;
      }

      if (!nivelAcademico) {
        alert("⚠️ Debe seleccionar el nivel académico");
        setLoading(false);
        return;
      }

      if (!escuelaPrograma) {
        alert("⚠️ Debe seleccionar la escuela o programa");
        setLoading(false);
        return;
      }

      if (!fechaInicio || !fechaTermino) {
        alert("⚠️ Debe ingresar las fechas de inicio y término");
        setLoading(false);
        return;
      }

      if (new Date(fechaTermino) < new Date(fechaInicio)) {
        alert("⚠️ La fecha de término debe ser posterior a la fecha de inicio");
        setLoading(false);
        return;
      }

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      // ==========================================
      // PAYLOAD CON NOMBRES EXACTOS DE TU TABLA
      // ==========================================
      const payload: any = {
        // Clasificación
        tipo_participante: tipoParticipante,
        tipo_programa: tipoPrograma,
        categoria: tipoParticipante, // Columna existente
        direccion,
        
        // Identificación
        documento_identidad: direccion === "entrante" ? documentoIdentidad.trim() || null : null,
        codigo_matricula: direccion === "saliente" && tipoParticipante === "estudiante" ? codigoMatricula.trim() || null : null,
        codigo_docente: direccion === "saliente" && tipoParticipante === "docente" ? codigoDocente.trim() || null : null,
        nombre_completo: nombresCompletos.trim(), // Columna existente (NOT NULL)
        nombres_completos: nombresCompletos.trim(), // Columna nueva
        
        // Convenio (para intercambio)
        agreement_id: tipoPrograma === "intercambio" ? selectedConvenio?.value || null : null,
        
        // Origen/Destino según dirección
        pais_origen: direccion === "entrante" ? paisTexto.toUpperCase() || null : null,
        institucion_origen: direccion === "entrante" ? institucionTexto.trim() || null : null,
        pais_destino: direccion === "saliente" ? (tipoPrograma === "intercambio" ? paisConvenio : paisTexto.toUpperCase()) || null : null,
        institucion_destino: direccion === "saliente" ? institucionTexto.trim() || null : null,
        destination_country: direccion === "saliente" ? (tipoPrograma === "intercambio" ? paisConvenio : paisTexto.toUpperCase()) || "N/A" : "N/A",
        destination_place: direccion === "saliente" ? institucionTexto.trim() || "N/A" : "N/A",
        
        // Nivel académico
        nivel_academico: nivelAcademico, // Columna existente (NOT NULL)
        nivel_pregrado_postgrado: nivelAcademico,
        escuela: escuelaPrograma, // Columna existente (NOT NULL)
        programa_especifico: escuelaPrograma,
        escuela_programa: escuelaPrograma,
        
        // Estancia
        tipo_estancia: tipoEstancia || null,
        tipo_estancia_otro: tipoEstancia === "Otra" ? tipoEstanciaOtra.trim() || null : null,
        
        // Periodo y fechas
        periodo: periodo.trim() || null,
        start_date: fechaInicio, // Columna existente (NOT NULL)
        end_date: fechaTermino, // Columna existente (NOT NULL)
        fecha_inicio: fechaInicio,
        fecha_termino: fechaTermino,
        
        // Administrativo
        num_expediente_mesa_partes: expedienteMesaPartes.trim() || null,
        sede_rotacion: sedeRotacion.trim() || null,
        especialidad_texto: especialidad.trim() || null, // Columna correcta
        
        // Solo para salientes
        resolucion_autorizacion: direccion === "saliente" ? resolucionAutorizacion.trim() || null : null,
        antecedentes_seleccion: direccion === "saliente" ? antecedentesSeleccion.trim() || null : null,
        apoyo_economico: direccion === "saliente" ? apoyoEconomico.trim() || null : null,
        modalidad: direccion === "saliente" ? modalidad || null : null,
        
        // Estado y notas
        status: existingMovilidad?.status || "pendiente",
        notes: notas.trim() || null, // Columna existente
        notas: notas.trim() || null,
        
        // Columnas requeridas con valores por defecto
        responsible_id: profile?.id, // Columna existente (NOT NULL)
        
        updated_at: new Date().toISOString(),
      };

      if (existingMovilidad) {
        const { error } = await supabase
          .from("movilidades")
          .update(payload)
          .eq("id", existingMovilidad.id);

        if (error) throw error;
        alert("✅ Movilidad actualizada correctamente");
      } else {
        payload.created_by = profile?.id;
        payload.created_at = new Date().toISOString();
        
        const { error } = await supabase.from("movilidades").insert([payload]);

        if (error) throw error;
        alert("✅ Movilidad registrada correctamente");
      }

      onSave();
    } catch (err: any) {
      console.error("Error saving movilidad:", err);
      alert("❌ Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HELPERS PARA OPCIONES
  // ==========================================

  const getTiposEstancia = () => {
    return tipoParticipante === "docente" ? TIPOS_ESTANCIA_DOCENTE : TIPOS_ESTANCIA_ESTUDIANTE;
  };

  const getEscuelasProgramas = () => {
    return nivelAcademico === "pregrado" ? ESCUELAS_PREGRADO : PROGRAMAS_POSTGRADO;
  };

  const conveniosOptions: Option[] = convenios.map(c => ({
    value: c.id,
    label: `${c.name} (${c.pais || 'Sin país'})`
  }));

  const institucionesOptions: Option[] = instituciones.map(i => ({
    value: i.id,
    label: `${i.nombre} (${i.pais || 'Sin país'})`
  }));

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div className="card shadow-sm">
        <div
          className="card-header text-white"
          style={{
            background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
          }}
        >
          <h4 className="mb-0">
            {existingMovilidad ? "✏️ Editar Movilidad" : "➕ Registrar Nueva Movilidad"}
          </h4>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            
            {/* ==========================================
                SECCIÓN 1: CLASIFICACIÓN
            ========================================== */}
            <div className="card mb-4 border-primary">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">📋 Tipo de Movilidad</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Participante *</label>
                    <select
                      className="form-select"
                      value={tipoParticipante}
                      onChange={(e) => {
                        setTipoParticipante(e.target.value as "estudiante" | "docente");
                        setTipoEstancia("");
                      }}
                      required
                    >
                      <option value="estudiante">🎓 Estudiante</option>
                      <option value="docente">👨‍🏫 Docente</option>
                    </select>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Programa *</label>
                    <select
                      className="form-select"
                      value={tipoPrograma}
                      onChange={(e) => {
                        setTipoPrograma(e.target.value as "intercambio" | "libre");
                        setSelectedConvenio(null);
                        setSelectedInstitucion(null);
                        setPaisTexto("");
                        setInstitucionTexto("");
                      }}
                      required
                    >
                      <option value="intercambio">🤝 Programa de Intercambio</option>
                      <option value="libre">📝 Programa Libre</option>
                    </select>
                    <small className="text-muted">
                      {tipoPrograma === "intercambio" 
                        ? "Vinculado a un convenio existente" 
                        : "Sin convenio (texto libre)"}
                    </small>
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Dirección *</label>
                    <select
                      className="form-select"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value as "entrante" | "saliente")}
                      required
                    >
                      <option value="entrante">📥 Entrante (viene a UNMSM)</option>
                      <option value="saliente">📤 Saliente (va desde UNMSM)</option>
                    </select>
                  </div>
                </div>

                <div className="alert alert-info mb-0">
                  <strong>Resumen:</strong> {tipoParticipante === "estudiante" ? "🎓 Estudiante" : "👨‍🏫 Docente"} 
                  {" / "}
                  {tipoPrograma === "intercambio" ? "🤝 Intercambio" : "📝 Libre"}
                  {" / "}
                  {direccion === "entrante" ? "📥 Entrante" : "📤 Saliente"}
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 2: DATOS PERSONALES
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">👤 Datos del {tipoParticipante === "estudiante" ? "Estudiante" : "Docente"}</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    {direccion === "entrante" ? (
                      <>
                        <label className="form-label fw-bold">N° Documento de Identidad</label>
                        <input
                          type="text"
                          className="form-control"
                          value={documentoIdentidad}
                          onChange={(e) => setDocumentoIdentidad(e.target.value)}
                          placeholder="Pasaporte u otro"
                        />
                      </>
                    ) : tipoParticipante === "estudiante" ? (
                      <>
                        <label className="form-label fw-bold">Código de Matrícula</label>
                        <input
                          type="text"
                          className="form-control"
                          value={codigoMatricula}
                          onChange={(e) => setCodigoMatricula(e.target.value)}
                          placeholder="Ej: 20180001"
                        />
                      </>
                    ) : (
                      <>
                        <label className="form-label fw-bold">Código de Docente</label>
                        <input
                          type="text"
                          className="form-control"
                          value={codigoDocente}
                          onChange={(e) => setCodigoDocente(e.target.value)}
                          placeholder="Código institucional"
                        />
                      </>
                    )}
                  </div>

                  <div className="col-md-8 mb-3">
                    <label className="form-label fw-bold">Nombres Completos *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={nombresCompletos}
                      onChange={(e) => setNombresCompletos(e.target.value)}
                      placeholder="Apellidos y nombres completos"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 3: ORIGEN/DESTINO
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">
                  🌍 {direccion === "entrante" ? "Origen" : "Destino"}
                </h5>
              </div>
              <div className="card-body">
                {tipoPrograma === "intercambio" ? (
                  <>
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label fw-bold">Convenio de Movilidad *</label>
                        <Select
                          options={conveniosOptions}
                          value={selectedConvenio}
                          onChange={(option) => setSelectedConvenio(option)}
                          placeholder="Buscar convenio..."
                          noOptionsMessage={() => "No hay convenios de movilidad disponibles"}
                          isClearable
                        />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Institución</label>
                        <Select
                          options={institucionesOptions}
                          value={selectedInstitucion}
                          onChange={(option) => setSelectedInstitucion(option)}
                          placeholder="Seleccionar institución..."
                          isClearable
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">País (del convenio)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={paisConvenio}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">
                          {direccion === "entrante" ? "País de Origen *" : "País de Destino *"}
                        </label>
                        <select
                          className="form-select"
                          value={paisTexto}
                          onChange={(e) => setPaisTexto(e.target.value)}
                          required={tipoPrograma === "libre"}
                        >
                          <option value="">Seleccione país...</option>
                          {PAISES_COMUNES.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">
                          {direccion === "entrante" ? "Institución de Origen" : "Institución de Destino"}
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={institucionTexto}
                          onChange={(e) => setInstitucionTexto(e.target.value)}
                          placeholder="Nombre de la institución"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 4: NIVEL ACADÉMICO
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">🏫 Nivel Académico</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Nivel *</label>
                    <select
                      className="form-select"
                      value={nivelAcademico}
                      onChange={(e) => {
                        setNivelAcademico(e.target.value as "pregrado" | "postgrado");
                        setEscuelaPrograma("");
                      }}
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option value="pregrado">Pregrado</option>
                      <option value="postgrado">Postgrado</option>
                    </select>
                  </div>

                  <div className="col-md-8 mb-3">
                    <label className="form-label fw-bold">
                      {nivelAcademico === "pregrado" ? "Escuela Profesional *" : "Programa *"}
                    </label>
                    <select
                      className="form-select"
                      value={escuelaPrograma}
                      onChange={(e) => setEscuelaPrograma(e.target.value)}
                      disabled={!nivelAcademico}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {getEscuelasProgramas().map(ep => (
                        <option key={ep} value={ep}>{ep}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 5: TIPO DE ESTANCIA
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">📚 Tipo de Estancia</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Tipo de Estancia</label>
                    <select
                      className="form-select"
                      value={tipoEstancia}
                      onChange={(e) => setTipoEstancia(e.target.value)}
                    >
                      <option value="">Seleccione...</option>
                      {getTiposEstancia().map(te => (
                        <option key={te} value={te}>{te}</option>
                      ))}
                    </select>
                  </div>

                  {tipoEstancia === "Otra" && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Especificar</label>
                      <input
                        type="text"
                        className="form-control"
                        value={tipoEstanciaOtra}
                        onChange={(e) => setTipoEstanciaOtra(e.target.value)}
                        placeholder="Especifique el tipo de estancia"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 6: PERIODO Y FECHAS
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">📅 Periodo y Fechas</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Periodo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      placeholder="Ej: Semestre 2025-I"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Fecha de Inicio *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Fecha de Término *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaTermino}
                      onChange={(e) => setFechaTermino(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 7: DATOS ADMINISTRATIVOS
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">📋 Datos Administrativos</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">N° Expediente Mesa de Partes</label>
                    <input
                      type="text"
                      className="form-control"
                      value={expedienteMesaPartes}
                      onChange={(e) => setExpedienteMesaPartes(e.target.value)}
                      placeholder="N° de expediente"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Sede de Rotación</label>
                    <input
                      type="text"
                      className="form-control"
                      value={sedeRotacion}
                      onChange={(e) => setSedeRotacion(e.target.value)}
                      placeholder="Sede donde realizará la rotación"
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Especialidad</label>
                    <input
                      type="text"
                      className="form-control"
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      placeholder="Especialidad o área"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 8: SOLO SALIENTES
            ========================================== */}
            {direccion === "saliente" && (
              <div className="card mb-4 border-warning">
                <div className="card-header bg-warning bg-opacity-25">
                  <h5 className="mb-0">📤 Datos Adicionales (Solo Salientes)</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Resolución de Autorización</label>
                      <input
                        type="text"
                        className="form-control"
                        value={resolucionAutorizacion}
                        onChange={(e) => setResolucionAutorizacion(e.target.value)}
                        placeholder="N° de resolución"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Modalidad</label>
                      <select
                        className="form-select"
                        value={modalidad}
                        onChange={(e) => setModalidad(e.target.value as "presencial" | "virtual")}
                      >
                        <option value="">Seleccione...</option>
                        <option value="presencial">Presencial</option>
                        <option value="virtual">Virtual</option>
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Antecedentes de Selección</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={antecedentesSeleccion}
                        onChange={(e) => setAntecedentesSeleccion(e.target.value)}
                        placeholder="Proceso de selección, requisitos cumplidos, etc."
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Apoyo Económico (Resolución Decanal)</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={apoyoEconomico}
                        onChange={(e) => setApoyoEconomico(e.target.value)}
                        placeholder="Detalles del apoyo económico si aplica"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==========================================
                SECCIÓN 9: NOTAS
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">📝 Notas Adicionales</h5>
              </div>
              <div className="card-body">
                <textarea
                  className="form-control"
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Observaciones, comentarios adicionales..."
                />
              </div>
            </div>

            {/* ==========================================
                BOTONES
            ========================================== */}
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
                  border: "none",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Guardando...
                  </>
                ) : existingMovilidad ? (
                  "Actualizar Movilidad"
                ) : (
                  "Registrar Movilidad"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}