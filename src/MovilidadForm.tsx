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
// CATÁLOGOS SEGÚN DOCUMENTOS
// ==========================================

const ESCUELAS_PREGRADO = [
  "Escuela Profesional de Medicina Humana",
  "Escuela Profesional de Nutrición",
  "Escuela Profesional de Obstetricia",
  "Escuela Profesional de Enfermería",
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

// Mapeo de escuela_programa a escuela (para constraint)
const ESCUELA_MAP: Record<string, string> = {
  "Escuela Profesional de Medicina Humana": "Medicina",
  "Escuela Profesional de Nutrición": "Nutrición",
  "Escuela Profesional de Obstetricia": "Obstetricia",
  "Escuela Profesional de Enfermería": "Enfermería",
  "Escuela Profesional de Tecnología Médica": "Tecnología Médica",
  "Programa de Segunda Especialización en Medicina Humana": "Medicina",
  "Programa de Segunda Especialización en Enfermería": "Enfermería",
  "Programa de Segunda Especialidad para Nutricionista": "Nutrición",
  "Programa de Segunda Especialidad para Obstetras": "Obstetricia",
  "Sección Maestría": "Medicina",
  "Sección Segunda Especialidad": "Medicina",
  "Sección Educación Médica Continua": "Medicina",
  "Sección Doctorado": "Medicina",
};

const TIPOS_ESTANCIA_ESTUDIANTE = [
  "Estancia académica",
  "Estancia en investigación",
  "Estancia de prácticas pre profesionales",
  "Estancia de Pasantía",
  "Otra",
];

const TIPOS_ESTANCIA_DOCENTE = [
  "Estancia académica",
  "Estancia en investigación",
  "Estancia de Pasantía",
  "Ponencia en evento científico",
  "Otra",
];

const PAISES_COMUNES = [
  "PERÚ", "ARGENTINA", "BRASIL", "CHILE", "COLOMBIA", "MÉXICO", "ESPAÑA",
  "ESTADOS UNIDOS", "ALEMANIA", "FRANCIA", "ITALIA", "REINO UNIDO", "JAPÓN",
  "CHINA", "CANADÁ", "AUSTRALIA", "PORTUGAL", "ECUADOR", "BOLIVIA", "PARAGUAY",
  "URUGUAY", "VENEZUELA", "COSTA RICA", "PANAMÁ", "CUBA", "REPÚBLICA DOMINICANA",
  "GUATEMALA", "HONDURAS", "EL SALVADOR", "NICARAGUA", "PUERTO RICO", "SUIZA",
  "BÉLGICA", "PAÍSES BAJOS", "AUSTRIA", "SUECIA", "NORUEGA", "DINAMARCA",
  "FINLANDIA", "POLONIA", "REPÚBLICA CHECA", "HUNGRÍA", "GRECIA", "TURQUÍA",
  "RUSIA", "INDIA", "COREA DEL SUR", "TAIWÁN", "SINGAPUR", "NUEVA ZELANDA"
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
  const [categoria, setCategoria] = useState<"estudiante" | "docente">("estudiante");
  const [tipoPrograma, setTipoPrograma] = useState<"intercambio" | "libre">("intercambio");
  const [direccion, setDireccion] = useState<"entrante" | "saliente">("entrante");

  // ==========================================
  // IDENTIFICACIÓN
  // ==========================================
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  const [codigoMatricula, setCodigoMatricula] = useState("");
  const [codigoDocente, setCodigoDocente] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  // ==========================================
  // ORIGEN/DESTINO
  // ==========================================
  const [convenios, setConvenios] = useState<any[]>([]);
  const [selectedConvenio, setSelectedConvenio] = useState<Option | null>(null);
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [selectedInstitucion, setSelectedInstitucion] = useState<Option | null>(null);
  
  // Para programa libre (texto)
  const [paisOrigen, setPaisOrigen] = useState("");
  const [institucionOrigen, setInstitucionOrigen] = useState("");
  const [paisDestino, setPaisDestino] = useState("");
  const [institucionDestino, setInstitucionDestino] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  
  // País del convenio (readonly)
  const [paisConvenio, setPaisConvenio] = useState("");

  // ==========================================
  // NIVEL ACADÉMICO
  // ==========================================
  const [nivelAcademico, setNivelAcademico] = useState<"Pregrado" | "Postgrado" | "">("");
  const [escuelaPrograma, setEscuelaPrograma] = useState("");
  const [programa, setPrograma] = useState("");
  const [cicloAcademico, setCicloAcademico] = useState("");

  // ==========================================
  // ESTANCIA
  // ==========================================
  const [tipoEstancia, setTipoEstancia] = useState("");
  const [tipoEstanciaOtro, setTipoEstanciaOtro] = useState("");

  // ==========================================
  // PERIODO Y FECHAS
  // ==========================================
  const [periodo, setPeriodo] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationMonths, setDurationMonths] = useState<number>(0);

  // ==========================================
  // ADMINISTRATIVO
  // ==========================================
  const [numExpediente, setNumExpediente] = useState("");
  const [sedeRotacion, setSedeRotacion] = useState("");
  const [especialidadTexto, setEspecialidadTexto] = useState("");

  // ==========================================
  // SOLO SALIENTES
  // ==========================================
  const [resolucionAutorizacion, setResolucionAutorizacion] = useState("");
  const [antecedentesSeleccion, setAntecedentesSeleccion] = useState("");
  const [apoyoEconomico, setApoyoEconomico] = useState("");
  const [modalidad, setModalidad] = useState<"Presencial" | "Virtual" | "">("");

  // ==========================================
  // RESPONSABLE Y NOTAS
  // ==========================================
  const [responsables, setResponsables] = useState<any[]>([]);
  const [selectedResponsable, setSelectedResponsable] = useState<Option | null>(null);
  const [notes, setNotes] = useState("");

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    fetchConvenios();
    fetchInstituciones();
    fetchResponsables();
  }, []);

  useEffect(() => {
    if (existingMovilidad && convenios.length > 0 && responsables.length > 0) {
      cargarDatosExistentes();
    }
  }, [existingMovilidad, convenios, responsables, instituciones]);

  // Calcular duración cuando cambian las fechas
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      setDurationMonths(diffMonths);
    }
  }, [startDate, endDate]);

  // Cuando cambia el convenio, actualizar país e institución
  useEffect(() => {
    if (selectedConvenio && tipoPrograma === "intercambio") {
      const convenio = convenios.find(c => c.id === selectedConvenio.value);
      if (convenio) {
        setPaisConvenio(convenio.pais || "");
        // Si el convenio tiene institución, seleccionarla
        if (convenio.institucion_id && instituciones.length > 0) {
          const inst = instituciones.find(i => i.id === convenio.institucion_id);
          if (inst) {
            setSelectedInstitucion({ value: inst.id, label: inst.nombre });
            if (direccion === "entrante") {
              setInstitucionOrigen(inst.nombre);
              setPaisOrigen(convenio.pais || "");
            } else {
              setInstitucionDestino(inst.nombre);
              setPaisDestino(convenio.pais || "");
            }
          }
        }
      }
    }
  }, [selectedConvenio, convenios, instituciones, tipoPrograma, direccion]);

  // ==========================================
  // FUNCIONES DE CARGA
  // ==========================================

  const cargarDatosExistentes = () => {
    const m = existingMovilidad;
    
    // Clasificación
    const cat = m.categoria?.toLowerCase() === 'docente' || m.categoria === 'Docente' ? 'docente' : 'estudiante';
    setCategoria(cat);
    
    const prog = m.tipo_programa?.toLowerCase().includes('libre') ? 'libre' : 'intercambio';
    setTipoPrograma(prog);
    
    const dir = m.direccion?.toLowerCase() === 'saliente' || m.direccion === 'Saliente' ? 'saliente' : 'entrante';
    setDireccion(dir);
    
    // Identificación
    setDocumentoIdentidad(m.documento_identidad || "");
    setCodigoMatricula(m.codigo_matricula || "");
    setCodigoDocente(m.codigo_docente || "");
    setNombreCompleto(m.nombre_completo || "");
    setEmail(m.email || "");
    setTelefono(m.telefono || "");
    
    // Origen/Destino
    setPaisOrigen(m.pais_origen || "");
    setInstitucionOrigen(m.institucion_origen || "");
    setPaisDestino(m.pais_destino || m.destination_country || "");
    setInstitucionDestino(m.institucion_destino || m.destination_place || "");
    setDestinationCity(m.destination_city || "");
    
    // Nivel académico
    const nivel = m.nivel_pregrado_postgrado || m.nivel_academico || "";
    if (nivel.toLowerCase().includes('post') || ['Maestría', 'Doctorado', 'Segunda Especialidad', 'Residentado'].includes(nivel)) {
      setNivelAcademico("Postgrado");
    } else if (nivel) {
      setNivelAcademico("Pregrado");
    }
    setEscuelaPrograma(m.programa_especifico || m.escuela_programa || "");
    setPrograma(m.programa || "");
    setCicloAcademico(m.ciclo_academico || "");
    
    // Estancia
    setTipoEstancia(m.tipo_estancia || "");
    setTipoEstanciaOtro(m.tipo_estancia_otro || "");
    
    // Periodo y fechas
    setPeriodo(m.periodo || "");
    setStartDate(m.start_date || "");
    setEndDate(m.end_date || "");
    
    // Administrativo
    setNumExpediente(m.num_expediente_mesa_partes || "");
    setSedeRotacion(m.sede_rotacion || "");
    setEspecialidadTexto(m.especialidad_texto || "");
    
    // Solo salientes
    setResolucionAutorizacion(m.resolucion_autorizacion || "");
    setAntecedentesSeleccion(m.antecedentes_seleccion || "");
    setApoyoEconomico(m.apoyo_economico || "");
    setModalidad(m.modalidad || "");
    
    // Notas
    setNotes(m.notes || "");

    // Convenio
    if (m.agreement_id) {
      const conv = convenios.find(c => c.id === m.agreement_id);
      if (conv) {
        setSelectedConvenio({ value: conv.id, label: conv.name });
        setPaisConvenio(conv.pais || "");
      }
    }

    // Institución
    if (m.institucion_id) {
      const inst = instituciones.find(i => i.id === m.institucion_id);
      if (inst) {
        setSelectedInstitucion({ value: inst.id, label: inst.nombre });
      }
    }

    // Responsable
    if (m.responsible_id) {
      const resp = responsables.find(r => r.id === m.responsible_id);
      if (resp) {
        setSelectedResponsable({ value: resp.id, label: resp.full_name });
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
        return String(conv.tipo_convenio).toLowerCase().includes("movilidad");
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

  async function fetchResponsables() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setResponsables(data || []);
    } catch (err) {
      console.error("Error fetching responsables:", err);
    }
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!nombreCompleto.trim()) {
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
        alert("⚠️ Debe seleccionar el nivel académico (Pregrado o Postgrado)");
        setLoading(false);
        return;
      }

      if (!escuelaPrograma) {
        alert("⚠️ Debe seleccionar la escuela o programa");
        setLoading(false);
        return;
      }

      if (!selectedResponsable) {
        alert("⚠️ Debe seleccionar un responsable interno");
        setLoading(false);
        return;
      }

      if (!startDate || !endDate) {
        alert("⚠️ Debe ingresar las fechas de inicio y término");
        setLoading(false);
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
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

      // Determinar escuela para el constraint (valor corto)
      const escuelaCorta = ESCUELA_MAP[escuelaPrograma] || "Medicina";

      // Determinar país y lugar de destino
      let destinationCountry = "N/A";
      let destinationPlace = "N/A";
      
      if (direccion === "saliente") {
        if (tipoPrograma === "intercambio") {
          destinationCountry = paisConvenio || paisDestino || "N/A";
          destinationPlace = selectedInstitucion?.label || institucionDestino || "N/A";
        } else {
          destinationCountry = paisDestino || "N/A";
          destinationPlace = institucionDestino || "N/A";
        }
      }

      // ==========================================
      // PAYLOAD COMPLETO
      // ==========================================
      const payload: any = {
        // Clasificación (valores que aceptan tanto mayúscula como minúscula)
        categoria: categoria === "estudiante" ? "Estudiantil" : "Docente",
        tipo_programa: tipoPrograma === "intercambio" ? "Programa de Intercambio" : "Programa Libre",
        direccion: direccion === "entrante" ? "Entrante" : "Saliente",
        
        // Identificación
        documento_identidad: direccion === "entrante" ? documentoIdentidad.trim() || null : null,
        codigo_matricula: direccion === "saliente" && categoria === "estudiante" ? codigoMatricula.trim() || null : null,
        codigo_docente: direccion === "saliente" && categoria === "docente" ? codigoDocente.trim() || null : null,
        nombre_completo: nombreCompleto.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null,
        
        // Convenio e institución
        agreement_id: tipoPrograma === "intercambio" ? selectedConvenio?.value || null : null,
        institucion_id: selectedInstitucion?.value || null,
        
        // Origen/Destino
        pais_origen: direccion === "entrante" ? (tipoPrograma === "intercambio" ? paisConvenio : paisOrigen) || null : null,
        institucion_origen: direccion === "entrante" ? (tipoPrograma === "intercambio" ? selectedInstitucion?.label : institucionOrigen) || null : null,
        pais_destino: direccion === "saliente" ? (tipoPrograma === "intercambio" ? paisConvenio : paisDestino) || null : null,
        institucion_destino: direccion === "saliente" ? (tipoPrograma === "intercambio" ? selectedInstitucion?.label : institucionDestino) || null : null,
        destination_country: destinationCountry,
        destination_place: destinationPlace,
        destination_city: destinationCity.trim() || null,
        
        // Nivel académico
        nivel_academico: nivelAcademico,
        nivel_pregrado_postgrado: nivelAcademico,
        escuela: escuelaCorta, // Valor corto para el constraint
        programa_especifico: escuelaPrograma, // Valor completo
        escuela_programa: escuelaPrograma,
        programa: programa.trim() || null,
        ciclo_academico: cicloAcademico.trim() || null,
        
        // Estancia
        tipo_estancia: tipoEstancia || null,
        tipo_estancia_otro: tipoEstancia === "Otra" ? tipoEstanciaOtro.trim() || null : null,
        
        // Periodo y fechas
        periodo: periodo.trim() || null,
        start_date: startDate,
        end_date: endDate,
        duration_months: durationMonths,
        
        // Administrativo
        num_expediente_mesa_partes: numExpediente.trim() || null,
        sede_rotacion: sedeRotacion.trim() || null,
        especialidad_texto: especialidadTexto.trim() || null,
        
        // Solo para salientes
        resolucion_autorizacion: direccion === "saliente" ? resolucionAutorizacion.trim() || null : null,
        antecedentes_seleccion: direccion === "saliente" ? antecedentesSeleccion.trim() || null : null,
        apoyo_economico: direccion === "saliente" ? apoyoEconomico.trim() || null : null,
        modalidad: direccion === "saliente" && modalidad ? modalidad : null,
        
        // Estado y notas
        status: existingMovilidad?.status || "Pendiente",
        notes: notes.trim() || null,
        
        // Responsable
        responsible_id: selectedResponsable?.value,
        
        updated_at: new Date().toISOString(),
      };

      console.log("📤 Payload a enviar:", payload);

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
  // HELPERS
  // ==========================================

  const getTiposEstancia = () => {
    return categoria === "docente" ? TIPOS_ESTANCIA_DOCENTE : TIPOS_ESTANCIA_ESTUDIANTE;
  };

  const getEscuelasProgramas = () => {
    return nivelAcademico === "Pregrado" ? ESCUELAS_PREGRADO : PROGRAMAS_POSTGRADO;
  };

  const conveniosOptions: Option[] = convenios.map(c => ({
    value: c.id,
    label: `${c.name} (${c.pais || 'Sin país'})`
  }));

  const institucionesOptions: Option[] = instituciones.map(i => ({
    value: i.id,
    label: `${i.nombre} (${i.pais || 'Sin país'})`
  }));

  const responsablesOptions: Option[] = responsables.map(r => ({
    value: r.id,
    label: `${r.full_name} (${r.email})`
  }));

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div style={{ padding: "2rem", maxWidth: "950px", margin: "0 auto" }}>
      <div className="card shadow-sm">
        <div
          className="card-header text-white"
          style={{
            background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              {existingMovilidad ? "✏️ Editar Movilidad" : "➕ Registrar Nueva Movilidad"}
            </h4>
            <span className="badge bg-light text-dark">
              {categoria === "estudiante" ? "🎓 Estudiante" : "👨‍🏫 Docente"} | 
              {tipoPrograma === "intercambio" ? " 🤝 Intercambio" : " 📝 Libre"} | 
              {direccion === "entrante" ? " 📥 Entrante" : " 📤 Saliente"}
            </span>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            
            {/* ==========================================
                SECCIÓN 1: CLASIFICACIÓN
            ========================================== */}
            <div className="card mb-4 border-primary">
              <div className="card-header bg-primary text-white py-2">
                <h6 className="mb-0">📋 Tipo de Movilidad</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Participante *</label>
                    <select
                      className="form-select"
                      value={categoria}
                      onChange={(e) => {
                        setCategoria(e.target.value as "estudiante" | "docente");
                        setTipoEstancia(""); // Reset tipo estancia
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
                        setPaisConvenio("");
                        setPaisOrigen("");
                        setPaisDestino("");
                        setInstitucionOrigen("");
                        setInstitucionDestino("");
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
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 2: DATOS PERSONALES
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">👤 Datos del {categoria === "estudiante" ? "Estudiante" : "Docente"}</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  {/* Documento/Código según dirección y categoría */}
                  <div className="col-md-3 mb-3">
                    {direccion === "entrante" ? (
                      <>
                        <label className="form-label fw-bold">N° Documento</label>
                        <input
                          type="text"
                          className="form-control"
                          value={documentoIdentidad}
                          onChange={(e) => setDocumentoIdentidad(e.target.value)}
                          placeholder="Pasaporte u otro"
                        />
                        <small className="text-muted">Principalmente pasaporte</small>
                      </>
                    ) : categoria === "estudiante" ? (
                      <>
                        <label className="form-label fw-bold">Código Matrícula</label>
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
                        <label className="form-label fw-bold">Código Docente</label>
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

                  <div className="col-md-5 mb-3">
                    <label className="form-label fw-bold">Nombres Completos *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      placeholder="Apellidos y nombres completos"
                      required
                    />
                  </div>

                  <div className="col-md-2 mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  <div className="col-md-2 mb-3">
                    <label className="form-label fw-bold">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+51 999..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 3: ORIGEN/DESTINO
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">
                  🌍 {direccion === "entrante" ? "Institución de Origen" : "Institución de Destino"}
                </h6>
              </div>
              <div className="card-body">
                {tipoPrograma === "intercambio" ? (
                  <>
                    {/* INTERCAMBIO: Seleccionar convenio */}
                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label fw-bold">Convenio de Movilidad *</label>
                        <Select
                          options={conveniosOptions}
                          value={selectedConvenio}
                          onChange={(option) => setSelectedConvenio(option)}
                          placeholder="Buscar convenio de movilidad..."
                          noOptionsMessage={() => "No hay convenios de movilidad disponibles"}
                          isClearable
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderColor: '#ced4da',
                            })
                          }}
                        />
                        <small className="text-muted">
                          Solo se muestran convenios con tipo "Movilidad académica"
                        </small>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Institución Académica</label>
                        <Select
                          options={institucionesOptions}
                          value={selectedInstitucion}
                          onChange={(option) => setSelectedInstitucion(option)}
                          placeholder="Seleccionar institución..."
                          isClearable
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label className="form-label fw-bold">País (del convenio)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={paisConvenio}
                          readOnly
                          style={{ backgroundColor: "#e9ecef" }}
                          placeholder="Se carga del convenio"
                        />
                      </div>

                      <div className="col-md-2 mb-3">
                        <label className="form-label fw-bold">Ciudad</label>
                        <input
                          type="text"
                          className="form-control"
                          value={destinationCity}
                          onChange={(e) => setDestinationCity(e.target.value)}
                          placeholder="Ciudad"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* LIBRE: Texto libre */}
                    <div className="row">
                      {direccion === "entrante" ? (
                        <>
                          <div className="col-md-5 mb-3">
                            <label className="form-label fw-bold">País de Origen *</label>
                            <select
                              className="form-select"
                              value={paisOrigen}
                              onChange={(e) => setPaisOrigen(e.target.value)}
                              required
                            >
                              <option value="">Seleccione país...</option>
                              {PAISES_COMUNES.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-7 mb-3">
                            <label className="form-label fw-bold">Institución Académica de Origen</label>
                            <input
                              type="text"
                              className="form-control"
                              value={institucionOrigen}
                              onChange={(e) => setInstitucionOrigen(e.target.value)}
                              placeholder="Universidad o institución de origen"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="col-md-4 mb-3">
                            <label className="form-label fw-bold">País de Destino *</label>
                            <select
                              className="form-select"
                              value={paisDestino}
                              onChange={(e) => setPaisDestino(e.target.value)}
                              required
                            >
                              <option value="">Seleccione país...</option>
                              {PAISES_COMUNES.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Institución de Destino</label>
                            <input
                              type="text"
                              className="form-control"
                              value={institucionDestino}
                              onChange={(e) => setInstitucionDestino(e.target.value)}
                              placeholder="Universidad o institución de destino"
                            />
                          </div>
                          <div className="col-md-2 mb-3">
                            <label className="form-label fw-bold">Ciudad</label>
                            <input
                              type="text"
                              className="form-control"
                              value={destinationCity}
                              onChange={(e) => setDestinationCity(e.target.value)}
                              placeholder="Ciudad"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 4: NIVEL ACADÉMICO
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">🏫 Nivel Académico</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Nivel *</label>
                    <select
                      className="form-select"
                      value={nivelAcademico}
                      onChange={(e) => {
                        setNivelAcademico(e.target.value as "Pregrado" | "Postgrado");
                        setEscuelaPrograma(""); // Reset escuela/programa
                      }}
                      required
                    >
                      <option value="">Seleccione...</option>
                      <option value="Pregrado">Pregrado</option>
                      <option value="Postgrado">Postgrado</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">
                      {nivelAcademico === "Pregrado" ? "Escuela Profesional *" : nivelAcademico === "Postgrado" ? "Programa *" : "Escuela/Programa *"}
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
                    {!nivelAcademico && (
                      <small className="text-muted">Primero seleccione el nivel académico</small>
                    )}
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Ciclo Académico</label>
                    <input
                      type="text"
                      className="form-control"
                      value={cicloAcademico}
                      onChange={(e) => setCicloAcademico(e.target.value)}
                      placeholder="Ej: 2025-I"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 5: TIPO DE ESTANCIA
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">📚 Tipo de Estancia</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Tipo de Estancia *</label>
                    <select
                      className="form-select"
                      value={tipoEstancia}
                      onChange={(e) => setTipoEstancia(e.target.value)}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {getTiposEstancia().map(te => (
                        <option key={te} value={te}>{te}</option>
                      ))}
                    </select>
                  </div>

                  {tipoEstancia === "Otra" && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Especificar tipo de estancia</label>
                      <input
                        type="text"
                        className="form-control"
                        value={tipoEstanciaOtro}
                        onChange={(e) => setTipoEstanciaOtro(e.target.value)}
                        placeholder="Especifique el tipo de estancia"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 6: RESPONSABLE
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">👤 Responsable Interno</h6>
              </div>
              <div className="card-body">
                <label className="form-label fw-bold">Responsable Asignado *</label>
                <Select
                  options={responsablesOptions}
                  value={selectedResponsable}
                  onChange={(option) => setSelectedResponsable(option)}
                  placeholder="Buscar responsable interno..."
                  noOptionsMessage={() => "No hay responsables disponibles"}
                  isClearable
                />
                <small className="text-muted">
                  Persona encargada de dar seguimiento y subir el informe final
                </small>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 7: PERIODO Y FECHAS
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">📅 Periodo y Fechas</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Periodo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      placeholder="Ej: Semestre 2025-I"
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Fecha de Inicio *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Fecha de Término *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label fw-bold">Duración</label>
                    <div className="form-control bg-light">
                      {durationMonths > 0 ? (
                        <span>⏱️ {durationMonths} {durationMonths === 1 ? 'mes' : 'meses'}</span>
                      ) : (
                        <span className="text-muted">--</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 8: DATOS ADMINISTRATIVOS
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">📋 Datos Administrativos</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">N° Expediente Mesa de Partes</label>
                    <input
                      type="text"
                      className="form-control"
                      value={numExpediente}
                      onChange={(e) => setNumExpediente(e.target.value)}
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
                      value={especialidadTexto}
                      onChange={(e) => setEspecialidadTexto(e.target.value)}
                      placeholder="Especialidad o área"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                SECCIÓN 9: SOLO SALIENTES
            ========================================== */}
            {direccion === "saliente" && (
              <div className="card mb-4 border-warning">
                <div className="card-header bg-warning bg-opacity-25 py-2">
                  <h6 className="mb-0">📤 Datos Adicionales (Solo Salientes)</h6>
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
                        onChange={(e) => setModalidad(e.target.value as "Presencial" | "Virtual" | "")}
                      >
                        <option value="">Seleccione...</option>
                        <option value="Presencial">Presencial</option>
                        <option value="Virtual">Virtual</option>
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
                      <label className="form-label fw-bold">Apoyo Económico con Resolución Decanal</label>
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
                SECCIÓN 10: NOTAS
            ========================================== */}
            <div className="card mb-4">
              <div className="card-header bg-light py-2">
                <h6 className="mb-0">📝 Notas Adicionales</h6>
              </div>
              <div className="card-body">
                <textarea
                  className="form-control"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones, comentarios adicionales..."
                />
              </div>
            </div>

            {/* ==========================================
                BOTONES
            ========================================== */}
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                ← Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-lg"
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
                  border: "none",
                  color: "white",
                  minWidth: "200px"
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Guardando...
                  </>
                ) : existingMovilidad ? (
                  "✓ Actualizar Movilidad"
                ) : (
                  "✓ Registrar Movilidad"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}