// src/InformeSemestralForm.tsx

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

interface InformeSemestralFormProps {
  convenioId: string;
  convenioNombre: string;
  onClose: () => void;
  onSaved: () => void;
  informeExistente?: any;
}

interface AreaDetalle {
  area_vinculada_id: string;
  area_nombre: string;
  alumnos_internos: number;
  alumnos_cursos: number;
  documento_file?: File;
  documento_url?: string;
  documento_nombre?: string;
  observaciones: string;
}

export default function InformeSemestralForm({
  convenioId,
  convenioNombre,
  onClose,
  onSaved,
  informeExistente
}: InformeSemestralFormProps) {
  
  const [saving, setSaving] = useState(false);
  
  // 🆕 Estados para manejar subtipos
  const [subtiposDisponibles, setSubtiposDisponibles] = useState<any[]>([]);
  const [subtipoSeleccionado, setSubtipoSeleccionado] = useState<string>("");
  const [esPregrado, setEsPregrado] = useState(true);
  
  // Datos del informe
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [semestre, setSemestre] = useState<number>(1);
  const [sedeConvenio, setSedeConvenio] = useState("");
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  
  // 🆕 Agregar este useEffect para cargar la institución y subtipos
  useEffect(() => {
    cargarInstitucionDelConvenio();
    cargarSubtiposDelConvenio();
  }, [convenioId]);

  const cargarSubtiposDelConvenio = async () => {
    try {
      const { data: subtypes, error } = await supabase
        .from("agreement_subtypes")
        .select("id, subtipo_nombre")
        .eq("agreement_id", convenioId)
        .order("subtipo_nombre");
      
      if (error) throw error;
      
      setSubtiposDisponibles(subtypes || []);
      
      // Si está editando, cargar el subtipo del informe existente
      if (informeExistente?.subtipo_id) {
        setSubtipoSeleccionado(informeExistente.subtipo_id);
        const subtipo = (subtypes || []).find((s: any) => s.id === informeExistente.subtipo_id);
        if (subtipo) {
          const esPre = subtipo.subtipo_nombre?.toUpperCase().includes("PREGRADO");
          setEsPregrado(esPre);
        }
      }
      
      console.log("✅ Subtipos cargados:", subtypes?.length || 0);
    } catch (error) {
      console.error("❌ Error cargando subtipos:", error);
      setSubtiposDisponibles([]);
    }
  };

  const cargarInstitucionDelConvenio = async () => {
    try {
      // 1. Obtener el convenio
      const { data: convenio, error: errorConvenio } = await supabase
        .from("agreements")
        .select("institucion_id")
        .eq("id", convenioId)
        .single();
      
      if (errorConvenio) throw errorConvenio;
      
      if (!convenio?.institucion_id) {
        console.log("⚠️ Convenio sin institución asignada");
        return;
      }
      
      // 2. Obtener la institución
      const { data: institucion, error: errorInst } = await supabase
        .from("instituciones")
        .select("nombre")
        .eq("id", convenio.institucion_id)
        .single();
      
      if (errorInst) throw errorInst;
      
      if (institucion?.nombre) {
        setSedeConvenio(institucion.nombre);
        console.log("✅ Sede auto-llenada:", institucion.nombre);
      }
    } catch (error) {
      console.error("❌ Error cargando institución:", error);
    }
  };
  // Áreas vinculadas disponibles
  const [areasDisponibles, setAreasDisponibles] = useState<any[]>([]);
  
  // Detalles por área
  const [detalles, setDetalles] = useState<AreaDetalle[]>([]);
  
  // 🆕 Agregar este estado
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>("");

  // Cargar áreas vinculadas y datos existentes
  useEffect(() => {
    cargarAreasVinculadas();
    if (informeExistente) {
      cargarDatosExistentes();
    }
  }, [informeExistente]);
  
  // 🆕 Detectar tipo cuando se selecciona un subtipo
  const handleSubtipoChange = (subtipoId: string) => {
    setSubtipoSeleccionado(subtipoId);
    
    // Encontrar el subtipo seleccionado
    const subtipo = subtiposDisponibles.find(s => s.id === subtipoId);
    if (subtipo) {
      // Detectar si es PREGRADO o POSTGRADO
      const esPre = subtipo.subtipo_nombre?.toUpperCase().includes("PREGRADO");
      setEsPregrado(esPre);
      console.log("✅ Subtipo seleccionado:", subtipo.subtipo_nombre, "- Es pregrado:", esPre);
    }
  };
  
  const cargarAreasVinculadas = async () => {
    const { data } = await supabase
      .from("areas_vinculadas")
      .select("id, nombre")
      .order("nombre");
    
    setAreasDisponibles(data || []);
  };
  
  const cargarDatosExistentes = async () => {
    if (!informeExistente?.id) return;
    
    setAnio(informeExistente.anio);
    setSemestre(informeExistente.semestre);
    setSedeConvenio(informeExistente.sede_convenio || "");
    setObservacionesGenerales(informeExistente.observaciones_generales || "");
    
    const { data: detallesData } = await supabase
      .from("informes_semestrales_detalle")
      .select(`*, areas_vinculadas(id, nombre)`)
      .eq("informe_id", informeExistente.id);
    
    const detallesMapeados: AreaDetalle[] = (detallesData || []).map((d: any) => ({
      area_vinculada_id: d.area_vinculada_id,
      area_nombre: d.areas_vinculadas?.nombre || "",
      alumnos_internos: d.alumnos_internos || 0,
      alumnos_cursos: d.alumnos_cursos || 0,
      documento_url: d.documento_verificacion_url,
      documento_nombre: d.documento_verificacion_nombre,
      observaciones: d.observaciones || ""
    }));
    
    setDetalles(detallesMapeados);
  };
  
  const agregarArea = () => {
    if (!areaSeleccionada) {
      alert("Por favor selecciona un área primero");
      return;
    }
    
    // Verificar si ya fue agregada
    if (detalles.some(d => d.area_vinculada_id === areaSeleccionada)) {
      alert("Esta área ya fue agregada");
      return;
    }
    
    // Buscar el área seleccionada
    const area = areasDisponibles.find(a => a.id === areaSeleccionada);
    
    if (!area) {
      alert("Área no encontrada");
      return;
    }
    
    // Agregar el área
    setDetalles([
      ...detalles,
      {
        area_vinculada_id: area.id,
        area_nombre: area.nombre,
        alumnos_internos: 0,
        alumnos_cursos: 0,
        observaciones: ""
      }
    ]);
    
    // Limpiar selección
    setAreaSeleccionada("");
  };
  
  const eliminarArea = (index: number) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };
  
  const actualizarDetalle = (index: number, campo: keyof AreaDetalle, valor: any) => {
    const nuevosDetalles = [...detalles];
    (nuevosDetalles[index] as any)[campo] = valor;
    setDetalles(nuevosDetalles);
  };
  
  const handleFileChange = (index: number, file: File | null) => {
    if (!file) return;
    const nuevosDetalles = [...detalles];
    nuevosDetalles[index].documento_file = file;
    setDetalles(nuevosDetalles);
  };
  
  const subirDocumento = async (file: File, areaId: string): Promise<string | undefined> => {
    try {
      const timestamp = Date.now();
      const fileName = `${convenioId}/${anio}_S${semestre}_${areaId}_${timestamp}.pdf`;
      
      const { error } = await supabase.storage
        .from("documentos-verificacion-alumnos")
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from("documentos-verificacion-alumnos")
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      return undefined;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que se haya seleccionado un subtipo
    if (!subtipoSeleccionado) {
      alert("Debes seleccionar un subtipo docente asistencial");
      return;
    }
    
    if (detalles.length === 0) {
      alert("Debes agregar al menos un área vinculada con alumnos");
      return;
    }
    
    const totalAlumnos = detalles.reduce((sum, d) => sum + d.alumnos_internos + d.alumnos_cursos, 0);
    if (totalAlumnos === 0) {
      alert("Debes ingresar al menos un alumno");
      return;
    }
    
    setSaving(true);
    
    try {
      let informeId = informeExistente?.id;
      
      if (informeExistente) {
        await supabase
          .from("informes_semestrales")
          .update({
            sede_convenio: sedeConvenio,
            observaciones_generales: observacionesGenerales,
            updated_at: new Date().toISOString()
          })
          .eq("id", informeExistente.id);
      } else {
        const { data, error } = await supabase
          .from("informes_semestrales")
          .insert({
            convenio_id: convenioId,
            anio,
            semestre,
            subtipo_id: subtipoSeleccionado,
            sede_convenio: sedeConvenio,
            observaciones_generales: observacionesGenerales
          })
          .select()
          .single();
        
        if (error) throw error;
        informeId = data.id;
      }
      
      if (informeExistente) {
        await supabase
          .from("informes_semestrales_detalle")
          .delete()
          .eq("informe_id", informeId);
      }
      
      for (const detalle of detalles) {
        let docUrl = detalle.documento_url;
        let docNombre = detalle.documento_nombre;
        
        if (detalle.documento_file) {
          docUrl = await subirDocumento(detalle.documento_file, detalle.area_vinculada_id);
          docNombre = detalle.documento_file.name;
        }
        
        const { error } = await supabase
          .from("informes_semestrales_detalle")
          .insert({
            informe_id: informeId,
            area_vinculada_id: detalle.area_vinculada_id,
            alumnos_internos: detalle.alumnos_internos,
            alumnos_cursos: detalle.alumnos_cursos,
            documento_verificacion_url: docUrl,
            documento_verificacion_nombre: docNombre,
            observaciones: detalle.observaciones
          });
        
        if (error) throw error;
      }
      
      await supabase.rpc("refresh_vistas_informes");
      
      alert(`✅ Informe ${informeExistente ? 'actualizado' : 'creado'} exitosamente`);
      onSaved();
      
    } catch (error: any) {
      console.error("Error guardando informe:", error);
      alert("❌ Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const totalGeneral = detalles.reduce((sum, d) => sum + d.alumnos_internos + d.alumnos_cursos, 0);
  const totalInternos = detalles.reduce((sum, d) => sum + d.alumnos_internos, 0);
  const totalCursos = detalles.reduce((sum, d) => sum + d.alumnos_cursos, 0);
  
  // 🆕 Labels dinámicos según tipo de convenio
  const labelTipo1 = esPregrado ? "N° de Internos" : "N° de Residentes";
  const labelTipo2 = esPregrado ? "N° de alumnos no internos" : "N° de rotaciones de residentes";
  const labelTotalTipo1 = esPregrado ? "N° de Internos" : "Residentes";
  const labelTotalTipo2 = esPregrado ? "Alumnos no internos" : "Rotaciones";
  const textoVerificacion = esPregrado 
    ? "Subir en PDF relación de internos y de alumnos no internos que coincida con el número declarado"
    : "Subir en PDF relación de residentes y de rotaciones que coincida con el número declarado";
  
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: "1rem",
      overflowY: "auto"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        maxWidth: "900px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
          color: "white",
          padding: "1.5rem",
          borderRadius: "12px 12px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.5rem" }}>
              {informeExistente ? "✏️ Editar" : "➕ Nuevo"} Informe Semestral
            </h2>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
              {convenioNombre}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "1.5rem"
            }}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          <div style={{
            background: "#F8F9FA",
            padding: "1.5rem",
            borderRadius: "8px",
            marginBottom: "1.5rem"
          }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#3D1A4F", fontSize: "1.1rem" }}>
              📅 Periodo
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#3D1A4F" }}>
                  Año
                </label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  disabled={!!informeExistente}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #E9ECEF",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                >
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#3D1A4F" }}>
                  Semestre
                </label>
                <select
                  value={semestre}
                  onChange={(e) => setSemestre(Number(e.target.value))}
                  disabled={!!informeExistente}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #E9ECEF",
                    borderRadius: "8px",
                    fontSize: "1rem"
                  }}
                >
                  <option value={1}>Semestre I</option>
                  <option value={2}>Semestre II</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 🆕 Selector de Subtipo Docente Asistencial */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#3D1A4F" }}>
              📋 Subtipo Docente Asistencial <span style={{ color: "#DC3545" }}>*</span>
            </label>
            <select
              value={subtipoSeleccionado}
              onChange={(e) => handleSubtipoChange(e.target.value)}
              required
              disabled={!!informeExistente}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #E9ECEF",
                borderRadius: "8px",
                fontSize: "1rem",
                backgroundColor: informeExistente ? "#F8F9FA" : "white",
                cursor: informeExistente ? "not-allowed" : "pointer"
              }}
            >
              <option value="">Selecciona un subtipo...</option>
              {subtiposDisponibles.map((subtipo) => (
                <option key={subtipo.id} value={subtipo.id}>
                  {subtipo.subtipo_nombre}
                </option>
              ))}
            </select>
            {informeExistente && (
              <small style={{ display: "block", marginTop: "0.5rem", color: "#6C757D", fontSize: "0.85rem" }}>
                ℹ️ El subtipo no puede cambiar al editar un informe
              </small>
            )}
            {!subtipoSeleccionado && (
              <small style={{ display: "block", marginTop: "0.5rem", color: "#856404", fontSize: "0.85rem" }}>
                ⚠️ Los labels de los campos cambiarán según el subtipo seleccionado
              </small>
            )}
          </div>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#3D1A4F" }}>
              🏥 Sede del Convenio
            </label>
            <input
              type="text"
              value={sedeConvenio}
              onChange={(e) => setSedeConvenio(e.target.value)}
              placeholder="Ej: Hospital Regional Docente de Trujillo"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #E9ECEF",
                borderRadius: "8px",
                fontSize: "1rem"
              }}
            />
          </div>
          
          <div style={{ marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ margin: "0 0 1rem 0", color: "#3D1A4F", fontSize: "1.1rem" }}>
              📚 Detalle por Área Vinculada
            </h3>
            
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                <select
                  value={areaSeleccionada}
                  onChange={(e) => setAreaSeleccionada(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #DEE2E6",
                    fontSize: "1rem"
                  }}
                >
                  <option value="">Selecciona un área...</option>
                  {areasDisponibles
                    .filter(area => !detalles.some(d => d.area_vinculada_id === area.id))
                    .map(area => (
                      <option key={area.id} value={area.id}>
                        {area.nombre}
                      </option>
                    ))
                  }
                </select>
              </div>
              <button
                type="button"
                onClick={agregarArea}
                disabled={!areaSeleccionada}
                style={{
                  background: areaSeleccionada ? "#FDB913" : "#CCC",
                  color: "#3D1A4F",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  cursor: areaSeleccionada ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap"
                }}
              >
                ➕ Agregar
              </button>
            </div>
          </div>
            
            {detalles.length === 0 ? (
              <div style={{
                background: "#F8F9FA",
                padding: "2rem",
                borderRadius: "8px",
                textAlign: "center",
                color: "#6C757D"
              }}>
                <p>No hay áreas agregadas. Haz clic en "Agregar Área".</p>
              </div>
            ) : (
              detalles.map((detalle, index) => (
                <div key={index} style={{
                  background: "#F8F9FA",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  border: "2px solid #E9ECEF"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "1rem"
                  }}>
                    <h4 style={{ margin: 0, color: "#3D1A4F" }}>
                      📚 {detalle.area_nombre}
                    </h4>
                    <button
                      type="button"
                      onClick={() => eliminarArea(index)}
                      style={{
                        background: "#DC3545",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 1rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem"
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                        {labelTipo1}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={detalle.alumnos_internos}
                        onChange={(e) => actualizarDetalle(index, "alumnos_internos", Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "2px solid #E9ECEF",
                          borderRadius: "8px"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                        {labelTipo2}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={detalle.alumnos_cursos}
                        onChange={(e) => actualizarDetalle(index, "alumnos_cursos", Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "2px solid #E9ECEF",
                          borderRadius: "8px"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                        Total
                      </label>
                      <div style={{
                        padding: "0.75rem",
                        background: "#5B2C6F",
                        color: "white",
                        borderRadius: "8px",
                        fontWeight: 600,
                        textAlign: "center"
                      }}>
                        {detalle.alumnos_internos + detalle.alumnos_cursos}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                      📎 Documento de Verificación (PDF)
                    </label>
                    <div style={{
                      background: "#E7F3FF",
                      border: "1px solid #90CAF9",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      marginBottom: "0.75rem",
                      fontSize: "0.85rem",
                      color: "#1565C0"
                    }}>
                      <strong>ℹ️ Importante:</strong> {textoVerificacion}
                    </div>
                    {detalle.documento_url && !detalle.documento_file && (
                      <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#28A745" }}>
                        ✅ {detalle.documento_nombre}
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "2px solid #E9ECEF",
                        borderRadius: "8px"
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>
                      Observaciones
                    </label>
                    <textarea
                      value={detalle.observaciones}
                      onChange={(e) => actualizarDetalle(index, "observaciones", e.target.value)}
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "2px solid #E9ECEF",
                        borderRadius: "8px"
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          
          {detalles.length > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
              color: "white",
              padding: "1.5rem",
              borderRadius: "8px",
              marginBottom: "1.5rem"
            }}>
              <h3 style={{ margin: "0 0 1rem 0" }}>📊 Totales</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{labelTotalTipo1}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{totalInternos}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{labelTotalTipo2}</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{totalCursos}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>Total</div>
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{totalGeneral}</div>
                </div>
              </div>
            </div>
          )}
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#3D1A4F" }}>
              📝 Observaciones Generales
            </label>
            <textarea
              value={observacionesGenerales}
              onChange={(e) => setObservacionesGenerales(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #E9ECEF",
                borderRadius: "8px"
              }}
            />
          </div>
          
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                background: "#6C757D",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || detalles.length === 0}
              style={{
                background: saving ? "#CCC" : "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: saving || detalles.length === 0 ? "not-allowed" : "pointer",
                fontWeight: 600
              }}
            >
              {saving ? "⏳ Guardando..." : "💾 Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}