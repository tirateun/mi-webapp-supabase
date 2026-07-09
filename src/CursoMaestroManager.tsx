// src/CursoMaestroManager.tsx
// Cursos a nivel Escuela: un curso puede tener varios grupos, y cada grupo
// rota por distintos convenios/sedes (tramos) con su propio cupo de campos clínicos.
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const getSemestre = (fecha: string) => {
  if (!fecha) return "";
  const [y, m] = fecha.split("-").map(Number);
  return `${y}-${m <= 6 ? "I" : "II"}`;
};
const HORAS_OPT = ["2","4","6","8","10","12","14","16","20","24","32","Otro"];

interface Escuela { id: string; nombre: string; }
interface Curso {
  id: string; nombre_curso: string; area_vinculada_id: string;
  horas_semana: number; fecha_inicio: string; fecha_fin: string;
  nombre_tutor: string; semestre: string; anio: number;
  num_grupos?: number;
}
interface Grupo { id: string; curso_id: string; nombre_grupo: string; num_alumnos?: number; }
interface Alumno { id: string; dni: string; apellidos: string; nombres: string; codigo_universitario: string; }
interface Rotacion {
  id: string; grupo_id: string; convenio_id: string; sede_id: string; sede_hospital: string;
  orden: number; fecha_inicio: string; fecha_fin: string; campos_clinicos_asignados: number | null;
  convenio_nombre?: string; sede_nombre?: string;
}
interface Convenio { id: string; name: string; }
interface Sede { id: string; nombre: string; }

const EMPTY_CURSO = { nombre_curso: "", horas_semana_sel: "4", horas_semana_manual: "", fecha_inicio: "", fecha_fin: "", nombre_tutor: "" };
const EMPTY_ROT = { convenioId: "", sedeId: "", sedeManual: "", fechaInicio: "", fechaFin: "", camposClinicos: "" };

export default function CursoMaestroManager({ isAdmin = false }: { isAdmin?: boolean }) {
  const [escuelas, setEscuelas]     = useState<Escuela[]>([]);
  const [escuelaId, setEscuelaId]   = useState("");
  const [cursos, setCursos]         = useState<Curso[]>([]);
  const [loading, setLoading]       = useState(false);

  const [showForm, setShowForm]     = useState(false);
  const [editando, setEditando]     = useState<Curso | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_CURSO });
  const [saving, setSaving]         = useState(false);

  const [cursoExp, setCursoExp]     = useState<string | null>(null);
  const [grupos, setGrupos]         = useState<Record<string, Grupo[]>>({});
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState<Record<string, string>>({});

  const [grupoExp, setGrupoExp]     = useState<string | null>(null);
  const [alumnosGrupo, setAlumnosGrupo] = useState<Alumno[]>([]);
  const [rotacionesGrupo, setRotacionesGrupo] = useState<Rotacion[]>([]);
  const [todosAlumnos, setTodosAlumnos] = useState<Alumno[]>([]);
  const [busqAlumno, setBusqAlumno] = useState("");

  const [todosConvenios, setTodosConvenios] = useState<Convenio[]>([]);
  const [sedesConvenio, setSedesConvenio]   = useState<Sede[]>([]);
  const [instConvenio, setInstConvenio]     = useState<{ nombre: string; tipo: string } | null>(null);
  const [showRotForm, setShowRotForm] = useState(false);
  const [rotForm, setRotForm]         = useState({ ...EMPTY_ROT });
  const [busqConvenioRot, setBusqConvenioRot] = useState("");
  const [savingRot, setSavingRot]     = useState(false);

  useEffect(() => { cargarEscuelas(); cargarConvenios(); }, []);
  useEffect(() => { if (escuelaId) cargarCursos(); else setCursos([]); }, [escuelaId]);

  const cargarEscuelas = async () => {
    const { data } = await supabase.from("areas_vinculadas").select("id, nombre").order("nombre");
    setEscuelas((data || []).filter((a: any) => a.nombre?.toLowerCase().includes("escuela")));
  };

  const cargarConvenios = async () => {
    const { data } = await supabase
      .from("agreements")
      .select("id, name, agreement_subtypes(subtipo_nombre)")
      .contains("tipo_convenio", ["Docente Asistencial"])
      .order("name");
    setTodosConvenios((data || [])
      .filter((c: any) => (c.agreement_subtypes || []).some((s: any) => s.subtipo_nombre?.toUpperCase().includes("PREGRADO")))
      .map((c: any) => ({ id: c.id, name: c.name })));
  };

  const cargarCursos = async () => {
    setLoading(true);
    const { data } = await supabase.from("cursos")
      .select("*, num_grupos:curso_grupos(count)")
      .eq("area_vinculada_id", escuelaId)
      .order("fecha_inicio", { ascending: false });
    setCursos((data || []).map((c: any) => ({ ...c, num_grupos: c.num_grupos?.[0]?.count ?? 0 })));
    setLoading(false);
  };

  const cargarTodosAlumnos = async () => {
    if (todosAlumnos.length > 0) return;
    const { data } = await supabase.from("alumnos").select("*").order("apellidos");
    setTodosAlumnos(data || []);
  };

  // ── Curso ──
  const guardarCurso = async () => {
    if (!form.nombre_curso.trim() || !form.fecha_inicio || !form.fecha_fin) {
      alert("❌ Nombre del curso y fechas son obligatorios"); return;
    }
    const horas = form.horas_semana_sel === "Otro" ? parseFloat(form.horas_semana_manual) || null : parseFloat(form.horas_semana_sel) || null;
    const payload = {
      area_vinculada_id: escuelaId, nombre_curso: form.nombre_curso.trim(),
      horas_semana: horas, fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin,
      nombre_tutor: form.nombre_tutor.trim() || null,
      semestre: getSemestre(form.fecha_inicio), anio: parseInt(form.fecha_inicio.split("-")[0]) || null,
    };
    setSaving(true);
    try {
      const { error } = editando
        ? await supabase.from("cursos").update(payload).eq("id", editando.id)
        : await supabase.from("cursos").insert(payload);
      if (error) throw error;
      setShowForm(false); cargarCursos();
    } catch (e: any) { alert("❌ " + e.message); }
    finally { setSaving(false); }
  };

  const eliminarCurso = async (id: string) => {
    if (!confirm("¿Eliminar este curso, sus grupos, alumnos y tramos de rotación?")) return;
    await supabase.from("cursos").delete().eq("id", id); cargarCursos();
  };

  // ── Grupos ──
  const toggleCurso = async (curso: Curso) => {
    if (cursoExp === curso.id) { setCursoExp(null); return; }
    setCursoExp(curso.id);
    if (!grupos[curso.id]) {
      const { data } = await supabase.from("curso_grupos")
        .select("*, num_alumnos:curso_grupo_alumnos(count)")
        .eq("curso_id", curso.id).order("nombre_grupo");
      setGrupos(prev => ({ ...prev, [curso.id]: (data || []).map((g: any) => ({ ...g, num_alumnos: g.num_alumnos?.[0]?.count ?? 0 })) }));
    }
  };

  const agregarGrupo = async (cursoId: string) => {
    const nombre = (nuevoGrupoNombre[cursoId] || "").trim();
    if (!nombre) { alert("❌ Ponle un nombre al grupo (ej: Grupo 1)"); return; }
    await supabase.from("curso_grupos").insert({ curso_id: cursoId, nombre_grupo: nombre });
    setNuevoGrupoNombre(prev => ({ ...prev, [cursoId]: "" }));
    const { data } = await supabase.from("curso_grupos")
      .select("*, num_alumnos:curso_grupo_alumnos(count)")
      .eq("curso_id", cursoId).order("nombre_grupo");
    setGrupos(prev => ({ ...prev, [cursoId]: (data || []).map((g: any) => ({ ...g, num_alumnos: g.num_alumnos?.[0]?.count ?? 0 })) }));
    cargarCursos();
  };

  const eliminarGrupo = async (cursoId: string, grupoId: string) => {
    if (!confirm("¿Eliminar este grupo, sus alumnos y tramos de rotación?")) return;
    await supabase.from("curso_grupos").delete().eq("id", grupoId);
    setGrupos(prev => ({ ...prev, [cursoId]: (prev[cursoId] || []).filter(g => g.id !== grupoId) }));
    if (grupoExp === grupoId) setGrupoExp(null);
    cargarCursos();
  };

  // ── Alumnos + rotaciones del grupo ──
  const abrirGrupo = async (grupo: Grupo) => {
    if (grupoExp === grupo.id) { setGrupoExp(null); return; }
    setGrupoExp(grupo.id); setBusqAlumno("");
    cargarTodosAlumnos();
    const [{ data: asig }, { data: rot }] = await Promise.all([
      supabase.from("curso_grupo_alumnos").select("alumno_id, alumnos(*)").eq("grupo_id", grupo.id),
      supabase.from("v_curso_rotaciones_uso").select("*").eq("grupo_id", grupo.id).order("orden"),
    ]);
    setAlumnosGrupo((asig || []).map((a: any) => a.alumnos).filter(Boolean));
    setRotacionesGrupo(rot || []);
  };

  const minCamposDelGrupo = (grupoId: string) => {
    const conCupo = rotacionesGrupo.filter(r => r.grupo_id === grupoId && r.campos_clinicos_asignados != null);
    if (conCupo.length === 0) return null;
    return Math.min(...conCupo.map(r => r.campos_clinicos_asignados as number));
  };

  const asignarAlumno = async (grupo: Grupo, a: Alumno) => {
    const min = minCamposDelGrupo(grupo.id);
    if (min != null && alumnosGrupo.length + 1 > min) {
      alert(`❌ Este grupo ya llegaría a ${alumnosGrupo.length + 1} alumnos, pero el tramo con menos cupo tiene solo ${min} campos clínicos asignados. Amplía el cupo antes de agregar más alumnos.`);
      return;
    }
    await supabase.from("curso_grupo_alumnos").insert({ grupo_id: grupo.id, alumno_id: a.id });
    setAlumnosGrupo(prev => [...prev, a]);
    setGrupos(prev => ({ ...prev, [grupo.curso_id]: (prev[grupo.curso_id] || []).map(g => g.id === grupo.id ? { ...g, num_alumnos: (g.num_alumnos || 0) + 1 } : g) }));
  };

  const quitarAlumno = async (grupo: Grupo, alumnoId: string) => {
    await supabase.from("curso_grupo_alumnos").delete().eq("grupo_id", grupo.id).eq("alumno_id", alumnoId);
    setAlumnosGrupo(prev => prev.filter(a => a.id !== alumnoId));
    setGrupos(prev => ({ ...prev, [grupo.curso_id]: (prev[grupo.curso_id] || []).map(g => g.id === grupo.id ? { ...g, num_alumnos: Math.max(0, (g.num_alumnos || 0) - 1) } : g) }));
  };

  const alumnosDisponibles = todosAlumnos.filter(a => {
    if (alumnosGrupo.find(x => x.id === a.id)) return false;
    const q = busqAlumno.toLowerCase();
    if (!q) return true;
    return (a.apellidos + " " + a.nombres + " " + a.dni).toLowerCase().includes(q);
  });

  const conveniosFiltradosRot = todosConvenios.filter(c =>
    !busqConvenioRot || c.name.toLowerCase().includes(busqConvenioRot.toLowerCase())
  );

  // ── Tramos de rotación ──
  const abrirNuevaRotacion = async () => {
    setRotForm({ ...EMPTY_ROT }); setSedesConvenio([]); setInstConvenio(null); setBusqConvenioRot("");
    setShowRotForm(true);
  };

  const onConvenioRotChange = async (convenioId: string) => {
    setRotForm(f => ({ ...f, convenioId, sedeId: "", sedeManual: "" }));
    if (!convenioId) { setSedesConvenio([]); setInstConvenio(null); return; }
    const [{ data: inst, error: e1 }, { data: sedes, error: e2 }] = await Promise.all([
      supabase.from("agreements").select("instituciones(nombre, tipo)").eq("id", convenioId).single(),
      supabase.from("convenio_sedes").select("sedes_hospitalarias(id, nombre)").eq("convenio_id", convenioId),
    ]);
    if (e1) console.error("Error cargando institución del convenio:", e1);
    if (e2) console.error("Error cargando sedes del convenio:", e2);
    const i = (inst as any)?.instituciones;
    const institucion = i ? { nombre: i.nombre, tipo: i.tipo || "" } : null;
    setInstConvenio(institucion);
    const sedesList = (sedes || []).map((s: any) => s.sedes_hospitalarias).filter(Boolean);
    setSedesConvenio(sedesList);
    // Si el convenio NO tiene sedes configuradas (no es una red), autocompleta con el nombre de la institución
    if (sedesList.length === 0 && institucion) {
      setRotForm(f => ({ ...f, sedeManual: institucion.nombre }));
    }
  };

  const sedeFieldRot = () => {
    if (sedesConvenio.length > 0) {
      return <select style={inp} value={rotForm.sedeId} onChange={FR("sedeId")}>
        <option value="">Seleccionar sede...</option>
        {sedesConvenio.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>;
    }
    return (
      <div style={{ ...inp, background: "#F0FAF5", color: "#155724", border: "1.5px solid #C3E6CB", display: "flex", alignItems: "center", gap: ".5rem" }}>
        🏥 {rotForm.sedeManual || instConvenio?.nombre || "—"}
        <span style={{ fontSize: ".72rem", color: "#6C757D", marginLeft: "auto" }}>(auto)</span>
      </div>
    );
  };

  const guardarRotacion = async (grupo: Grupo) => {
    if (!rotForm.convenioId || !rotForm.fechaInicio || !rotForm.fechaFin) {
      alert("❌ Convenio y fechas son obligatorios"); return;
    }
    const campos = rotForm.camposClinicos ? parseInt(rotForm.camposClinicos) : null;
    if (campos != null && alumnosGrupo.length > campos) {
      alert(`❌ Este grupo ya tiene ${alumnosGrupo.length} alumnos asignados — no puedes darle solo ${campos} campos clínicos en este tramo.`);
      return;
    }
    const sedeIdValido = rotForm.sedeId && rotForm.sedeId !== "__auto__" ? rotForm.sedeId : null;
    const orden = rotacionesGrupo.filter(r => r.grupo_id === grupo.id).length + 1;
    setSavingRot(true);
    try {
      const { error } = await supabase.from("curso_rotaciones").insert({
        grupo_id: grupo.id, convenio_id: rotForm.convenioId, sede_id: sedeIdValido,
        sede_hospital: rotForm.sedeManual.trim() || null, orden,
        fecha_inicio: rotForm.fechaInicio, fecha_fin: rotForm.fechaFin,
        campos_clinicos_asignados: campos,
      });
      if (error) throw error;
      setShowRotForm(false);
      const { data: rot } = await supabase.from("v_curso_rotaciones_uso").select("*").eq("grupo_id", grupo.id).order("orden");
      setRotacionesGrupo(rot || []);
    } catch (e: any) { alert("❌ " + e.message); }
    finally { setSavingRot(false); }
  };

  const eliminarRotacion = async (grupo: Grupo, rotId: string) => {
    if (!confirm("¿Eliminar este tramo de rotación?")) return;
    await supabase.from("curso_rotaciones").delete().eq("id", rotId);
    setRotacionesGrupo(prev => prev.filter(r => r.id !== rotId));
  };

  const F  = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const FR = (k: string) => (e: any) => setRotForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width: "100%", padding: ".6rem .85rem", border: "1.5px solid #DEE2E6", borderRadius: 8, fontSize: ".88rem", outline: "none" as const };
  const lbl = { display: "block" as const, fontWeight: 600 as const, fontSize: ".8rem", marginBottom: 4 };

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ background: "linear-gradient(135deg,#0F6E56,#085041)", color: "white",
        padding: "1.25rem 1.75rem", borderRadius: 12, marginBottom: "1.25rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>🏫 Cursos (multisede)</h3>
        <p style={{ margin: ".2rem 0 0", opacity: .85, fontSize: ".85rem" }}>
          El curso vive en la Escuela — cada grupo rota por los convenios/sedes que definas
        </p>
      </div>

      {/* Selector de Escuela */}
      <div style={{ background: "white", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
        <label style={lbl}>Escuela Profesional</label>
        <select style={inp} value={escuelaId} onChange={e => setEscuelaId(e.target.value)}>
          <option value="">Seleccionar escuela...</option>
          {escuelas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {!escuelaId ? (
        <div style={{ background: "white", borderRadius: 12, padding: "3rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <p style={{ color: "#6C757D", margin: 0 }}>Selecciona una escuela para ver o crear sus cursos</p>
        </div>
      ) : (
        <>
          {!isAdmin && (
            <button onClick={() => { setEditando(null); setForm({ ...EMPTY_CURSO }); setShowForm(true); }}
              style={{ background: "#0F6E56", color: "white", border: "none", padding: ".6rem 1.2rem",
                borderRadius: 8, fontWeight: 700, cursor: "pointer", marginBottom: "1rem" }}>
              ➕ Nuevo Curso
            </button>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner-border" style={{ color: "#0F6E56" }} role="status"/></div>
          ) : cursos.length === 0 ? (
            <div style={{ background: "white", borderRadius: 12, padding: "3rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
              <p style={{ color: "#6C757D", margin: 0 }}>No hay cursos registrados para esta escuela</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {cursos.map(c => (
                <div key={c.id} style={{ background: "white", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,.08)", border: "1px solid #E9ECEF", overflow: "hidden" }}>
                  <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap", marginBottom: ".3rem" }}>
                        <strong style={{ fontSize: "1rem" }}>{c.nombre_curso}</strong>
                        <span style={{ background: "#E1F5EE", color: "#0F6E56", padding: ".15rem .6rem", borderRadius: 10, fontSize: ".78rem", fontWeight: 600 }}>{c.semestre}</span>
                      </div>
                      <div style={{ fontSize: ".82rem", color: "#6C757D", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {c.nombre_tutor && <span>👨‍🏫 {c.nombre_tutor}</span>}
                        {c.horas_semana && <span>⏱️ {c.horas_semana}h/sem</span>}
                        <span>📅 {c.fecha_inicio} → {c.fecha_fin}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                      <button onClick={() => toggleCurso(c)}
                        style={{ background: "#E1F5EE", color: "#0F6E56", border: "1px solid #0F6E56",
                          padding: ".4rem .9rem", borderRadius: 8, cursor: "pointer", fontSize: ".82rem", fontWeight: 600 }}>
                        👥 Grupos ({c.num_grupos}) {cursoExp === c.id ? "▲" : "▼"}
                      </button>
                      {!isAdmin && (
                        <>
                          <button onClick={() => { setEditando(c); setForm({ nombre_curso: c.nombre_curso, horas_semana_sel: HORAS_OPT.includes(String(c.horas_semana)) ? String(c.horas_semana) : "Otro", horas_semana_manual: String(c.horas_semana || ""), fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin, nombre_tutor: c.nombre_tutor || "" }); setShowForm(true); }}
                            className="btn btn-sm btn-outline-secondary">✏️</button>
                          <button onClick={() => eliminarCurso(c.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                        </>
                      )}
                    </div>
                  </div>

                  {cursoExp === c.id && (
                    <div style={{ borderTop: "1px solid #E9ECEF", padding: "1rem 1.25rem", background: "#FAFBFC" }}>
                      {!isAdmin && (
                        <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
                          <input style={inp} placeholder="Nombre del grupo (ej: Grupo 1)"
                            value={nuevoGrupoNombre[c.id] || ""} onChange={e => setNuevoGrupoNombre(prev => ({ ...prev, [c.id]: e.target.value }))}/>
                          <button onClick={() => agregarGrupo(c.id)}
                            style={{ background: "#0F6E56", color: "white", border: "none", padding: ".5rem 1rem", borderRadius: 8, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                            ➕ Agregar
                          </button>
                        </div>
                      )}

                      {(grupos[c.id] || []).length === 0 ? (
                        <p style={{ color: "#6C757D", fontSize: ".85rem", margin: 0 }}>Sin grupos todavía</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                          {(grupos[c.id] || []).map(g => (
                            <div key={g.id} style={{ background: "white", borderRadius: 10, border: "1px solid #E9ECEF", overflow: "hidden" }}>
                              <div style={{ padding: ".75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".5rem" }}>
                                <strong style={{ fontSize: ".9rem" }}>👥 {g.nombre_grupo} — {g.num_alumnos} alumno(s)</strong>
                                <div style={{ display: "flex", gap: ".4rem" }}>
                                  <button onClick={() => abrirGrupo(g)}
                                    style={{ background: "#FEF3C7", color: "#7B5A1A", border: "1px solid #F0C040",
                                      padding: ".3rem .75rem", borderRadius: 7, cursor: "pointer", fontSize: ".8rem", fontWeight: 600 }}>
                                    {grupoExp === g.id ? "▲ Cerrar" : "▼ Gestionar"}
                                  </button>
                                  {!isAdmin && (
                                    <button onClick={() => eliminarGrupo(c.id, g.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                                  )}
                                </div>
                              </div>

                              {grupoExp === g.id && (
                                <div style={{ borderTop: "1px solid #E9ECEF", padding: "1rem" }}>
                                  {/* Tramos de rotación */}
                                  <div style={{ marginBottom: "1.25rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".6rem" }}>
                                      <h6 style={{ fontWeight: 700, color: "#0F6E56", margin: 0 }}>🔄 Tramos de rotación</h6>
                                      {!isAdmin && (
                                        <button onClick={abrirNuevaRotacion}
                                          style={{ background: "#0F6E56", color: "white", border: "none", padding: ".3rem .8rem", borderRadius: 7, cursor: "pointer", fontSize: ".8rem", fontWeight: 600 }}>
                                          ➕ Agregar tramo
                                        </button>
                                      )}
                                    </div>
                                    {rotacionesGrupo.length === 0 ? (
                                      <p style={{ color: "#6C757D", fontSize: ".82rem" }}>Sin tramos definidos — este grupo no está asignado a ninguna sede todavía</p>
                                    ) : (
                                      <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
                                        {rotacionesGrupo.map((r: any) => {
                                          const uso = r.porcentaje_uso;
                                          const colorUso = uso == null ? "#6C757D" : uso > 100 ? "#DC3545" : uso >= 90 ? "#1A6B3A" : uso >= 50 ? "#856404" : "#DC3545";
                                          return (
                                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                              padding: ".6rem .9rem", background: "#F0FAF5", borderRadius: 8, border: "1px solid #C3E6CB", flexWrap: "wrap", gap: ".4rem" }}>
                                              <div>
                                                <strong style={{ fontSize: ".85rem" }}>{r.convenio_nombre}</strong>
                                                {r.sede_nombre && <span style={{ fontSize: ".78rem", color: "#6C757D" }}> · {r.sede_nombre}</span>}
                                                <div style={{ fontSize: ".78rem", color: "#6C757D" }}>📅 {r.fecha_inicio} → {r.fecha_fin}</div>
                                              </div>
                                              <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: ".8rem", fontWeight: 700, color: colorUso }}>
                                                  {r.alumnos_asignados} / {r.campos_clinicos_asignados ?? "?"} campos {uso != null && `(${uso}%)`}
                                                </div>
                                                {!isAdmin && (
                                                  <button onClick={() => eliminarRotacion(g, r.id)} className="btn btn-sm btn-outline-danger" style={{ padding: ".1rem .5rem", fontSize: ".72rem" }}>🗑️</button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Alumnos del grupo */}
                                  <div>
                                    <h6 style={{ fontWeight: 700, color: "#7B5A1A", marginBottom: ".6rem" }}>👩‍🎓 Alumnos ({alumnosGrupo.length})</h6>
                                    {alumnosGrupo.length > 0 && (
                                      <div style={{ display: "flex", flexDirection: "column", gap: ".3rem", marginBottom: "1rem", maxHeight: 180, overflowY: "auto" }}>
                                        {alumnosGrupo.map(a => (
                                          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: ".4rem .8rem", background: "#FEF9E7", borderRadius: 8, border: "1px solid #F0C040" }}>
                                            <span style={{ fontSize: ".85rem" }}><strong>{a.apellidos}</strong>, {a.nombres} <span style={{ color: "#6C757D", fontSize: ".78rem" }}>{a.dni}</span></span>
                                            {!isAdmin && <button onClick={() => quitarAlumno(g, a.id)} className="btn btn-sm btn-outline-danger" style={{ padding: ".1rem .5rem" }}>✕</button>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {!isAdmin && (
                                      <>
                                        <input style={{ ...inp, marginBottom: ".5rem" }} placeholder="🔍 Buscar alumno del padrón..."
                                          value={busqAlumno} onChange={e => setBusqAlumno(e.target.value)}/>
                                        <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: ".3rem" }}>
                                          {alumnosDisponibles.slice(0, 30).map(a => (
                                            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                              padding: ".4rem .8rem", background: "#F8F9FA", borderRadius: 8, border: "1px solid #E9ECEF" }}>
                                              <span style={{ fontSize: ".85rem" }}><strong>{a.apellidos}</strong>, {a.nombres}</span>
                                              <button onClick={() => asignarAlumno(g, a)}
                                                style={{ background: "#7B5A1A", color: "white", border: "none", padding: ".25rem .65rem", borderRadius: 6, cursor: "pointer", fontSize: ".78rem" }}>
                                                + Agregar
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Modal tramo nuevo (aplica al grupo actualmente abierto) */}
                                  {showRotForm && (
                                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1070,
                                      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                                      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
                                        <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid #E9ECEF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                          <h5 style={{ margin: 0, fontWeight: 700, color: "#0F6E56" }}>🔄 Nuevo tramo — {g.nombre_grupo}</h5>
                                          <button onClick={() => setShowRotForm(false)} style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }}>×</button>
                                        </div>
                                        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: ".85rem" }}>
                                          <div>
                                            <label style={lbl}>Convenio (sede destino)</label>
                                            {rotForm.convenioId ? (
                                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                                                background: "#F0FAF5", border: "1.5px solid #C3E6CB", borderRadius: 8, padding: ".6rem .9rem" }}>
                                                <span style={{ fontSize: ".85rem", fontWeight: 600, color: "#155724" }}>
                                                  ✅ {todosConvenios.find(cv => cv.id === rotForm.convenioId)?.name}
                                                </span>
                                                <button onClick={() => onConvenioRotChange("")} className="btn btn-sm btn-outline-secondary">Cambiar</button>
                                              </div>
                                            ) : (
                                              <>
                                                <input type="text" style={inp} placeholder="🔍 Buscar convenio por nombre..."
                                                  value={busqConvenioRot} onChange={e => setBusqConvenioRot(e.target.value)}/>
                                                <div style={{ maxHeight: 220, overflowY: "auto", marginTop: ".4rem", display: "flex", flexDirection: "column", gap: ".3rem" }}>
                                                  {conveniosFiltradosRot.slice(0, 50).map(cv => (
                                                    <div key={cv.id} onClick={() => { onConvenioRotChange(cv.id); setBusqConvenioRot(""); }}
                                                      style={{ padding: ".5rem .8rem", background: "#F8F9FA", borderRadius: 8, border: "1px solid #E9ECEF",
                                                        fontSize: ".82rem", cursor: "pointer" }}>
                                                      {cv.name}
                                                    </div>
                                                  ))}
                                                  {conveniosFiltradosRot.length === 0 && (
                                                    <p style={{ color: "#6C757D", fontSize: ".82rem", textAlign: "center", padding: ".5rem" }}>Sin resultados</p>
                                                  )}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                          {rotForm.convenioId && (
                                            <div>
                                              <label style={lbl}>Sede</label>
                                              {sedeFieldRot()}
                                            </div>
                                          )}
                                          <div className="row g-2">
                                            <div className="col-6">
                                              <label style={lbl}>Fecha Inicio</label>
                                              <input type="date" style={inp} value={rotForm.fechaInicio} onChange={FR("fechaInicio")}/>
                                            </div>
                                            <div className="col-6">
                                              <label style={lbl}>Fecha Fin</label>
                                              <input type="date" style={inp} value={rotForm.fechaFin} onChange={FR("fechaFin")}/>
                                            </div>
                                          </div>
                                          <div>
                                            <label style={lbl}>Campos clínicos asignados</label>
                                            <input type="number" min="0" style={inp} value={rotForm.camposClinicos} onChange={FR("camposClinicos")} placeholder="Ej: 8"/>
                                          </div>
                                          <div style={{ display: "flex", gap: ".6rem", justifyContent: "flex-end", marginTop: ".5rem" }}>
                                            <button onClick={() => setShowRotForm(false)} className="btn btn-secondary" disabled={savingRot}>Cancelar</button>
                                            <button onClick={() => guardarRotacion(g)} disabled={savingRot}
                                              style={{ background: "#0F6E56", color: "white", border: "none", padding: ".6rem 1.3rem", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                                              {savingRot ? "Guardando..." : "💾 Guardar tramo"}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal crear/editar curso */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1050,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid #E9ECEF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: "#0F6E56" }}>{editando ? "✏️ Editar Curso" : "📚 Nuevo Curso"}</h5>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={lbl}>Nombre del Curso <span style={{ color: "#DC3545" }}>*</span></label>
                <input style={inp} value={form.nombre_curso} onChange={F("nombre_curso")} placeholder="Ej: Crecimiento y Desarrollo"/>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label style={lbl}>Horas / semana</label>
                  <select style={inp} value={form.horas_semana_sel} onChange={F("horas_semana_sel")}>
                    {HORAS_OPT.map(h => <option key={h} value={h}>{h === "Otro" ? "Manual" : `${h}h`}</option>)}
                  </select>
                </div>
                {form.horas_semana_sel === "Otro" && (
                  <div className="col-6">
                    <label style={lbl}>Horas (manual)</label>
                    <input type="number" style={inp} value={form.horas_semana_manual} onChange={F("horas_semana_manual")}/>
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Nombre del Tutor</label>
                <input style={inp} value={form.nombre_tutor} onChange={F("nombre_tutor")}/>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label style={lbl}>Fecha Inicio <span style={{ color: "#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={form.fecha_inicio} onChange={F("fecha_inicio")}/>
                </div>
                <div className="col-6">
                  <label style={lbl}>Fecha Fin <span style={{ color: "#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={form.fecha_fin} onChange={F("fecha_fin")}/>
                </div>
              </div>
              <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" disabled={saving}>Cancelar</button>
                <button onClick={guardarCurso} disabled={saving}
                  style={{ background: "#0F6E56", color: "white", border: "none", padding: ".65rem 1.5rem", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                  {saving ? "Guardando..." : "💾 Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}