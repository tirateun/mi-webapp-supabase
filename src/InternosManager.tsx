// src/InternosManager.tsx
// Gestión de internados: contenedor (como curso) + asignación de alumnos
// + Rotaciones externas de internado (grupal: varios alumnos, hacia otra sede)
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const HORAS_OPT = ["8","12","16","20","24","32","36","Otro"];

interface Internado {
  id: string; nombre: string; convenio_id: string;
  subtipo_nombre?: string; sede_nombre?: string;
  fecha_inicio: string; fecha_fin: string; anio: number;
  num_alumnos?: number;
}
interface RotacionInternado {
  id: string; nombre: string; convenio_id: string;
  subtipo_nombre?: string; sede_nombre?: string;
  fecha_inicio: string; fecha_fin: string; anio: number;
  num_alumnos?: number;
}
interface Alumno { id: string; dni: string; apellidos: string; nombres: string; codigo_universitario: string; }
interface Subtipo { id: string; subtipo_nombre: string; }
interface Sede    { id: string; nombre: string; }

interface Props { convenioId: string; convenioNombre: string; isAdmin?: boolean; }

const EMPTY = {
  nombre: "", subtipoId: "", sedeId: "", sedeMano: "",
  horasSel: "36", horasMano: "", fechaInicio: "", fechaFin: "", areaId: "",
};
const EMPTY_ROT = { nombre: "", subtipoId: "", sedeId: "", fechaInicio: "", fechaFin: "", areaId: "" };

export default function InternosManager({ convenioId, convenioNombre, isAdmin = false }: Props) {
  const [internados, setInternados]   = useState<Internado[]>([]);
  const [subtipos, setSubtipos]       = useState<Subtipo[]>([]);
  const [sedes, setSedes]             = useState<Sede[]>([]);
  const [areas, setAreas]             = useState<{id:string;nombre:string}[]>([]);
  const [instInfo, setInstInfo]       = useState<{nombre:string;tipo:string}|null>(null);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editando, setEditando]       = useState<Internado|null>(null);
  const [form, setForm]               = useState({ ...EMPTY });
  const [saving, setSaving]           = useState(false);
  // Modal alumnos (internado propio)
  const [internadoSel, setInternadoSel] = useState<Internado|null>(null);
  const [alumnosAsig, setAlumnosAsig]   = useState<Alumno[]>([]);
  const [todosAlumnos, setTodosAlumnos] = useState<Alumno[]>([]);
  const [busqAlumno, setBusqAlumno]     = useState("");
  const [showAlumnos, setShowAlumnos]   = useState(false);

  // Rotaciones de internado (grupal, hacia sede externa)
  const [rotaciones, setRotaciones]         = useState<RotacionInternado[]>([]);
  const [loadingRot, setLoadingRot]         = useState(false);
  const [showRotForm, setShowRotForm]       = useState(false);
  const [editandoRot, setEditandoRot]       = useState<RotacionInternado|null>(null);
  const [rotForm, setRotForm]               = useState({ ...EMPTY_ROT });
  const [savingRot, setSavingRot]           = useState(false);
  // Modal alumnos de una rotación
  const [rotSel, setRotSel]                 = useState<RotacionInternado|null>(null);
  const [alumnosAsigRot, setAlumnosAsigRot] = useState<(Alumno & { origen?: string })[]>([]);
  const [busqAlumnoRot, setBusqAlumnoRot]   = useState("");
  const [showAlumnosRot, setShowAlumnosRot] = useState(false);

  const TIPOS_UNICOS = ["hospital","clínica","clinica","instituto","policlínico","policlinico","centro de salud"];
  const esUnica = (t:string) => TIPOS_UNICOS.some(x => t?.toLowerCase().includes(x));

  useEffect(() => {
    if (convenioId) { cargar(); cargarSubtipos(); cargarSedes(); cargarInstInfo(); cargarAreas(); cargarRotaciones(); }
  }, [convenioId]);

  const cargarAreas = async () => {
    const { data: links } = await supabase.from("agreement_areas_vinculadas")
      .select("area_vinculada_id").eq("agreement_id", convenioId);
    if (!links || links.length === 0) { setAreas([]); return; }
    const ids = links.map((l: any) => l.area_vinculada_id).filter(Boolean);
    const { data } = await supabase.from("areas_vinculadas")
      .select("id, nombre").in("id", ids).order("nombre");
    // Internados: solo áreas pregrado (Escuelas Profesionales)
    setAreas((data || []).filter((a: any) => a.nombre?.toLowerCase().includes("escuela")));
  };

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from("internos")
      .select("*, num_alumnos:internado_alumnos(count), agreement_subtypes(subtipo_nombre), sedes_hospitalarias(nombre)")
      .eq("convenio_id", convenioId).order("fecha_inicio", { ascending: false });
    setInternados((data||[]).map((i:any) => ({
      ...i,
      subtipo_nombre: i.agreement_subtypes?.subtipo_nombre || "",
      sede_nombre: i.sedes_hospitalarias?.nombre || i.sede_hospital || "",
      num_alumnos: i.num_alumnos?.[0]?.count ?? 0,
    })));
    setLoading(false);
  };

  const cargarSubtipos = async () => {
    const { data } = await supabase.from("agreement_subtypes")
      .select("id, subtipo_nombre").eq("agreement_id", convenioId).order("subtipo_nombre");
    // Internados: solo subtipos de PREGRADO
    setSubtipos((data || []).filter(s =>
      s.subtipo_nombre?.toUpperCase().includes("PREGRADO")
    ));
  };

  const cargarInstInfo = async () => {
    const { data } = await supabase.from("agreements")
      .select("instituciones(nombre, tipo)").eq("id", convenioId).single();
    const inst = (data as any)?.instituciones;
    setInstInfo(inst ? { nombre: inst.nombre, tipo: inst.tipo || "" } : null);
  };

  const cargarSedes = async () => {
    const { data } = await supabase.from("convenio_sedes")
      .select("sedes_hospitalarias(id, nombre)").eq("convenio_id", convenioId);
    setSedes((data||[]).map((d:any) => d.sedes_hospitalarias).filter(Boolean));
  };

  const cargarTodosAlumnos = async () => {
    if (todosAlumnos.length > 0) return;
    const { data } = await supabase.from("alumnos").select("*").order("apellidos");
    setTodosAlumnos(data || []);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) {
      alert("❌ Nombre, fecha inicio y fecha fin son obligatorios"); return;
    }
    // sede_id solo si es un UUID válido
    const sedeIdValido = form.sedeId && form.sedeId !== "__auto__" ? form.sedeId : null;
    const anio = parseInt(form.fechaInicio.split("-")[0]);
    setSaving(true);
    try {
      const payload = {
        convenio_id: convenioId, nombre: form.nombre.trim(),
        subtipo_id: form.subtipoId || null, sede_id: sedeIdValido,
        area_vinculada_id: form.areaId || null,
        fecha_inicio: form.fechaInicio, fecha_fin: form.fechaFin, anio,
      };
      const { error } = editando
        ? await supabase.from("internos").update(payload).eq("id", editando.id)
        : await supabase.from("internos").insert(payload);
      if (error) throw error;
      setShowForm(false); cargar();
    } catch (e:any) { alert("❌ " + e.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id:string) => {
    if (!confirm("¿Eliminar este internado?")) return;
    await supabase.from("internos").delete().eq("id", id); cargar();
  };

  // Modal alumnos (internado propio)
  const abrirAlumnos = async (i: Internado) => {
    setInternadoSel(i); setBusqAlumno(""); setShowAlumnos(true);
    const [{ data: asig }, { data: todos }] = await Promise.all([
      supabase.from("internado_alumnos").select("alumno_id, alumnos(*)").eq("internado_id", i.id),
      supabase.from("alumnos").select("*").order("apellidos"),
    ]);
    setAlumnosAsig((asig||[]).map((a:any) => a.alumnos).filter(Boolean));
    setTodosAlumnos(todos || []);
  };

  const asignar = async (a: Alumno) => {
    if (alumnosAsig.find(x => x.id === a.id)) return;
    await supabase.from("internado_alumnos").insert({ internado_id: internadoSel!.id, alumno_id: a.id });
    setAlumnosAsig(prev => [...prev, a]); cargar();
  };

  const quitar = async (aId:string) => {
    await supabase.from("internado_alumnos").delete()
      .eq("internado_id", internadoSel!.id).eq("alumno_id", aId);
    setAlumnosAsig(prev => prev.filter(a => a.id !== aId)); cargar();
  };

  const disponibles = todosAlumnos.filter(a => {
    const q = busqAlumno.toLowerCase();
    const asignado = alumnosAsig.find(x => x.id === a.id);
    if (asignado) return false;
    if (!q) return true;
    return (a.apellidos + " " + a.nombres + " " + a.dni).toLowerCase().includes(q);
  });

  // ============================================
  // ROTACIONES DE INTERNADO (grupal, hacia sede externa)
  // ============================================
  const cargarRotaciones = async () => {
    setLoadingRot(true);
    const { data } = await supabase.from("rotaciones_internado")
      .select("*, num_alumnos:rotacion_internado_alumnos(count), agreement_subtypes(subtipo_nombre), sedes_hospitalarias(nombre)")
      .eq("convenio_id", convenioId).order("fecha_inicio", { ascending: false });
    setRotaciones((data||[]).map((r:any) => ({
      ...r,
      subtipo_nombre: r.agreement_subtypes?.subtipo_nombre || "",
      sede_nombre: r.sedes_hospitalarias?.nombre || "",
      num_alumnos: r.num_alumnos?.[0]?.count ?? 0,
    })));
    setLoadingRot(false);
  };

  const guardarRotacion = async () => {
    if (!rotForm.nombre.trim() || !rotForm.fechaInicio || !rotForm.fechaFin) {
      alert("❌ Nombre, fecha inicio y fecha fin son obligatorios"); return;
    }
    const sedeIdValido = rotForm.sedeId && rotForm.sedeId !== "__auto__" ? rotForm.sedeId : null;
    const anio = parseInt(rotForm.fechaInicio.split("-")[0]);
    setSavingRot(true);
    try {
      const payload = {
        convenio_id: convenioId, // convenio DESTINO (donde rotan)
        nombre: rotForm.nombre.trim(),
        subtipo_id: rotForm.subtipoId || null, sede_id: sedeIdValido,
        area_vinculada_id: rotForm.areaId || null,
        fecha_inicio: rotForm.fechaInicio, fecha_fin: rotForm.fechaFin, anio,
      };
      const { error } = editandoRot
        ? await supabase.from("rotaciones_internado").update(payload).eq("id", editandoRot.id)
        : await supabase.from("rotaciones_internado").insert(payload);
      if (error) throw error;
      setShowRotForm(false); cargarRotaciones();
    } catch (e:any) { alert("❌ " + e.message); }
    finally { setSavingRot(false); }
  };

  const eliminarRotacion = async (id:string) => {
    if (!confirm("¿Eliminar esta rotación de internado?")) return;
    await supabase.from("rotaciones_internado").delete().eq("id", id); cargarRotaciones();
  };

  // Busca en qué internado (convenio de origen) figura cada alumno, para mostrarlo informativamente
  const buscarOrigen = async (alumnoIds: string[]): Promise<Record<string,string>> => {
    if (alumnoIds.length === 0) return {};
    const { data } = await supabase.from("internado_alumnos")
      .select("alumno_id, internos(convenio_id, agreements(name, instituciones(nombre)))")
      .in("alumno_id", alumnoIds);
    const map: Record<string,string> = {};
    (data || []).forEach((row: any) => {
      if (map[row.alumno_id]) return; // ya tiene origen, no sobreescribir
      const inst = row.internos?.agreements?.instituciones?.nombre || row.internos?.agreements?.name || "";
      if (inst) map[row.alumno_id] = inst;
    });
    return map;
  };

  const abrirAlumnosRot = async (r: RotacionInternado) => {
    setRotSel(r); setBusqAlumnoRot(""); setShowAlumnosRot(true);
    const [{ data: asig }, { data: todos }] = await Promise.all([
      supabase.from("rotacion_internado_alumnos").select("alumno_id, alumnos(*)").eq("rotacion_internado_id", r.id),
      supabase.from("alumnos").select("*").order("apellidos"),
    ]);
    setTodosAlumnos(todos || []);
    const asignados = (asig||[]).map((a:any) => a.alumnos).filter(Boolean) as Alumno[];
    const origenes = await buscarOrigen(asignados.map(a => a.id));
    setAlumnosAsigRot(asignados.map(a => ({ ...a, origen: origenes[a.id] || "" })));
  };

  const asignarRot = async (a: Alumno) => {
    if (alumnosAsigRot.find(x => x.id === a.id)) return;
    await supabase.from("rotacion_internado_alumnos").insert({ rotacion_internado_id: rotSel!.id, alumno_id: a.id });
    const origenes = await buscarOrigen([a.id]);
    setAlumnosAsigRot(prev => [...prev, { ...a, origen: origenes[a.id] || "" }]);
    cargarRotaciones();
  };

  const quitarRot = async (aId:string) => {
    await supabase.from("rotacion_internado_alumnos").delete()
      .eq("rotacion_internado_id", rotSel!.id).eq("alumno_id", aId);
    setAlumnosAsigRot(prev => prev.filter(a => a.id !== aId)); cargarRotaciones();
  };

  const disponiblesRot = todosAlumnos.filter(a => {
    const q = busqAlumnoRot.toLowerCase();
    const asignado = alumnosAsigRot.find(x => x.id === a.id);
    if (asignado) return false;
    if (!q) return true;
    return (a.apellidos + " " + a.nombres + " " + a.dni).toLowerCase().includes(q);
  });

  const F  = (k:string) => (e:any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const FR = (k:string) => (e:any) => setRotForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width:"100%", padding:".65rem .9rem", border:"1.5px solid #DEE2E6", borderRadius:8, fontSize:".9rem", outline:"none" as const };
  const lbl = { display:"block" as const, fontWeight:600 as const, fontSize:".82rem", marginBottom:4 };

  const sedeField = () => {
    if (instInfo && esUnica(instInfo.tipo)) {
      return (
        <div style={{ ...inp, background:"#F0FAF5", color:"#155724", border:"1.5px solid #C3E6CB", display:"flex", alignItems:"center", gap:".5rem" }}>
          🏥 {instInfo.nombre} <span style={{ fontSize:".75rem", color:"#6C757D", marginLeft:"auto" }}>(auto)</span>
        </div>
      );
    }
    if (sedes.length > 0) {
      return (
        <select style={inp} value={form.sedeId} onChange={F("sedeId")}>
          <option value="">Seleccionar sede...</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      );
    }
    return <input style={inp} value={form.sedeMano} onChange={F("sedeMano")} placeholder="Nombre del hospital..."/>;
  };

  const sedeFieldRot = () => {
    if (instInfo && esUnica(instInfo.tipo)) {
      return (
        <div style={{ ...inp, background:"#F0FAF5", color:"#155724", border:"1.5px solid #C3E6CB", display:"flex", alignItems:"center", gap:".5rem" }}>
          🏥 {instInfo.nombre} <span style={{ fontSize:".75rem", color:"#6C757D", marginLeft:"auto" }}>(auto)</span>
        </div>
      );
    }
    if (sedes.length > 0) {
      return (
        <select style={inp} value={rotForm.sedeId} onChange={FR("sedeId")}>
          <option value="">Seleccionar sede...</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      );
    }
    return <input style={inp} value={rotForm.sedeId} onChange={FR("sedeId")} placeholder="Nombre del hospital..."/>;
  };

  return (
    <div style={{ padding:"1.5rem" }}>
      <div style={{ background:"linear-gradient(135deg,#7B5A1A,#5C4010)", color:"white",
        padding:"1.25rem 1.75rem", borderRadius:12, marginBottom:"1.25rem",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h3 style={{ margin:0, fontSize:"1.3rem", fontWeight:700 }}>👨‍⚕️ Internados</h3>
          <p style={{ margin:".2rem 0 0", opacity:.85, fontSize:".85rem" }}>Periodo anual · {internados.length} registros</p>
        </div>
        {!isAdmin && (
          <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
            <button onClick={() => { setEditando(null); setForm({ ...EMPTY }); setShowForm(true); }}
              style={{ background:"white", color:"#5C4010", border:"none", padding:".6rem 1.2rem", borderRadius:8, fontWeight:700, cursor:"pointer" }}>
              ➕ Nuevo Internado
            </button>
            <button onClick={() => { setEditandoRot(null); setRotForm({ ...EMPTY_ROT }); setShowRotForm(true); }}
              style={{ background:"#1A6B3A", color:"white", border:"none", padding:".6rem 1.2rem", borderRadius:8, fontWeight:700, cursor:"pointer" }}>
              🔄 Nueva Rotación de Internado
            </button>
          </div>
        )}
      </div>

      {/* Sección de rotaciones de internado registradas */}
      <div style={{ marginBottom:"1.25rem" }}>
        <div style={{ background:"white", borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,.08)", padding:"1rem 1.25rem" }}>
          <h5 style={{ margin:"0 0 .75rem", fontSize:"1rem", fontWeight:700, color:"#1A6B3A" }}>
            🔄 Rotaciones de Internado ({rotaciones.length})
          </h5>
          {loadingRot ? (
            <div style={{ textAlign:"center", padding:"1.5rem" }}><div className="spinner-border" style={{ color:"#1A6B3A" }} role="status"/></div>
          ) : rotaciones.length === 0 ? (
            <p style={{ color:"#6C757D", margin:0, fontSize:".85rem" }}>No hay rotaciones de internado registradas</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:".6rem" }}>
              {rotaciones.map(r => (
                <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                  flexWrap:"wrap", gap:".5rem", padding:".75rem .9rem", background:"#F0FAF5", borderRadius:8, border:"1px solid #C3E6CB" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap", marginBottom:".25rem" }}>
                      <strong style={{ fontSize:".9rem" }}>{r.nombre}</strong>
                      <span style={{ background:"#E8F5EE", color:"#1A6B3A", padding:".1rem .5rem", borderRadius:10, fontSize:".75rem", fontWeight:600 }}>{r.anio}</span>
                    </div>
                    <div style={{ fontSize:".8rem", color:"#6C757D", display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                      {r.sede_nombre && <span>🏥 {r.sede_nombre}</span>}
                      <span>📅 {r.fecha_inicio} → {r.fecha_fin}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap" }}>
                    <button onClick={() => abrirAlumnosRot(r)}
                      style={{ background:"#1A6B3A", color:"white", border:"none",
                        padding:".35rem .8rem", borderRadius:7, cursor:"pointer", fontSize:".82rem", fontWeight:600 }}>
                      👩‍🎓 Alumnos ({r.num_alumnos})
                    </button>
                    {!isAdmin && (
                      <>
                        <button onClick={() => { setEditandoRot(r); setRotForm({ nombre:r.nombre, subtipoId:"", sedeId:"", fechaInicio:r.fecha_inicio, fechaFin:r.fecha_fin, areaId:"" }); setShowRotForm(true); }}
                          className="btn btn-sm btn-outline-secondary">✏️</button>
                        <button onClick={() => eliminarRotacion(r.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem" }}><div className="spinner-border" style={{ color:"#7B5A1A" }} role="status"/></div>
      ) : internados.length === 0 ? (
        <div style={{ background:"white", borderRadius:12, padding:"3rem", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize:"2.5rem" }}>👨‍⚕️</div>
          <p style={{ color:"#6C757D", marginTop:".75rem" }}>No hay internados registrados</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {internados.map(i => (
            <div key={i.id} style={{ background:"white", borderRadius:12, padding:"1.1rem 1.25rem",
              boxShadow:"0 2px 8px rgba(0,0,0,.08)", border:"1px solid #E9ECEF" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:".5rem" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap", marginBottom:".35rem" }}>
                    <strong style={{ fontSize:".95rem" }}>{i.nombre}</strong>
                    {i.subtipo_nombre && (
                      <span style={{ background:"#FEF3C7", color:"#7B5A1A", padding:".15rem .6rem", borderRadius:10, fontSize:".78rem", fontWeight:600 }}>
                        {i.subtipo_nombre}
                      </span>
                    )}
                    <span style={{ background:"#E8F5EE", color:"#1A6B3A", padding:".15rem .6rem", borderRadius:10, fontSize:".78rem", fontWeight:600 }}>
                      {i.anio}
                    </span>
                  </div>
                  <div style={{ fontSize:".82rem", color:"#6C757D", display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                    {i.sede_nombre && <span>🏥 {i.sede_nombre}</span>}
                    <span>📅 {i.fecha_inicio} → {i.fecha_fin}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap" }}>
                  <button onClick={() => abrirAlumnos(i)}
                    style={{ background:"#FEF3C7", color:"#7B5A1A", border:"1px solid #F0C040",
                      padding:".35rem .8rem", borderRadius:7, cursor:"pointer", fontSize:".82rem", fontWeight:600 }}>
                    👩‍🎓 Internos ({i.num_alumnos})
                  </button>
                  {!isAdmin && (
                    <>
                      <button onClick={() => { setEditando(i); setForm({ nombre:i.nombre, subtipoId:"", sedeId:"", sedeMano:"", horasSel:"36", horasMano:"", fechaInicio:i.fecha_inicio, fechaFin:i.fecha_fin, areaId:"" }); setShowForm(true); }}
                        className="btn btn-sm btn-outline-secondary">✏️</button>
                      <button onClick={() => eliminar(i.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar internado */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1050,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:580,
            maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              position:"sticky", top:0, background:"white", zIndex:1 }}>
              <h5 style={{ margin:0, fontWeight:700, color:"#5C4010" }}>
                {editando ? "✏️ Editar Internado" : "👨‍⚕️ Nuevo Internado"}
              </h5>
              <button onClick={() => setShowForm(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.5rem 1.75rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div>
                <label style={lbl}>Nombre del Internado <span style={{ color:"#DC3545" }}>*</span></label>
                <input style={inp} value={form.nombre} onChange={F("nombre")} placeholder="Ej: Internado 2026 - Medicina"/>
              </div>
              <div>
                <label style={lbl}>Subtipo Docente</label>
                <select style={inp} value={form.subtipoId} onChange={F("subtipoId")}>
                  <option value="">Seleccionar subtipo...</option>
                  {subtipos.map(s => <option key={s.id} value={s.id}>{s.subtipo_nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Área Vinculada (Escuela)</label>
                {areas.length > 0 ? (
                  <select style={inp} value={form.areaId} onChange={F("areaId")}>
                    <option value="">Seleccionar escuela...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                ) : (
                  <div style={{ ...inp, background:"#FFF3CD", color:"#856404", fontSize:".85rem" }}>
                    ⚠️ No hay Escuelas Profesionales vinculadas a este convenio
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Sede / Hospital</label>
                {sedeField()}
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label style={lbl}>Fecha Inicio <span style={{ color:"#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={form.fechaInicio} onChange={F("fechaInicio")}/>
                </div>
                <div className="col-6">
                  <label style={lbl}>Fecha Fin <span style={{ color:"#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={form.fechaFin} onChange={F("fechaFin")}/>
                </div>
              </div>
              {form.fechaInicio && (
                <div style={{ background:"#FEF3C7", padding:".65rem 1rem", borderRadius:8, fontSize:".82rem", color:"#7B5A1A" }}>
                  ℹ️ Año: <strong>{form.fechaInicio.split("-")[0]}</strong> · Periodo anual enero–diciembre
                </div>
              )}
              <div style={{ display:"flex", gap:".75rem", justifyContent:"flex-end" }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" disabled={saving}>Cancelar</button>
                <button onClick={guardar} disabled={saving}
                  style={{ background:"#7B5A1A", color:"white", border:"none", padding:".65rem 1.5rem", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                  {saving ? "Guardando..." : "💾 Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal alumnos del internado */}
      {showAlumnos && internadoSel && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:1060,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:680,
            maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.35)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              position:"sticky", top:0, background:"white", zIndex:1 }}>
              <div>
                <h5 style={{ margin:0, fontWeight:700, color:"#7B5A1A" }}>👩‍🎓 Internos — {internadoSel.nombre}</h5>
                <p style={{ margin:".2rem 0 0", fontSize:".82rem", color:"#6C757D" }}>
                  {alumnosAsig.length} alumno(s) asignado(s)
                </p>
              </div>
              <button onClick={() => setShowAlumnos(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.25rem 1.75rem" }}>
              {alumnosAsig.length > 0 && (
                <div style={{ marginBottom:"1.5rem" }}>
                  <h6 style={{ fontWeight:700, color:"#7B5A1A", marginBottom:".75rem" }}>✅ Asignados ({alumnosAsig.length})</h6>
                  <div style={{ display:"flex", flexDirection:"column", gap:".35rem", maxHeight:200, overflowY:"auto" }}>
                    {alumnosAsig.map(a => (
                      <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                        padding:".5rem .9rem", background:"#FEF9E7", borderRadius:8, border:"1px solid #F0C040" }}>
                        <div>
                          <strong style={{ fontSize:".9rem" }}>{a.apellidos}, {a.nombres}</strong>
                          <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>{a.dni || ""}</span>
                        </div>
                        {!isAdmin && (
                          <button onClick={() => quitar(a.id)} className="btn btn-sm btn-outline-danger" style={{ padding:".2rem .6rem" }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!isAdmin && (
                <div>
                  <h6 style={{ fontWeight:700, color:"#495057", marginBottom:".75rem" }}>➕ Agregar interno del padrón</h6>
                  <input type="text" value={busqAlumno} onChange={e => setBusqAlumno(e.target.value)}
                    placeholder="🔍  Buscar por nombre o DNI..."
                    style={{ ...inp, marginBottom:".75rem" }}/>
                  <div style={{ maxHeight:260, overflowY:"auto", display:"flex", flexDirection:"column", gap:".35rem" }}>
                    {disponibles.slice(0, 50).map(a => (
                      <div key={a.id} style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", padding:".5rem .9rem",
                        background:"#F8F9FA", borderRadius:8, border:"1px solid #E9ECEF" }}>
                        <div>
                          <span style={{ fontSize:".9rem" }}><strong>{a.apellidos}</strong>, {a.nombres}</span>
                          <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>{a.dni || a.codigo_universitario || ""}</span>
                        </div>
                        <button onClick={() => asignar(a)}
                          style={{ background:"#7B5A1A", color:"white", border:"none",
                            padding:".3rem .75rem", borderRadius:6, cursor:"pointer", fontSize:".82rem" }}>
                          + Agregar
                        </button>
                      </div>
                    ))}
                    {disponibles.length === 0 && (
                      <p style={{ color:"#6C757D", fontSize:".85rem", textAlign:"center", padding:"1rem" }}>
                        {busqAlumno ? "Sin resultados" : "Todos los alumnos ya están asignados"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar rotación de internado */}
      {showRotForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1050,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:580,
            maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              position:"sticky", top:0, background:"white", zIndex:1 }}>
              <h5 style={{ margin:0, fontWeight:700, color:"#0D4A28" }}>
                {editandoRot ? "✏️ Editar Rotación de Internado" : "🔄 Nueva Rotación de Internado"}
              </h5>
              <button onClick={() => setShowRotForm(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.5rem 1.75rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div style={{ background:"#FEF3C7", padding:".65rem 1rem", borderRadius:8, fontSize:".82rem", color:"#7B5A1A" }}>
                ℹ️ Aquí solo defines el grupo/periodo de la rotación. Los alumnos se seleccionan del padrón (ya están registrados como internos en su convenio de origen).
              </div>
              <div>
                <label style={lbl}>Nombre de la Rotación <span style={{ color:"#DC3545" }}>*</span></label>
                <input style={inp} value={rotForm.nombre} onChange={FR("nombre")} placeholder="Ej: Rotación Externa Medicina Interna 2026"/>
              </div>
              <div>
                <label style={lbl}>Subtipo Docente (convenio destino)</label>
                <select style={inp} value={rotForm.subtipoId} onChange={FR("subtipoId")}>
                  <option value="">Seleccionar subtipo...</option>
                  {subtipos.map(s => <option key={s.id} value={s.id}>{s.subtipo_nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Área Vinculada (Escuela, convenio destino)</label>
                {areas.length > 0 ? (
                  <select style={inp} value={rotForm.areaId} onChange={FR("areaId")}>
                    <option value="">Seleccionar escuela...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                ) : (
                  <div style={{ ...inp, background:"#FFF3CD", color:"#856404", fontSize:".85rem" }}>
                    ⚠️ No hay Escuelas Profesionales vinculadas a este convenio
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Sede / Hospital (destino)</label>
                {sedeFieldRot()}
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label style={lbl}>Fecha Inicio <span style={{ color:"#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={rotForm.fechaInicio} onChange={FR("fechaInicio")}/>
                </div>
                <div className="col-6">
                  <label style={lbl}>Fecha Fin <span style={{ color:"#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={rotForm.fechaFin} onChange={FR("fechaFin")}/>
                </div>
              </div>
              {rotForm.fechaInicio && (
                <div style={{ background:"#E8F5EE", padding:".65rem 1rem", borderRadius:8, fontSize:".82rem", color:"#1A6B3A" }}>
                  ℹ️ Año: <strong>{rotForm.fechaInicio.split("-")[0]}</strong>
                </div>
              )}
              <div style={{ display:"flex", gap:".75rem", justifyContent:"flex-end" }}>
                <button onClick={() => setShowRotForm(false)} className="btn btn-secondary" disabled={savingRot}>Cancelar</button>
                <button onClick={guardarRotacion} disabled={savingRot}
                  style={{ background:"#1A6B3A", color:"white", border:"none", padding:".65rem 1.5rem", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                  {savingRot ? "Guardando..." : "💾 Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal alumnos de la rotación de internado (selección del padrón, muestra sede de origen) */}
      {showAlumnosRot && rotSel && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:1060,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:680,
            maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.35)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              position:"sticky", top:0, background:"white", zIndex:1 }}>
              <div>
                <h5 style={{ margin:0, fontWeight:700, color:"#0D4A28" }}>👩‍🎓 Alumnos rotantes — {rotSel.nombre}</h5>
                <p style={{ margin:".2rem 0 0", fontSize:".82rem", color:"#6C757D" }}>
                  {alumnosAsigRot.length} alumno(s) asignado(s)
                </p>
              </div>
              <button onClick={() => setShowAlumnosRot(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.25rem 1.75rem" }}>
              {alumnosAsigRot.length > 0 && (
                <div style={{ marginBottom:"1.5rem" }}>
                  <h6 style={{ fontWeight:700, color:"#0D4A28", marginBottom:".75rem" }}>✅ Asignados ({alumnosAsigRot.length})</h6>
                  <div style={{ display:"flex", flexDirection:"column", gap:".35rem", maxHeight:200, overflowY:"auto" }}>
                    {alumnosAsigRot.map(a => (
                      <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                        padding:".5rem .9rem", background:"#F0FAF5", borderRadius:8, border:"1px solid #C3E6CB" }}>
                        <div>
                          <strong style={{ fontSize:".9rem" }}>{a.apellidos}, {a.nombres}</strong>
                          <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>{a.dni || ""}</span>
                          {a.origen && (
                            <div style={{ fontSize:".75rem", color:"#1A6B3A", marginTop:".1rem" }}>📍 Origen: {a.origen}</div>
                          )}
                        </div>
                        {!isAdmin && (
                          <button onClick={() => quitarRot(a.id)} className="btn btn-sm btn-outline-danger" style={{ padding:".2rem .6rem" }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!isAdmin && (
                <div>
                  <h6 style={{ fontWeight:700, color:"#495057", marginBottom:".75rem" }}>➕ Agregar alumno del padrón</h6>
                  <input type="text" value={busqAlumnoRot} onChange={e => setBusqAlumnoRot(e.target.value)}
                    placeholder="🔍  Buscar por nombre o DNI..."
                    style={{ ...inp, marginBottom:".75rem" }}/>
                  <div style={{ maxHeight:260, overflowY:"auto", display:"flex", flexDirection:"column", gap:".35rem" }}>
                    {disponiblesRot.slice(0, 50).map(a => (
                      <div key={a.id} style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", padding:".5rem .9rem",
                        background:"#F8F9FA", borderRadius:8, border:"1px solid #E9ECEF" }}>
                        <div>
                          <span style={{ fontSize:".9rem" }}><strong>{a.apellidos}</strong>, {a.nombres}</span>
                          <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>{a.dni || a.codigo_universitario || ""}</span>
                        </div>
                        <button onClick={() => asignarRot(a)}
                          style={{ background:"#1A6B3A", color:"white", border:"none",
                            padding:".3rem .75rem", borderRadius:6, cursor:"pointer", fontSize:".82rem" }}>
                          + Agregar
                        </button>
                      </div>
                    ))}
                    {disponiblesRot.length === 0 && (
                      <p style={{ color:"#6C757D", fontSize:".85rem", textAlign:"center", padding:"1rem" }}>
                        {busqAlumnoRot ? "Sin resultados" : "Todos los alumnos ya están asignados"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}