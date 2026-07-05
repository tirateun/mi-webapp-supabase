// src/ResidentesManager.tsx
// Gestión de residencias: contenedor + asignación de residentes (desde el padrón de alumnos)
// + Rotaciones externas de residentes (individual, hacia/desde otro convenio)
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const getPeriodo = (f: string) => {
  if (!f) return "";
  const [y, m] = f.split("-").map(Number);
  const sy = m >= 10 ? y : y - 1;
  return `OCT ${sy} – SEP ${sy + 1}`;
};

interface Residencia {
  id: string; nombre: string; convenio_id: string;
  subtipo_nombre?: string; sede_nombre?: string;
  fecha_inicio: string; fecha_fin: string; periodo: string; anio: number;
  num_residentes?: number;
}
interface Alumno { id: string; dni: string; apellidos: string; nombres: string; codigo_universitario: string; }
interface Residente {
  id: string; residencia_id: string; alumno_id: string;
  especialidad: string; anio_residencia: number;
  alumnos?: Alumno;
}
interface Rotante {
  id: string; convenio_id: string; alumno_id: string;
  especialidad: string; anio_residencia: number; institucion_origen: string;
  subtipo_id: string; sede_id: string; area_vinculada_id: string;
  fecha_inicio: string; fecha_fin: string; periodo: string;
  alumnos?: Alumno;
  subtipo_nombre?: string; sede_nombre?: string; area_nombre?: string;
}
interface Subtipo { id: string; subtipo_nombre: string; }
interface Sede    { id: string; nombre: string; }

interface Props { convenioId: string; convenioNombre: string; isAdmin?: boolean; }

const EMPTY_RES = { nombre:"", subtipoId:"", sedeId:"", fechaInicio:"", fechaFin:"", areaId:"" };
const EMPTY_ROT = {
  alumnoId: "", especialidad: "", anioResidencia: "1", institucionOrigen: "",
  subtipoId: "", sedeId: "", areaId: "", fechaInicio: "", fechaFin: "",
};

export default function ResidentesManager({ convenioId, convenioNombre, isAdmin = false }: Props) {
  const [residencias, setResidencias] = useState<Residencia[]>([]);
  const [subtipos, setSubtipos]       = useState<Subtipo[]>([]);
  const [sedes, setSedes]             = useState<Sede[]>([]);
  const [areas, setAreas]             = useState<{id:string;nombre:string}[]>([]);
  const [instInfo, setInstInfo]       = useState<{nombre:string;tipo:string}|null>(null);
  const [loading, setLoading]         = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editando, setEditando]       = useState<Residencia|null>(null);
  const [form, setForm]               = useState({ ...EMPTY_RES });
  const [saving, setSaving]           = useState(false);

  // Modal residentes (asignación desde padrón)
  const [residSel, setResidSel]             = useState<Residencia|null>(null);
  const [residentes, setResidentes]         = useState<Residente[]>([]);
  const [showResidentes, setShowResidentes] = useState(false);
  const [showAddRes, setShowAddRes]         = useState(false);
  const [todosAlumnos, setTodosAlumnos]     = useState<Alumno[]>([]);
  const [busqAlumno, setBusqAlumno]         = useState("");
  const [alumnoSelId, setAlumnoSelId]       = useState("");
  const [especialidadNueva, setEspecialidadNueva] = useState("");
  const [anioResNuevo, setAnioResNuevo]     = useState("1");
  const [savingPer, setSavingPer]           = useState(false);

  // Rotaciones externas de residentes (individual)
  const [rotantes, setRotantes]       = useState<Rotante[]>([]);
  const [loadingRot, setLoadingRot]   = useState(false);
  const [showRotList, setShowRotList] = useState(false);
  const [showRotForm, setShowRotForm] = useState(false);
  const [rotForm, setRotForm]         = useState({ ...EMPTY_ROT });
  const [busqAlumnoRot, setBusqAlumnoRot] = useState("");
  const [origenInfo, setOrigenInfo]   = useState("");
  const [savingRot, setSavingRot]     = useState(false);

  const TIPOS_UNICOS = ["hospital","clínica","clinica","instituto","policlínico","policlinico"];
  const esUnica = (t:string) => TIPOS_UNICOS.some(x => t?.toLowerCase().includes(x));

  useEffect(() => {
    if (convenioId) { cargar(); cargarSubtipos(); cargarSedes(); cargarInstInfo(); cargarAreas(); cargarRotantes(); }
  }, [convenioId]);

  const cargarAreas = async () => {
    const { data: links } = await supabase.from("agreement_areas_vinculadas")
      .select("area_vinculada_id").eq("agreement_id", convenioId);
    if (!links || links.length === 0) { setAreas([]); return; }
    const ids = links.map((l: any) => l.area_vinculada_id).filter(Boolean);
    const { data } = await supabase.from("areas_vinculadas")
      .select("id, nombre").in("id", ids).order("nombre");
    // Residencias: solo áreas postgrado (excluir Escuelas)
    setAreas((data || []).filter((a: any) => !a.nombre?.toLowerCase().includes("escuela")));
  };

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from("residencias")
      .select("*, num_residentes:residentes(count), agreement_subtypes(subtipo_nombre), sedes_hospitalarias(nombre)")
      .eq("convenio_id", convenioId).order("fecha_inicio", { ascending: false });
    setResidencias((data||[]).map((r:any) => ({
      ...r,
      subtipo_nombre: r.agreement_subtypes?.subtipo_nombre || "",
      sede_nombre: r.sedes_hospitalarias?.nombre || "",
      num_residentes: r.num_residentes?.[0]?.count ?? 0,
    })));
    setLoading(false);
  };

  const cargarSubtipos = async () => {
    const { data } = await supabase.from("agreement_subtypes")
      .select("id, subtipo_nombre").eq("agreement_id", convenioId).order("subtipo_nombre");
    // Residencias: excluir subtipos de PREGRADO
    setSubtipos((data || []).filter(s =>
      !s.subtipo_nombre?.toUpperCase().includes("PREGRADO")
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

  const guardarResidencia = async () => {
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) {
      alert("❌ Nombre y fechas son obligatorios"); return;
    }
    const periodo = getPeriodo(form.fechaInicio);
    const anio = parseInt(form.fechaInicio.split("-")[0]);
    const sedeIdValido = form.sedeId && form.sedeId !== "__auto__" ? form.sedeId : null;
    setSaving(true);
    try {
      const payload = {
        convenio_id: convenioId, nombre: form.nombre.trim(),
        subtipo_id: form.subtipoId || null, sede_id: sedeIdValido,
        area_vinculada_id: form.areaId || null,
        fecha_inicio: form.fechaInicio, fecha_fin: form.fechaFin,
        periodo, anio,
      };
      const { error } = editando
        ? await supabase.from("residencias").update(payload).eq("id", editando.id)
        : await supabase.from("residencias").insert(payload);
      if (error) throw error;
      setShowForm(false); cargar();
    } catch (e:any) { alert("❌ " + e.message); }
    finally { setSaving(false); }
  };

  const eliminarResidencia = async (id:string) => {
    if (!confirm("¿Eliminar esta residencia y todos sus residentes?")) return;
    await supabase.from("residencias").delete().eq("id", id); cargar();
  };

  // ============================================
  // RESIDENTES — asignación desde el padrón de alumnos
  // ============================================
  const abrirResidentes = async (r: Residencia) => {
    setResidSel(r); setShowResidentes(true); setShowAddRes(false);
    setBusqAlumno(""); setAlumnoSelId(""); setEspecialidadNueva(""); setAnioResNuevo("1");
    cargarTodosAlumnos();
    const { data } = await supabase.from("residentes")
      .select("*, alumnos(*)").eq("residencia_id", r.id);
    setResidentes((data || []).sort((a: any, b: any) =>
      (a.alumnos?.apellidos || "").localeCompare(b.alumnos?.apellidos || "")
    ));
  };

  const guardarResidente = async () => {
    if (!alumnoSelId) { alert("❌ Selecciona un alumno del padrón"); return; }
    setSavingPer(true);
    try {
      const { error } = await supabase.from("residentes").insert({
        residencia_id: residSel!.id, convenio_id: convenioId,
        alumno_id: alumnoSelId,
        especialidad: especialidadNueva.trim() || null,
        anio_residencia: parseInt(anioResNuevo) || 1,
        fecha_inicio: residSel!.fecha_inicio,
        fecha_fin: residSel!.fecha_fin,
        periodo: residSel!.periodo,
      });
      if (error) throw error;
      setBusqAlumno(""); setAlumnoSelId(""); setEspecialidadNueva(""); setAnioResNuevo("1");
      setShowAddRes(false);
      abrirResidentes(residSel!);
      cargar();
    } catch (e:any) { alert("❌ " + e.message); }
    finally { setSavingPer(false); }
  };

  const eliminarResidente = async (id:string) => {
    if (!confirm("¿Eliminar este residente?")) return;
    await supabase.from("residentes").delete().eq("id", id);
    setResidentes(prev => prev.filter(r => r.id !== id));
    cargar();
  };

  const alumnosDisponiblesRes = todosAlumnos.filter(a => {
    const yaAsignado = residentes.find(r => r.alumno_id === a.id);
    if (yaAsignado) return false;
    const q = busqAlumno.toLowerCase();
    if (!q) return true;
    return (a.apellidos + " " + a.nombres + " " + a.dni).toLowerCase().includes(q);
  });

  // ============================================
  // ROTACIONES EXTERNAS DE RESIDENTES (individual)
  // ============================================
  const cargarRotantes = async () => {
    setLoadingRot(true);
    const { data } = await supabase
      .from("rotacion_personas")
      .select(`*, alumnos(*), agreement_subtypes(subtipo_nombre),
               sedes_hospitalarias(nombre), areas_vinculadas(nombre)`)
      .eq("convenio_id", convenioId)
      .order("fecha_inicio", { ascending: false });
    setRotantes((data || []).map((r: any) => ({
      ...r,
      subtipo_nombre: r.agreement_subtypes?.subtipo_nombre || "",
      sede_nombre: r.sedes_hospitalarias?.nombre || "",
      area_nombre: r.areas_vinculadas?.nombre || "",
    })));
    setLoadingRot(false);
  };

  const abrirNuevaRotacion = () => {
    const sedeAuto = instInfo && esUnica(instInfo.tipo) ? "__auto__" : "";
    setRotForm({ ...EMPTY_ROT, sedeId: sedeAuto });
    setBusqAlumnoRot(""); setOrigenInfo("");
    cargarTodosAlumnos();
    setShowRotForm(true);
  };

  const seleccionarAlumnoRotacion = async (a: Alumno) => {
    setRotForm(f => ({ ...f, alumnoId: a.id }));
    setOrigenInfo("Buscando residencia de origen...");
    // Busca su residencia "de casa" para mostrar de dónde viene (informativo)
    const { data } = await supabase
      .from("residentes")
      .select("especialidad, anio_residencia, residencias(convenio_id, agreements(name, instituciones(nombre)))")
      .eq("alumno_id", a.id)
      .limit(1);
    const home = (data && data[0]) as any;
    if (home) {
      const inst = home.residencias?.agreements?.instituciones?.nombre || home.residencias?.agreements?.name || "";
      setOrigenInfo(inst ? `📍 Residencia de origen: ${inst}` : "ℹ️ No se encontró residencia de origen registrada");
      setRotForm(f => ({
        ...f,
        especialidad: home.especialidad || f.especialidad,
        anioResidencia: home.anio_residencia ? String(home.anio_residencia) : f.anioResidencia,
        institucionOrigen: inst || f.institucionOrigen,
      }));
    } else {
      setOrigenInfo("ℹ️ No se encontró residencia de origen registrada para este alumno");
    }
  };

  const guardarRotacion = async () => {
    if (!rotForm.alumnoId) { alert("❌ Selecciona un alumno del padrón"); return; }
    if (!rotForm.fechaInicio || !rotForm.fechaFin) { alert("❌ Las fechas son obligatorias"); return; }
    const periodo = getPeriodo(rotForm.fechaInicio);
    const sedeIdValido = rotForm.sedeId && rotForm.sedeId !== "__auto__" ? rotForm.sedeId : null;
    setSavingRot(true);
    try {
      const payload = {
        convenio_id: convenioId, // convenio DESTINO (donde rota)
        alumno_id: rotForm.alumnoId,
        subtipo_id: rotForm.subtipoId || null,
        sede_id: sedeIdValido,
        area_vinculada_id: rotForm.areaId || null,
        especialidad: rotForm.especialidad.trim() || null,
        anio_residencia: parseInt(rotForm.anioResidencia) || null,
        institucion_origen: rotForm.institucionOrigen.trim() || null,
        fecha_inicio: rotForm.fechaInicio,
        fecha_fin: rotForm.fechaFin,
        periodo,
      };
      const { error } = await supabase.from("rotacion_personas").insert(payload);
      if (error) throw error;
      setShowRotForm(false);
      cargarRotantes();
    } catch (e:any) { alert("❌ " + e.message); }
    finally { setSavingRot(false); }
  };

  const eliminarRotante = async (id: string) => {
    if (!confirm("¿Eliminar esta rotación?")) return;
    await supabase.from("rotacion_personas").delete().eq("id", id);
    cargarRotantes();
  };

  const alumnosDisponiblesRot = todosAlumnos.filter(a => {
    const q = busqAlumnoRot.toLowerCase();
    if (!q) return true;
    return (a.apellidos + " " + a.nombres + " " + a.dni).toLowerCase().includes(q);
  });

  const F  = (k:string) => (e:any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const FR = (k:string) => (e:any) => setRotForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width:"100%", padding:".65rem .9rem", border:"1.5px solid #DEE2E6", borderRadius:8, fontSize:".9rem", outline:"none" as const };
  const lbl = { display:"block" as const, fontWeight:600 as const, fontSize:".82rem", marginBottom:4 };

  const sedeField = () => {
    if (instInfo && esUnica(instInfo.tipo))
      return <div style={{ ...inp, background:"#F0FAF5", color:"#155724", border:"1.5px solid #C3E6CB", display:"flex", alignItems:"center" }}>
        🏥 {instInfo.nombre} <span style={{ fontSize:".75rem", color:"#6C757D", marginLeft:"auto" }}>(auto)</span>
      </div>;
    if (sedes.length > 0)
      return <select style={inp} value={form.sedeId} onChange={F("sedeId")}>
        <option value="">Seleccionar sede...</option>
        {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>;
    return <input style={inp} placeholder="Nombre del hospital..." value={form.sedeId} onChange={F("sedeId")}/>;
  };

  const sedeFieldRot = () => {
    if (instInfo && esUnica(instInfo.tipo))
      return <div style={{ ...inp, background:"#F0FAF5", color:"#155724", border:"1.5px solid #C3E6CB", display:"flex", alignItems:"center" }}>
        🏥 {instInfo.nombre} <span style={{ fontSize:".75rem", color:"#6C757D", marginLeft:"auto" }}>(auto)</span>
      </div>;
    if (sedes.length > 0)
      return <select style={inp} value={rotForm.sedeId} onChange={FR("sedeId")}>
        <option value="">Seleccionar sede...</option>
        {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>;
    return <input style={inp} placeholder="Nombre del hospital..." value={rotForm.sedeId} onChange={FR("sedeId")}/>;
  };

  return (
    <div style={{ padding:"1.5rem" }}>
      <div style={{ background:"linear-gradient(135deg,#1A4F8A,#0D3060)", color:"white",
        padding:"1.25rem 1.75rem", borderRadius:12, marginBottom:"1.25rem",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h3 style={{ margin:0, fontSize:"1.3rem", fontWeight:700 }}>🏥 Residencias</h3>
          <p style={{ margin:".2rem 0 0", opacity:.85, fontSize:".85rem" }}>Periodo oct–sep · {residencias.length} registros</p>
        </div>
        {!isAdmin && (
          <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
            <button onClick={() => { setEditando(null); setForm({ ...EMPTY_RES }); setShowForm(true); }}
              style={{ background:"white", color:"#0D3060", border:"none", padding:".6rem 1.2rem", borderRadius:8, fontWeight:700, cursor:"pointer" }}>
              ➕ Nueva Residencia
            </button>
            <button onClick={abrirNuevaRotacion}
              style={{ background:"#1A6B3A", color:"white", border:"none", padding:".6rem 1.2rem", borderRadius:8, fontWeight:700, cursor:"pointer" }}>
              🔄 Nueva Rotación
            </button>
          </div>
        )}
      </div>

      {/* Acceso a rotaciones registradas */}
      <div style={{ marginBottom:"1.25rem" }}>
        <button onClick={() => setShowRotList(!showRotList)}
          style={{ background:"#E8F5EE", color:"#1A6B3A", border:"1px solid #B8E0C8",
            padding:".5rem 1rem", borderRadius:8, cursor:"pointer", fontSize:".85rem", fontWeight:600 }}>
          🔄 Rotaciones de Residentes ({rotantes.length}) {showRotList ? "▲" : "▼"}
        </button>
        {showRotList && (
          <div style={{ background:"white", borderRadius:12, marginTop:".75rem",
            boxShadow:"0 2px 8px rgba(0,0,0,.08)", overflow:"hidden" }}>
            {loadingRot ? (
              <div style={{ textAlign:"center", padding:"2rem" }}><div className="spinner-border" style={{ color:"#1A6B3A" }} role="status"/></div>
            ) : rotantes.length === 0 ? (
              <p style={{ color:"#6C757D", textAlign:"center", padding:"1.5rem", margin:0 }}>No hay rotaciones registradas</p>
            ) : (
              <div style={{ overflowX:"auto" }}>
                <table className="table table-hover mb-0">
                  <thead style={{ background:"#E8F5EE" }}>
                    <tr>
                      <th>Alumno</th><th>Especialidad</th><th>Institución Origen</th>
                      <th>Área / Subtipo</th><th>Sede</th><th>Fechas</th>
                      {!isAdmin && <th style={{ width:60 }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rotantes.map(r => (
                      <tr key={r.id}>
                        <td>
                          <strong style={{ fontSize:".88rem" }}>{r.alumnos?.apellidos}, {r.alumnos?.nombres}</strong>
                          {r.alumnos?.dni && <div><code style={{ fontSize:".78rem" }}>{r.alumnos.dni}</code></div>}
                        </td>
                        <td style={{ fontSize:".85rem" }}>
                          {r.especialidad || "-"}
                          {r.anio_residencia ? <span style={{ fontSize:".75rem", color:"#6C757D" }}> · Año {r.anio_residencia}</span> : ""}
                        </td>
                        <td style={{ fontSize:".82rem" }}>{r.institucion_origen || "-"}</td>
                        <td style={{ fontSize:".8rem" }}>
                          {r.area_nombre && <div style={{ color:"#1A4F8A" }}>{r.area_nombre}</div>}
                          {r.subtipo_nombre && <div style={{ color:"#6C757D", fontSize:".75rem" }}>{r.subtipo_nombre}</div>}
                        </td>
                        <td style={{ fontSize:".82rem" }}>{r.sede_nombre || "-"}</td>
                        <td style={{ fontSize:".78rem", color:"#6C757D" }}>{r.fecha_inicio}<br/>{r.fecha_fin}</td>
                        {!isAdmin && (
                          <td><button onClick={() => eliminarRotante(r.id)} className="btn btn-sm btn-outline-danger">🗑️</button></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"3rem" }}><div className="spinner-border text-primary" role="status"/></div>
      ) : residencias.length === 0 ? (
        <div style={{ background:"white", borderRadius:12, padding:"3rem", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize:"2.5rem" }}>🏥</div>
          <p style={{ color:"#6C757D", marginTop:".75rem" }}>No hay residencias registradas</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {residencias.map(r => (
            <div key={r.id} style={{ background:"white", borderRadius:12, padding:"1.1rem 1.25rem",
              boxShadow:"0 2px 8px rgba(0,0,0,.08)", border:"1px solid #E9ECEF" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:".5rem" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap", marginBottom:".35rem" }}>
                    <strong style={{ fontSize:".95rem" }}>{r.nombre}</strong>
                    {r.subtipo_nombre && (
                      <span style={{ background:"#CCE5FF", color:"#004085", padding:".15rem .6rem", borderRadius:10, fontSize:".78rem", fontWeight:600 }}>
                        {r.subtipo_nombre}
                      </span>
                    )}
                    {r.periodo && (
                      <span style={{ background:"#E2D9F3", color:"#4A1E7A", padding:".15rem .6rem", borderRadius:10, fontSize:".78rem", fontWeight:600 }}>
                        {r.periodo}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:".82rem", color:"#6C757D", display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                    {r.sede_nombre && <span>🏥 {r.sede_nombre}</span>}
                    <span>📅 {r.fecha_inicio} → {r.fecha_fin}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:".4rem", flexWrap:"wrap" }}>
                  <button onClick={() => abrirResidentes(r)}
                    style={{ background:"#CCE5FF", color:"#004085", border:"1px solid #B8D4F0",
                      padding:".35rem .8rem", borderRadius:7, cursor:"pointer", fontSize:".82rem", fontWeight:600 }}>
                    👨‍⚕️ Residentes ({r.num_residentes})
                  </button>
                  {!isAdmin && (
                    <>
                      <button onClick={() => { setEditando(r); setForm({ nombre:r.nombre, subtipoId:"", sedeId:"", fechaInicio:r.fecha_inicio, fechaFin:r.fecha_fin, areaId:"" }); setShowForm(true); }}
                        className="btn btn-sm btn-outline-secondary">✏️</button>
                      <button onClick={() => eliminarResidencia(r.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar residencia */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1050,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:560,
            maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              position:"sticky", top:0, background:"white", zIndex:1 }}>
              <h5 style={{ margin:0, fontWeight:700, color:"#0D3060" }}>
                {editando ? "✏️ Editar Residencia" : "🏥 Nueva Residencia"}
              </h5>
              <button onClick={() => setShowForm(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.5rem 1.75rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
              <div>
                <label style={lbl}>Nombre de la Residencia <span style={{ color:"#DC3545" }}>*</span></label>
                <input style={inp} value={form.nombre} onChange={F("nombre")}
                  placeholder="Ej: Residentado Médico Medicina Interna 2025-2026"/>
              </div>
              <div>
                <label style={lbl}>Subtipo Docente</label>
                <select style={inp} value={form.subtipoId} onChange={F("subtipoId")}>
                  <option value="">Seleccionar subtipo...</option>
                  {subtipos.map(s => <option key={s.id} value={s.id}>{s.subtipo_nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Área Vinculada (Especialidad/Programa)</label>
                {areas.length > 0 ? (
                  <select style={inp} value={form.areaId} onChange={F("areaId")}>
                    <option value="">Seleccionar área...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                ) : (
                  <div style={{ ...inp, background:"#FFF3CD", color:"#856404", fontSize:".85rem" }}>
                    ⚠️ No hay áreas de postgrado vinculadas a este convenio
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
                <div style={{ background:"#EBF2FB", padding:".65rem 1rem", borderRadius:8, fontSize:".82rem", color:"#1A4F8A" }}>
                  ℹ️ Periodo: <strong>{getPeriodo(form.fechaInicio)}</strong>
                </div>
              )}
              <div style={{ display:"flex", gap:".75rem", justifyContent:"flex-end" }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" disabled={saving}>Cancelar</button>
                <button onClick={guardarResidencia} disabled={saving}
                  style={{ background:"#1A4F8A", color:"white", border:"none", padding:".65rem 1.5rem", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                  {saving ? "Guardando..." : "💾 Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal residentes de la residencia — selección desde el padrón */}
      {showResidentes && residSel && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:1060,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:700,
            maxHeight:"92vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.35)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              position:"sticky", top:0, background:"white", zIndex:1 }}>
              <div>
                <h5 style={{ margin:0, fontWeight:700, color:"#1A4F8A" }}>👨‍⚕️ Residentes — {residSel.nombre}</h5>
                <p style={{ margin:".2rem 0 0", fontSize:".82rem", color:"#6C757D" }}>
                  {residSel.periodo} · {residentes.length} residente(s)
                </p>
              </div>
              <button onClick={() => setShowResidentes(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.25rem 1.75rem" }}>
              {/* Lista de residentes */}
              {residentes.length > 0 && (
                <div style={{ marginBottom:"1.5rem" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:".4rem", maxHeight:220, overflowY:"auto" }}>
                    {residentes.map(r => (
                      <div key={r.id} style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", padding:".6rem .9rem",
                        background:"#EBF2FB", borderRadius:8, border:"1px solid #B8D0F0" }}>
                        <div>
                          <strong style={{ fontSize:".88rem" }}>{r.alumnos?.apellidos}, {r.alumnos?.nombres}</strong>
                          <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>
                            {r.especialidad || ""} {r.anio_residencia ? `· Año ${r.anio_residencia}` : ""}
                          </span>
                          {r.alumnos?.dni && <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>DNI: {r.alumnos.dni}</span>}
                        </div>
                        {!isAdmin && (
                          <button onClick={() => eliminarResidente(r.id)} className="btn btn-sm btn-outline-danger" style={{ padding:".2rem .6rem" }}>🗑️</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agregar residente desde el padrón */}
              {!isAdmin && (
                <>
                  <button onClick={() => setShowAddRes(!showAddRes)}
                    style={{ background:"#1A4F8A", color:"white", border:"none",
                      padding:".6rem 1.2rem", borderRadius:8, fontWeight:600, cursor:"pointer",
                      marginBottom:showAddRes ? "1rem" : 0 }}>
                    {showAddRes ? "✕ Cancelar" : "➕ Agregar Residente del padrón"}
                  </button>
                  {showAddRes && (
                    <div style={{ border:"1.5px solid #B8D0F0", borderRadius:12, padding:"1.25rem" }}>
                      {!alumnoSelId ? (
                        <>
                          <h6 style={{ fontWeight:700, color:"#1A4F8A", marginBottom:".75rem" }}>🔍 Buscar alumno en el padrón</h6>
                          <input type="text" value={busqAlumno} onChange={e => setBusqAlumno(e.target.value)}
                            placeholder="Buscar por nombre o DNI..."
                            style={{ ...inp, marginBottom:".75rem" }}/>
                          <div style={{ maxHeight:260, overflowY:"auto", display:"flex", flexDirection:"column", gap:".35rem" }}>
                            {alumnosDisponiblesRes.slice(0, 50).map(a => (
                              <div key={a.id} style={{ display:"flex", justifyContent:"space-between",
                                alignItems:"center", padding:".5rem .9rem",
                                background:"#F8F9FA", borderRadius:8, border:"1px solid #E9ECEF" }}>
                                <div>
                                  <span style={{ fontSize:".9rem" }}><strong>{a.apellidos}</strong>, {a.nombres}</span>
                                  <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>{a.dni || a.codigo_universitario || ""}</span>
                                </div>
                                <button onClick={() => setAlumnoSelId(a.id)}
                                  style={{ background:"#1A4F8A", color:"white", border:"none",
                                    padding:".3rem .75rem", borderRadius:6, cursor:"pointer", fontSize:".82rem" }}>
                                  Seleccionar
                                </button>
                              </div>
                            ))}
                            {alumnosDisponiblesRes.length === 0 && (
                              <p style={{ color:"#6C757D", fontSize:".85rem", textAlign:"center", padding:"1rem" }}>
                                {busqAlumno ? "Sin resultados" : "Todos los alumnos ya están asignados"}
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                            <h6 style={{ fontWeight:700, color:"#1A4F8A", margin:0 }}>
                              ✅ {todosAlumnos.find(a => a.id === alumnoSelId)?.apellidos}, {todosAlumnos.find(a => a.id === alumnoSelId)?.nombres}
                            </h6>
                            <button onClick={() => setAlumnoSelId("")} className="btn btn-sm btn-outline-secondary">Cambiar</button>
                          </div>
                          <div className="row g-2">
                            <div className="col-8">
                              <label style={lbl}>Especialidad</label>
                              <input style={inp} value={especialidadNueva} onChange={e => setEspecialidadNueva(e.target.value)} placeholder="Medicina Interna"/>
                            </div>
                            <div className="col-4">
                              <label style={lbl}>Año de Residencia</label>
                              <select style={inp} value={anioResNuevo} onChange={e => setAnioResNuevo(e.target.value)}>
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}°</option>)}
                              </select>
                            </div>
                          </div>
                          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"1rem" }}>
                            <button onClick={guardarResidente} disabled={savingPer}
                              style={{ background:"#1A4F8A", color:"white", border:"none",
                                padding:".65rem 1.5rem", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                              {savingPer ? "Guardando..." : "💾 Guardar Residente"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Rotación de Residente (individual, desde el padrón) */}
      {showRotForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1050,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:640,
            maxHeight:"93vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              position:"sticky", top:0, background:"white", zIndex:1 }}>
              <h5 style={{ margin:0, fontWeight:700, color:"#0D4A28" }}>🔄 Nueva Rotación de Residente</h5>
              <button onClick={() => setShowRotForm(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.5rem 1.75rem", display:"flex", flexDirection:"column", gap:".9rem" }}>
              {!rotForm.alumnoId ? (
                <>
                  <h6 style={{ fontWeight:700, color:"#0D4A28", marginBottom:".25rem" }}>🔍 Buscar alumno en el padrón</h6>
                  <input type="text" value={busqAlumnoRot} onChange={e => setBusqAlumnoRot(e.target.value)}
                    placeholder="Buscar por nombre o DNI..." style={inp}/>
                  <div style={{ maxHeight:280, overflowY:"auto", display:"flex", flexDirection:"column", gap:".35rem" }}>
                    {alumnosDisponiblesRot.slice(0, 50).map(a => (
                      <div key={a.id} style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", padding:".5rem .9rem",
                        background:"#F8F9FA", borderRadius:8, border:"1px solid #E9ECEF" }}>
                        <div>
                          <span style={{ fontSize:".9rem" }}><strong>{a.apellidos}</strong>, {a.nombres}</span>
                          <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>{a.dni || a.codigo_universitario || ""}</span>
                        </div>
                        <button onClick={() => seleccionarAlumnoRotacion(a)}
                          style={{ background:"#1A6B3A", color:"white", border:"none",
                            padding:".3rem .75rem", borderRadius:6, cursor:"pointer", fontSize:".82rem" }}>
                          Seleccionar
                        </button>
                      </div>
                    ))}
                    {alumnosDisponiblesRot.length === 0 && busqAlumnoRot && (
                      <p style={{ color:"#6C757D", fontSize:".85rem", textAlign:"center", padding:"1rem" }}>Sin resultados</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <h6 style={{ fontWeight:700, color:"#0D4A28", margin:0 }}>
                      ✅ {todosAlumnos.find(a => a.id === rotForm.alumnoId)?.apellidos}, {todosAlumnos.find(a => a.id === rotForm.alumnoId)?.nombres}
                    </h6>
                    <button onClick={() => { setRotForm(f => ({ ...f, alumnoId:"" })); setOrigenInfo(""); }} className="btn btn-sm btn-outline-secondary">Cambiar</button>
                  </div>
                  {origenInfo && (
                    <div style={{ background:"#FEF3C7", padding:".6rem .9rem", borderRadius:8, fontSize:".82rem", color:"#7B5A1A" }}>
                      {origenInfo}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-8">
                      <label style={lbl}>Especialidad</label>
                      <input style={inp} value={rotForm.especialidad} onChange={FR("especialidad")} placeholder="Oncología Médica"/>
                    </div>
                    <div className="col-4">
                      <label style={lbl}>Año Resid.</label>
                      <select style={inp} value={rotForm.anioResidencia} onChange={FR("anioResidencia")}>
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}°</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={lbl}>Institución de Origen</label>
                    <input style={inp} value={rotForm.institucionOrigen} onChange={FR("institucionOrigen")}
                      placeholder="Se completa solo al elegir el alumno, editable si hace falta"/>
                  </div>

                  <div>
                    <label style={lbl}>Subtipo Docente (convenio destino)</label>
                    <select style={inp} value={rotForm.subtipoId} onChange={FR("subtipoId")}>
                      <option value="">Seleccionar subtipo...</option>
                      {subtipos.map(s => <option key={s.id} value={s.id}>{s.subtipo_nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={lbl}>Área Vinculada (convenio destino)</label>
                    {areas.length > 0 ? (
                      <select style={inp} value={rotForm.areaId} onChange={FR("areaId")}>
                        <option value="">Seleccionar área...</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                    ) : (
                      <div style={{ ...inp, background:"#FFF3CD", color:"#856404", fontSize:".85rem" }}>
                        ⚠️ No hay áreas de postgrado vinculadas a este convenio
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
                      ℹ️ Periodo: <strong>{getPeriodo(rotForm.fechaInicio)}</strong>
                    </div>
                  )}

                  <div style={{ display:"flex", gap:".75rem", justifyContent:"flex-end" }}>
                    <button onClick={() => setShowRotForm(false)} className="btn btn-secondary" disabled={savingRot}>Cancelar</button>
                    <button onClick={guardarRotacion} disabled={savingRot}
                      style={{ background:"#1A6B3A", color:"white", border:"none",
                        padding:".65rem 1.5rem", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                      {savingRot ? "Guardando..." : "💾 Guardar Rotación"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}