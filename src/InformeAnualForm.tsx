// src/InformeAnualForm.tsx
// Formulario de informes ANUALES para convenios Docente Asistencial
// Los datos académicos (alumnos, cursos, internos, residentes, rotaciones)
// se registran en Gestión Académica y se consultan automáticamente en Reportes.
// Este formulario solo captura: año, subtipo, área y observaciones.

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

  // Selección
  const [subtiposDisponibles, setSubtiposDisponibles] = useState<any[]>([]);
  const [subtipoSeleccionado, setSubtipoSeleccionado] = useState<string>("");
  const [esPregrado, setEsPregrado] = useState(true);
  const [areasDisponibles, setAreasDisponibles] = useState<any[]>([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState<string>("");

  // Datos
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [observaciones, setObservaciones] = useState("");

  // Preview de lo que hay en Gestión Académica para este año
  const [resumenGestion, setResumenGestion] = useState<any>(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  useEffect(() => {
    cargarSubtipos();
    if (informeExistente) cargarDatosExistentes();
  }, [convenioId]);

  useEffect(() => {
    if (subtipoSeleccionado) cargarAreas(esPregrado);
  }, [esPregrado, subtipoSeleccionado]);

  useEffect(() => {
    if (anio && convenioId) cargarResumenGestion();
  }, [anio, convenioId]);

  const cargarSubtipos = async () => {
    const { data } = await supabase
      .from("agreement_subtypes")
      .select("id, subtipo_nombre")
      .eq("agreement_id", convenioId)
      .order("subtipo_nombre");
    setSubtiposDisponibles(data || []);
    if (informeExistente?.subtipo_id) {
      setSubtipoSeleccionado(informeExistente.subtipo_id);
      const sub = (data || []).find((s: any) => s.id === informeExistente.subtipo_id);
      if (sub) setEsPregrado(sub.subtipo_nombre?.toUpperCase().includes("PREGRADO"));
    }
  };

  const cargarAreas = async (esPre: boolean) => {
    const { data: links } = await supabase
      .from("agreement_areas_vinculadas")
      .select("area_vinculada_id")
      .eq("agreement_id", convenioId);
    if (!links?.length) { setAreasDisponibles([]); return; }
    const ids = links.map((l: any) => l.area_vinculada_id).filter(Boolean);
    const { data } = await supabase
      .from("areas_vinculadas")
      .select("id, nombre")
      .in("id", ids)
      .order("nombre");
    setAreasDisponibles(
      (data || []).filter((a: any) =>
        esPre ? a.nombre?.toLowerCase().includes("escuela")
               : !a.nombre?.toLowerCase().includes("escuela")
      )
    );
  };

  const cargarDatosExistentes = () => {
    setAnio(informeExistente.anio);
    setSubtipoSeleccionado(informeExistente.subtipo_id || "");
    setAreaSeleccionada(informeExistente.area_vinculada_id || "");
    setObservaciones(informeExistente.observaciones || "");
    const sub = (informeExistente.subtipo_nombre || "");
    setEsPregrado(sub.toUpperCase().includes("PREGRADO"));
  };

  const cargarResumenGestion = async () => {
    setLoadingResumen(true);
    try {
      const { data } = await supabase
        .from("vw_resumen_academico")
        .select("*")
        .eq("convenio_id", convenioId)
        .eq("anio", anio)
        .single();
      setResumenGestion(data || null);
    } catch { setResumenGestion(null); }
    setLoadingResumen(false);
  };

  const handleSubtipoChange = (id: string) => {
    setSubtipoSeleccionado(id);
    setAreaSeleccionada("");
    const sub = subtiposDisponibles.find(s => s.id === id);
    if (sub) {
      const esPre = sub.subtipo_nombre?.toUpperCase().includes("PREGRADO");
      setEsPregrado(esPre);
    }
  };

  const handleGuardar = async () => {
    if (!subtipoSeleccionado) { alert("❌ Selecciona un subtipo"); return; }
    if (!areaSeleccionada)    { alert("❌ Selecciona un área vinculada"); return; }

    setSaving(true);
    try {
      const payload = {
        convenio_id: convenioId,
        anio,
        subtipo_id: subtipoSeleccionado,
        area_vinculada_id: areaSeleccionada,
        observaciones: observaciones || null,
        // Limpiar campos numéricos heredados — los datos vienen de Gestión Académica
        num_internos: null, num_alumnos: null, num_cursos: null,
        num_residentes: null, num_rotaciones: null,
        medio_verificable_internos: null, medio_verificable_alumnos: null,
        medio_verificable_cursos: null, medio_verificable_residentes: null,
        medio_verificable_rotaciones: null,
      };
      const { error } = informeExistente?.id
        ? await supabase.from("informes_anuales").update(payload).eq("id", informeExistente.id)
        : await supabase.from("informes_anuales").insert([payload]);
      if (error) throw error;
      onSaved();
    } catch (e: any) {
      alert("❌ Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0,
      background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center",
      justifyContent:"center", zIndex:9999, padding:"1rem", overflowY:"auto" }}>
      <div style={{ background:"white", borderRadius:12, maxWidth:700, width:"100%",
        maxHeight:"90vh", overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#5B2C6F,#3D1A4F)", color:"white",
          padding:"1.5rem", borderRadius:"12px 12px 0 0",
          position:"sticky", top:0, zIndex:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h3 style={{ margin:0, fontSize:"1.4rem", fontWeight:700 }}>
                {informeExistente ? "✏️ Editar Informe Anual" : "📄 Nuevo Informe Anual"}
              </h3>
              <p style={{ margin:"0.4rem 0 0", opacity:.85, fontSize:".85rem" }}>
                {convenioNombre}
              </p>
            </div>
            <button onClick={onClose} disabled={saving}
              style={{ background:"rgba(255,255,255,.2)", border:"none", color:"white",
                width:36, height:36, borderRadius:"50%", cursor:"pointer",
                fontSize:"1.4rem", display:"flex", alignItems:"center", justifyContent:"center" }}>
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"2rem" }}>

          {/* Info panel */}
          <div style={{ background:"#EBF2FB", border:"1px solid #B8D0F0",
            borderRadius:10, padding:"1rem 1.25rem", marginBottom:"1.75rem",
            fontSize:".88rem", color:"#1A4F8A" }}>
            ℹ️ Los datos de alumnos, cursos, internos, residentes y rotaciones se registran
            automáticamente desde <strong>Gestión Académica</strong> y se consolidan en <strong>Reportes</strong>.
            Aquí solo registras el periodo, área y observaciones.
          </div>

          {/* Año */}
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", fontWeight:600, marginBottom:".5rem" }}>Año *</label>
            <input type="number" className="form-control" value={anio}
              onChange={e => setAnio(parseInt(e.target.value))} min={2000} max={2100}/>
          </div>

          {/* Subtipo */}
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", fontWeight:600, marginBottom:".5rem" }}>Subtipo Docente *</label>
            <select className="form-select" value={subtipoSeleccionado}
              onChange={e => handleSubtipoChange(e.target.value)}>
              <option value="">Seleccionar subtipo...</option>
              {subtiposDisponibles.map(st => (
                <option key={st.id} value={st.id}>{st.subtipo_nombre}</option>
              ))}
            </select>
          </div>

          {/* Área */}
          {subtipoSeleccionado && (
            <div style={{ marginBottom:"1.5rem" }}>
              <label style={{ display:"block", fontWeight:600, marginBottom:".5rem" }}>
                Área Vinculada * {" "}
                <span style={{ fontWeight:400, fontSize:".8rem", color:"#6C757D" }}>
                  ({esPregrado ? "Escuelas Profesionales" : "Especialidades / Programas"})
                </span>
              </label>
              <select className="form-select" value={areaSeleccionada}
                onChange={e => setAreaSeleccionada(e.target.value)}>
                <option value="">Seleccionar área...</option>
                {areasDisponibles.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              {areasDisponibles.length === 0 && (
                <small className="text-warning">
                  ⚠️ No hay áreas {esPregrado ? "de pregrado" : "de postgrado"} vinculadas a este convenio
                </small>
              )}
            </div>
          )}

          {/* Preview Gestión Académica */}
          {subtipoSeleccionado && (
            <div style={{ background:"#F8F9FA", borderRadius:10, padding:"1rem 1.25rem",
              border:"1px solid #E9ECEF", marginBottom:"1.5rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                marginBottom:".65rem" }}>
                <strong style={{ fontSize:".9rem", color:"#3D1A4F" }}>
                  📊 Datos en Gestión Académica — {anio}
                </strong>
                <button onClick={cargarResumenGestion} disabled={loadingResumen}
                  style={{ background:"none", border:"1px solid #6C757D", color:"#6C757D",
                    padding:".25rem .7rem", borderRadius:6, cursor:"pointer", fontSize:".78rem" }}>
                  {loadingResumen ? "⏳" : "🔄 Actualizar"}
                </button>
              </div>
              {loadingResumen ? (
                <p style={{ margin:0, fontSize:".85rem", color:"#6C757D" }}>Consultando...</p>
              ) : resumenGestion ? (
                <div style={{ display:"grid",
                  gridTemplateColumns: esPregrado ? "repeat(3,1fr)" : "repeat(2,1fr)",
                  gap:".5rem" }}>
                  {esPregrado ? (
                    <>
                      <StatCard n={resumenGestion.num_cursos}   label="Cursos"   />
                      <StatCard n={resumenGestion.num_alumnos}  label="Alumnos"  />
                      <StatCard n={resumenGestion.num_internos} label="Internos" />
                    </>
                  ) : (
                    <>
                      <StatCard n={resumenGestion.num_residentes} label="Residentes" />
                      <StatCard n={resumenGestion.num_rotaciones} label="Rotaciones"  />
                    </>
                  )}
                </div>
              ) : (
                <p style={{ margin:0, fontSize:".85rem", color:"#6C757D" }}>
                  Sin datos registrados en Gestión Académica para {anio}.
                  Los datos aparecerán cuando se creen cursos, internados, residencias o rotaciones.
                </p>
              )}
            </div>
          )}

          {/* Observaciones */}
          <div style={{ marginBottom:"1.5rem" }}>
            <label style={{ display:"block", fontWeight:600, marginBottom:".5rem" }}>
              Observaciones (opcional)
            </label>
            <textarea className="form-control" rows={4} value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Comentarios, incidencias, notas del periodo..."/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"1.25rem 2rem", borderTop:"1px solid #DEE2E6",
          display:"flex", justifyContent:"flex-end", gap:"1rem",
          position:"sticky", bottom:0, background:"white",
          borderRadius:"0 0 12px 12px" }}>
          <button onClick={onClose} disabled={saving} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={saving}
            className="btn btn-primary">
            {saving ? "Guardando..." : "💾 Guardar Informe"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ background:"white", borderRadius:8, padding:".65rem .9rem",
      textAlign:"center", border:"1px solid #E9ECEF" }}>
      <div style={{ fontSize:"1.6rem", fontWeight:700, color:"#3D1A4F" }}>{n ?? 0}</div>
      <div style={{ fontSize:".75rem", color:"#6C757D" }}>{label}</div>
    </div>
  );
}