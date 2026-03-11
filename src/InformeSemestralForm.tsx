// src/InformeSemestralForm.tsx
// NUEVA ARQUITECTURA: 1 Informe = 1 Área

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

interface InformeSemestralFormProps {
  convenioId: string;
  convenioNombre: string;
  onClose: () => void;
  onSaved: () => void;
  informeExistente?: any;
}

export default function InformeSemestralForm({
  convenioId,
  convenioNombre,
  onClose,
  onSaved,
  informeExistente
}: InformeSemestralFormProps) {
  
  const [saving, setSaving] = useState(false);
  
  // Estados para selección
  const [subtiposDisponibles, setSubtiposDisponibles] = useState<any[]>([]);
  const [subtipoSeleccionado, setSubtipoSeleccionado] = useState<string>("");
  const [esPregrado, setEsPregrado] = useState(true);
  
  const [areasDisponibles, setAreasDisponibles] = useState<any[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>("");
  
  // Datos del informe
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [semestre, setSemestre] = useState<number>(1);
  const [sedeConvenio, setSedeConvenio] = useState("");
  
  // Datos de alumnos (directamente en el informe)
  const [alumnosInternos, setAlumnosInternos] = useState<number>(0);
  const [alumnosCursos, setAlumnosCursos] = useState<number>(0);
  
  // Documento
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [documentoUrl, setDocumentoUrl] = useState<string>("");
  const [documentoNombre, setDocumentoNombre] = useState<string>("");
  
  // Observaciones
  const [observaciones, setObservaciones] = useState("");
  
  useEffect(() => {
    cargarInstitucionDelConvenio();
    cargarSubtiposDelConvenio();
    cargarAreasVinculadas();
    
    if (informeExistente) {
      cargarDatosExistentes();
    }
  }, [convenioId, informeExistente]);
  
  const cargarInstitucionDelConvenio = async () => {
    try {
      const { data: convenio } = await supabase
        .from("agreements")
        .select("institucion_id")
        .eq("id", convenioId)
        .single();
      
      if (convenio?.institucion_id) {
        const { data: institucion } = await supabase
          .from("instituciones")
          .select("nombre")
          .eq("id", convenio.institucion_id)
          .single();
        
        if (institucion?.nombre) {
          setSedeConvenio(institucion.nombre);
        }
      }
    } catch (error) {
      console.error("Error cargando institución:", error);
    }
  };
  
  const cargarSubtiposDelConvenio = async () => {
    try {
      const { data: subtypes, error } = await supabase
        .from("agreement_subtypes")
        .select("id, subtipo_nombre")
        .eq("agreement_id", convenioId)
        .order("subtipo_nombre");
      
      if (error) throw error;
      
      setSubtiposDisponibles(subtypes || []);
      
      if (informeExistente?.subtipo_id) {
        setSubtipoSeleccionado(informeExistente.subtipo_id);
        const subtipo = (subtypes || []).find((s: any) => s.id === informeExistente.subtipo_id);
        if (subtipo) {
          const esPre = subtipo.subtipo_nombre?.toUpperCase().includes("PREGRADO");
          setEsPregrado(esPre);
        }
      }
    } catch (error) {
      console.error("Error cargando subtipos:", error);
    }
  };
  
  const cargarAreasVinculadas = async () => {
    try {
      const { data, error } = await supabase
        .from("areas_vinculadas")
        .select("id, nombre")
        .order("nombre");
      
      if (error) throw error;
      setAreasDisponibles(data || []);
      
      if (informeExistente?.area_vinculada_id) {
        setAreaSeleccionada(informeExistente.area_vinculada_id);
      }
    } catch (error) {
      console.error("Error cargando áreas:", error);
    }
  };
  
  const cargarDatosExistentes = async () => {
    if (!informeExistente?.id) return;
    
    setAnio(informeExistente.anio);
    setSemestre(informeExistente.semestre);
    setSedeConvenio(informeExistente.sede_convenio || "");
    setObservaciones(informeExistente.observaciones || "");
    
    // Cargar datos del detalle
    const { data: detalleData } = await supabase
      .from("informes_semestrales_detalle")
      .select("*")
      .eq("informe_id", informeExistente.id)
      .single();
    
    if (detalleData) {
      setAlumnosInternos(detalleData.alumnos_internos || 0);
      setAlumnosCursos(detalleData.alumnos_cursos || 0);
      setDocumentoUrl(detalleData.documento_verificacion_url || "");
      setDocumentoNombre(detalleData.documento_verificacion_nombre || "");
    }
  };
  
  const handleSubtipoChange = (subtipoId: string) => {
    setSubtipoSeleccionado(subtipoId);
    
    const subtipo = subtiposDisponibles.find(s => s.id === subtipoId);
    if (subtipo) {
      const esPre = subtipo.subtipo_nombre?.toUpperCase().includes("PREGRADO");
      setEsPregrado(esPre);
    }
  };
  
  const subirDocumento = async (file: File): Promise<string | undefined> => {
    try {
      const timestamp = Date.now();
      const fileName = `${convenioId}/${anio}_S${semestre}_${areaSeleccionada}_${timestamp}.pdf`;
      
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
    
    if (!subtipoSeleccionado) {
      alert("Debes seleccionar un subtipo docente asistencial");
      return;
    }
    
    if (!areaSeleccionada) {
      alert("Debes seleccionar un área vinculada");
      return;
    }
    
    const total = alumnosInternos + alumnosCursos;
    if (total === 0) {
      alert("Debes ingresar al menos un alumno");
      return;
    }
    
    // 🆕 VALIDAR PDF OBLIGATORIO
    if (!documentoFile && !documentoUrl) {
      alert("❌ Debes subir un documento PDF de verificación. Este documento es OBLIGATORIO.");
      return;
    }
    
    setSaving(true);
    
    try {
      let informeId = informeExistente?.id;
      let documentoUrlFinal = documentoUrl;
      
      // Subir documento si hay uno nuevo
      if (documentoFile) {
        const url = await subirDocumento(documentoFile);
        if (url) {
          documentoUrlFinal = url;
        }
      }
      
      if (informeExistente) {
        // Actualizar informe existente
        await supabase
          .from("informes_semestrales")
          .update({
            sede_convenio: sedeConvenio,
            observaciones: observaciones,
            updated_at: new Date().toISOString()
          })
          .eq("id", informeExistente.id);
        
        // Actualizar detalle
        await supabase
          .from("informes_semestrales_detalle")
          .update({
            alumnos_internos: alumnosInternos,
            alumnos_cursos: alumnosCursos,
            total_alumnos: total,
            documento_verificacion_url: documentoUrlFinal,
            documento_verificacion_nombre: documentoFile?.name || documentoNombre
          })
          .eq("informe_id", informeExistente.id);
      } else {
        // Crear nuevo informe
        const { data: informeData, error: informeError } = await supabase
          .from("informes_semestrales")
          .insert({
            convenio_id: convenioId,
            anio,
            semestre,
            subtipo_id: subtipoSeleccionado,
            area_vinculada_id: areaSeleccionada,
            sede_convenio: sedeConvenio,
            observaciones: observaciones
          })
          .select()
          .single();
        
        if (informeError) throw informeError;
        informeId = informeData.id;
        
        // Crear detalle
        const { error: detalleError } = await supabase
          .from("informes_semestrales_detalle")
          .insert({
            informe_id: informeId,
            area_vinculada_id: areaSeleccionada,
            alumnos_internos: alumnosInternos,
            alumnos_cursos: alumnosCursos,
            total_alumnos: total,
            documento_verificacion_url: documentoUrlFinal,
            documento_verificacion_nombre: documentoFile?.name || ""
          });
        
        if (detalleError) throw detalleError;
      }
      
      alert(`✅ Informe ${informeExistente ? 'actualizado' : 'creado'} correctamente`);
      onSaved();
    } catch (error: any) {
      console.error("Error guardando:", error);
      alert("❌ Error: " + (error?.message || String(error)));
    } finally {
      setSaving(false);
    }
  };
  
  // Labels dinámicos
  const labelTipo1 = esPregrado ? "N° de Internos" : "N° de Residentes";
  const labelTipo2 = esPregrado ? "N° de alumnos no internos" : "N° de rotaciones de residentes";
  const textoVerificacion = esPregrado 
    ? "Subir en PDF relación de internos y de alumnos no internos que coincida con el número declarado"
    : "Subir en PDF relación de residentes y de rotaciones que coincida con el número declarado";
  
  const total = alumnosInternos + alumnosCursos;
  
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "1rem"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        maxWidth: "800px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
          color: "white",
          padding: "1.5rem",
          borderRadius: "12px 12px 0 0"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>
                {informeExistente ? "✏️ Editar Informe" : "➕ Nuevo Informe Semestral"}
              </h2>
              <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9 }}>
                {convenioNombre}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                color: "white",
                fontSize: "1.5rem",
                cursor: "pointer",
                borderRadius: "8px",
                width: "40px",
                height: "40px"
              }}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
          {/* Periodo */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#3D1A4F" }}>📅 Periodo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Año</label>
                <input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  required
                  min="2020"
                  max="2030"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #E9ECEF",
                    borderRadius: "8px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>Semestre</label>
                <select
                  value={semestre}
                  onChange={(e) => setSemestre(Number(e.target.value))}
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #E9ECEF",
                    borderRadius: "8px"
                  }}
                >
                  <option value={1}>Semestre I</option>
                  <option value={2}>Semestre II</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Subtipo */}
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
              <small style={{ display: "block", marginTop: "0.5rem", color: "#6C757D" }}>
                ℹ️ El subtipo no puede cambiar al editar
              </small>
            )}
          </div>
          
          {/* Área Vinculada */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, color: "#3D1A4F" }}>
              📚 Área Vinculada (Escuela Profesional) <span style={{ color: "#DC3545" }}>*</span>
            </label>
            <select
              value={areaSeleccionada}
              onChange={(e) => setAreaSeleccionada(e.target.value)}
              required
              disabled={!!informeExistente}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #E9ECEF",
                borderRadius: "8px",
                backgroundColor: informeExistente ? "#F8F9FA" : "white",
                cursor: informeExistente ? "not-allowed" : "pointer"
              }}
            >
              <option value="">Selecciona un área...</option>
              {areasDisponibles.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
            {informeExistente && (
              <small style={{ display: "block", marginTop: "0.5rem", color: "#6C757D" }}>
                ℹ️ El área no puede cambiar al editar
              </small>
            )}
          </div>
          
          {/* Sede */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
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
                borderRadius: "8px"
              }}
            />
          </div>
          
          {/* Datos de Alumnos */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#3D1A4F" }}>👥 Datos de Alumnos</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                  {labelTipo1}
                </label>
                <input
                  type="number"
                  min="0"
                  value={alumnosInternos}
                  onChange={(e) => setAlumnosInternos(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #E9ECEF",
                    borderRadius: "8px"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                  {labelTipo2}
                </label>
                <input
                  type="number"
                  min="0"
                  value={alumnosCursos}
                  onChange={(e) => setAlumnosCursos(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #E9ECEF",
                    borderRadius: "8px"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
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
                  {total}
                </div>
              </div>
            </div>
          </div>
          
          {/* Documento */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              📎 Documento de Verificación (PDF) <span style={{ color: "#DC3545" }}>* OBLIGATORIO</span>
            </label>
            <div style={{
              background: "#FFE5E5",
              border: "2px solid #DC3545",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "0.75rem",
              fontSize: "0.85rem",
              color: "#721C24"
            }}>
              <strong>⚠️ OBLIGATORIO:</strong> {textoVerificacion}
            </div>
            {documentoUrl && !documentoFile && (
              <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#28A745", fontWeight: 600 }}>
                ✅ Documento actual: {documentoNombre}
              </div>
            )}
            {!documentoUrl && !documentoFile && (
              <div style={{ marginBottom: "0.5rem", fontSize: "0.9rem", color: "#DC3545", fontWeight: 600 }}>
                ❌ No hay documento. Debes subir un PDF.
              </div>
            )}
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
              required={!documentoUrl && !informeExistente}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: documentoUrl || documentoFile ? "2px solid #28A745" : "2px solid #DC3545",
                borderRadius: "8px",
                background: documentoUrl || documentoFile ? "#E8F5E9" : "white"
              }}
            />
            {documentoFile && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#28A745", fontWeight: 600 }}>
                ✅ Nuevo archivo seleccionado: {documentoFile.name}
              </div>
            )}
          </div>
          
          {/* Observaciones */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
              📝 Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              placeholder="Observaciones específicas para esta área..."
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "2px solid #E9ECEF",
                borderRadius: "8px"
              }}
            />
          </div>
          
          {/* Botones */}
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
              disabled={saving || !subtipoSeleccionado || !areaSeleccionada}
              style={{
                background: saving ? "#CCC" : "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: saving || !subtipoSeleccionado || !areaSeleccionada ? "not-allowed" : "pointer",
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