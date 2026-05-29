// src/InformeAnualForm.tsx
// Formulario de informes ANUALES para convenios Docente Asistencial
// NUEVA ARQUITECTURA: 1 Informe = 1 Área (SIN semestre)

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

interface InformeAnualFormProps {
  convenioId: string;
  convenioNombre: string;
  onClose: () => void;
  onSaved: () => void;
  informeExistente?: any;
}

export default function InformeAnualForm({
  convenioId,
  convenioNombre,
  onClose,
  onSaved,
  informeExistente
}: InformeAnualFormProps) {
  
  const [saving, setSaving] = useState(false);
  
  // Estados para selección
  const [subtiposDisponibles, setSubtiposDisponibles] = useState<any[]>([]);
  const [subtipoSeleccionado, setSubtipoSeleccionado] = useState<string>("");
  const [esPregrado, setEsPregrado] = useState(true);
  
  const [areasDisponibles, setAreasDisponibles] = useState<any[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>("");
  
  // Datos del informe
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  
  // ── PREGRADO: Internos / Alumnos / Cursos ──────────────────
  const [numInternos, setNumInternos] = useState<number>(0);
  const [numAlumnos, setNumAlumnos] = useState<number>(0);
  const [numCursos, setNumCursos] = useState<number>(0);
  const [pdfInternosFile, setPdfInternosFile] = useState<File | null>(null);
  const [pdfInternosUrl, setPdfInternosUrl] = useState<string>("");
  const [pdfAlumnosFile, setPdfAlumnosFile] = useState<File | null>(null);
  const [pdfAlumnosUrl, setPdfAlumnosUrl] = useState<string>("");
  const [pdfCursosFile, setPdfCursosFile] = useState<File | null>(null);
  const [pdfCursosUrl, setPdfCursosUrl] = useState<string>("");

  // ── POSTGRADO / RESIDENTADO: Residentes / Rotaciones ───────
  const [numResidentes, setNumResidentes] = useState<number>(0);
  const [numRotaciones, setNumRotaciones] = useState<number>(0);
  const [pdfResidentesFile, setPdfResidentesFile] = useState<File | null>(null);
  const [pdfResidentesUrl, setPdfResidentesUrl] = useState<string>("");
  const [pdfRotacionesFile, setPdfRotacionesFile] = useState<File | null>(null);
  const [pdfRotacionesUrl, setPdfRotacionesUrl] = useState<string>("");
  
  // Observaciones
  const [observaciones, setObservaciones] = useState("");
  
  useEffect(() => {
    cargarSubtiposDelConvenio();
    cargarAreasVinculadas();
    
    if (informeExistente) {
      cargarDatosExistentes();
    }
  }, [convenioId, informeExistente]);
  
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
    setSubtipoSeleccionado(informeExistente.subtipo_id || "");
    setAreaSeleccionada(informeExistente.area_vinculada_id || "");
    setObservaciones(informeExistente.observaciones || "");
    
    // Pregrado
    setNumInternos(informeExistente.num_internos || 0);
    setNumAlumnos(informeExistente.num_alumnos || 0);
    setNumCursos(informeExistente.num_cursos || 0);
    setPdfInternosUrl(informeExistente.medio_verificable_internos || "");
    setPdfAlumnosUrl(informeExistente.medio_verificable_alumnos || "");
    setPdfCursosUrl(informeExistente.medio_verificable_cursos || "");

    // Postgrado / Residentado
    setNumResidentes(informeExistente.num_residentes || 0);
    setNumRotaciones(informeExistente.num_rotaciones || 0);
    setPdfResidentesUrl(informeExistente.medio_verificable_residentes || "");
    setPdfRotacionesUrl(informeExistente.medio_verificable_rotaciones || "");
  };
  
  const handleSubtipoChange = (subtipoId: string) => {
    setSubtipoSeleccionado(subtipoId);
    const subtipo = subtiposDisponibles.find(s => s.id === subtipoId);
    if (subtipo) {
      const esPre = subtipo.subtipo_nombre?.toUpperCase().includes("PREGRADO");
      setEsPregrado(esPre);
    }
  };
  
  const subirPDF = async (file: File, carpeta: string): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${carpeta}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("informes")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("informes").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error subiendo PDF:", error);
      return null;
    }
  };
  
  const handleGuardar = async () => {
    // Validaciones
    if (!subtipoSeleccionado) {
      alert("❌ Debes seleccionar un subtipo");
      return;
    }
    
    if (!areaSeleccionada) {
      alert("❌ Debes seleccionar un área vinculada");
      return;
    }
    
    if (esPregrado) {
      if (numInternos === 0 && numAlumnos === 0 && numCursos === 0) {
        alert("❌ Debes ingresar al menos un número mayor a 0 (Internos, Alumnos o Cursos)");
        return;
      }
    } else {
      if (numResidentes === 0 && numRotaciones === 0) {
        alert("❌ Debes ingresar al menos un número mayor a 0 (Residentes o Rotaciones)");
        return;
      }
    }
    
    setSaving(true);
    
    try {
      // Subir PDFs si hay archivos nuevos
      let urlInternos = pdfInternosUrl;
      let urlAlumnos = pdfAlumnosUrl;
      let urlCursos = pdfCursosUrl;
      let urlResidentes = pdfResidentesUrl;
      let urlRotaciones = pdfRotacionesUrl;

      if (pdfInternosFile) {
        const uploaded = await subirPDF(pdfInternosFile, "internos");
        if (uploaded) urlInternos = uploaded;
      }
      if (pdfAlumnosFile) {
        const uploaded = await subirPDF(pdfAlumnosFile, "alumnos");
        if (uploaded) urlAlumnos = uploaded;
      }
      if (pdfCursosFile) {
        const uploaded = await subirPDF(pdfCursosFile, "cursos");
        if (uploaded) urlCursos = uploaded;
      }
      if (pdfResidentesFile) {
        const uploaded = await subirPDF(pdfResidentesFile, "residentes");
        if (uploaded) urlResidentes = uploaded;
      }
      if (pdfRotacionesFile) {
        const uploaded = await subirPDF(pdfRotacionesFile, "rotaciones");
        if (uploaded) urlRotaciones = uploaded;
      }
      
      const dataToSave = {
        convenio_id: convenioId,
        anio,
        subtipo_id: subtipoSeleccionado,
        area_vinculada_id: areaSeleccionada,
        // Pregrado
        num_internos: esPregrado ? numInternos : 0,
        medio_verificable_internos: esPregrado ? (urlInternos || null) : null,
        num_alumnos: esPregrado ? numAlumnos : 0,
        medio_verificable_alumnos: esPregrado ? (urlAlumnos || null) : null,
        num_cursos: esPregrado ? numCursos : 0,
        medio_verificable_cursos: esPregrado ? (urlCursos || null) : null,
        // Postgrado / Residentado
        num_residentes: !esPregrado ? numResidentes : 0,
        medio_verificable_residentes: !esPregrado ? (urlResidentes || null) : null,
        num_rotaciones: !esPregrado ? numRotaciones : 0,
        medio_verificable_rotaciones: !esPregrado ? (urlRotaciones || null) : null,
        observaciones: observaciones || null
      };
      
      if (informeExistente?.id) {
        // Actualizar
        const { error } = await supabase
          .from("informes_anuales")
          .update(dataToSave)
          .eq("id", informeExistente.id);
        
        if (error) throw error;
        alert("✅ Informe actualizado correctamente");
      } else {
        // Crear
        const { error } = await supabase
          .from("informes_anuales")
          .insert([dataToSave]);
        
        if (error) throw error;
        alert("✅ Informe creado correctamente");
      }
      
      onSaved();
    } catch (error: any) {
      console.error("Error:", error);
      alert("❌ Error: " + (error.message || String(error)));
    } finally {
      setSaving(false);
    }
  };
  
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
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
          color: "white",
          padding: "1.5rem",
          borderRadius: "12px 12px 0 0",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                {informeExistente ? "✏️ Editar Informe Anual" : "📄 Nuevo Informe Anual"}
              </h3>
              <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.9rem" }}>
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
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div style={{ padding: "2rem" }}>
          {/* Año */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
              Año *
            </label>
            <input
              type="number"
              className="form-control"
              value={anio}
              onChange={(e) => setAnio(parseInt(e.target.value))}
              min={2000}
              max={2100}
            />
          </div>
          
          {/* Subtipo */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
              Subtipo *
            </label>
            <select
              className="form-select"
              value={subtipoSeleccionado}
              onChange={(e) => handleSubtipoChange(e.target.value)}
            >
              <option value="">Seleccionar subtipo...</option>
              {subtiposDisponibles.map(st => (
                <option key={st.id} value={st.id}>{st.subtipo_nombre}</option>
              ))}
            </select>
          </div>
          
          {/* Área */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
              Área Vinculada *
            </label>
            <select
              className="form-select"
              value={areaSeleccionada}
              onChange={(e) => setAreaSeleccionada(e.target.value)}
            >
              <option value="">Seleccionar área...</option>
              {areasDisponibles.map(area => (
                <option key={area.id} value={area.id}>{area.nombre}</option>
              ))}
            </select>
          </div>
          
          <hr style={{ margin: "2rem 0" }} />

          {/* Indicador de modo */}
          {subtipoSeleccionado && (
            <div style={{
              marginBottom: "1.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              background: esPregrado ? "#D4EDDA" : "#CCE5FF",
              color: esPregrado ? "#155724" : "#004085",
              fontSize: "0.9rem",
              fontWeight: 600
            }}>
              {esPregrado
                ? "📚 Pregrado — campos: N° Internos · N° Alumnos · N° Cursos"
                : "🏥 Postgrado / Residentado — campos: N° Residentes · N° Rotaciones Externas"}
            </div>
          )}

          {esPregrado ? (
            <>
              {/* N° de Internos */}
              <div style={{ marginBottom: "2rem" }}>
                <h5 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#5B2C6F" }}>
                  👨‍⚕️ Internos
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <label className="form-label">N° de Internos</label>
                    <input type="number" className="form-control" value={numInternos}
                      onChange={(e) => setNumInternos(parseInt(e.target.value) || 0)} min={0} />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Medio Verificable (PDF)</label>
                    <input type="file" className="form-control" accept="application/pdf"
                      onChange={(e) => setPdfInternosFile(e.target.files?.[0] || null)} />
                    {pdfInternosUrl && (
                      <small className="text-success d-block mt-1">
                        ✅ <a href={pdfInternosUrl} target="_blank" rel="noreferrer">Ver PDF actual</a>
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* N° de Alumnos */}
              <div style={{ marginBottom: "2rem" }}>
                <h5 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#5B2C6F" }}>
                  👩‍🎓 Alumnos
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <label className="form-label">N° de Alumnos</label>
                    <input type="number" className="form-control" value={numAlumnos}
                      onChange={(e) => setNumAlumnos(parseInt(e.target.value) || 0)} min={0} />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Medio Verificable (PDF)</label>
                    <input type="file" className="form-control" accept="application/pdf"
                      onChange={(e) => setPdfAlumnosFile(e.target.files?.[0] || null)} />
                    {pdfAlumnosUrl && (
                      <small className="text-success d-block mt-1">
                        ✅ <a href={pdfAlumnosUrl} target="_blank" rel="noreferrer">Ver PDF actual</a>
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* N° de Cursos */}
              <div style={{ marginBottom: "2rem" }}>
                <h5 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#5B2C6F" }}>
                  📚 Cursos
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <label className="form-label">N° de Cursos</label>
                    <input type="number" className="form-control" value={numCursos}
                      onChange={(e) => setNumCursos(parseInt(e.target.value) || 0)} min={0} />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Medio Verificable (PDF)</label>
                    <input type="file" className="form-control" accept="application/pdf"
                      onChange={(e) => setPdfCursosFile(e.target.files?.[0] || null)} />
                    {pdfCursosUrl && (
                      <small className="text-success d-block mt-1">
                        ✅ <a href={pdfCursosUrl} target="_blank" rel="noreferrer">Ver PDF actual</a>
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* N° de Residentes */}
              <div style={{ marginBottom: "2rem" }}>
                <h5 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#004085" }}>
                  👨‍⚕️ Residentes
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <label className="form-label">N° de Residentes</label>
                    <input type="number" className="form-control" value={numResidentes}
                      onChange={(e) => setNumResidentes(parseInt(e.target.value) || 0)} min={0} />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Medio Verificable (PDF)</label>
                    <input type="file" className="form-control" accept="application/pdf"
                      onChange={(e) => setPdfResidentesFile(e.target.files?.[0] || null)} />
                    {pdfResidentesUrl && (
                      <small className="text-success d-block mt-1">
                        ✅ <a href={pdfResidentesUrl} target="_blank" rel="noreferrer">Ver PDF actual</a>
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* N° de Rotaciones Externas */}
              <div style={{ marginBottom: "2rem" }}>
                <h5 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "#004085" }}>
                  🔄 Rotaciones Externas
                </h5>
                <div className="row">
                  <div className="col-md-4">
                    <label className="form-label">N° de Rotaciones Externas</label>
                    <input type="number" className="form-control" value={numRotaciones}
                      onChange={(e) => setNumRotaciones(parseInt(e.target.value) || 0)} min={0} />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Medio Verificable (PDF)</label>
                    <input type="file" className="form-control" accept="application/pdf"
                      onChange={(e) => setPdfRotacionesFile(e.target.files?.[0] || null)} />
                    {pdfRotacionesUrl && (
                      <small className="text-success d-block mt-1">
                        ✅ <a href={pdfRotacionesUrl} target="_blank" rel="noreferrer">Ver PDF actual</a>
                      </small>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          
          {/* Observaciones */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem" }}>
              Observaciones (opcional)
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Comentarios adicionales..."
            />
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: "1.5rem",
          borderTop: "1px solid #DEE2E6",
          display: "flex",
          justifyContent: "flex-end",
          gap: "1rem",
          position: "sticky",
          bottom: 0,
          background: "white",
          borderRadius: "0 0 12px 12px"
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Guardando..." : "💾 Guardar Informe"}
          </button>
        </div>
      </div>
    </div>
  );
}