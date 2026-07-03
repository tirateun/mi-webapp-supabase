// src/CursosManager.tsx
// Gestión de cursos semestrales vinculados a convenio + área vinculada
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ── Helpers ──────────────────────────────────────────────
const getSemestre = (fecha: string) => {
  if (!fecha) return "";
  const [y, m] = fecha.split("-").map(Number);
  return `${y}-${m <= 6 ? "I" : "II"}`;
};

const ESCUELAS = ["Medicina", "Enfermería", "Nutrición", "Obstetricia", "Tecnología Médica"];
const GRADOS   = ["Pregrado", "Internado", "Postgrado", "Residentado"];
const HORAS_OPT = ["2","4","6","8","10","12","14","16","20","24","32","Otro"];
const UNIVERSIDADES = [
  "UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS",
  "UNIVERSIDAD PERUANA CAYETANO HEREDIA",
  "UNIVERSIDAD DE SAN MARTIN DE PORRES",
  "UNIVERSIDAD PRIVADA NORBERT WIENER",
  "OTRA",
];

interface Curso {
  id: string;
  nombre_curso: string;
  escuela: string;
  grado: string;
  nombre_grupo: string;
  sede_hospital: string;
  horas_semana: number;
  fecha_inicio: string;
  fecha_fin: string;
  nombre_tutor: string;
  semestre: string;
  anio: number;
  convenio_id: string;
  area_vinculada_id: string;
  num_alumnos?: number;
}

interface Alumno {
  id: string; dni: string; apellidos: string; nombres: string;
  email_institucional: string; codigo_universitario: string;
}

interface Props {
  convenioId: string;
  convenioNombre: string;
  areaId: string;
  areaNombre: string;
  isAdmin?: boolean;
}

interface Area    { id: string; nombre: string; }
interface Subtipo { id: string; subtipo_nombre: string; }

const EMPTY = {
  nombre_curso: "", escuela: "Medicina", grado: "Pregrado", nombre_grupo: "",
  sede_hospital: "", horas_semana_sel: "4", horas_semana_manual: "",
  fecha_inicio: "", fecha_fin: "", nombre_tutor: "", areaVinculadaId: "",
};

export default function CursosManager({ convenioId, convenioNombre, areaId, areaNombre, isAdmin = false }: Props) {
  const [cursos, setCursos]         = useState<Curso[]>([]);
  const [areas, setAreas]           = useState<Area[]>([]);
  const [subtipos, setSubtipos]     = useState<Subtipo[]>([]);
  const [sedes, setSedes]           = useState<{id:string;nombre:string}[]>([]);
  const [instInfo, setInstInfo]     = useState<{nombre:string;tipo:string}|null>(null);
  const [loading, setLoading]       = useState(false);
  const [filtroAnio, setFiltroAnio]     = useState("");
  const [filtroSem,  setFiltroSem]      = useState("");
  const [showForm, setShowForm]         = useState(false);
  const [editando, setEditando]         = useState<Curso | null>(null);
  const [form, setForm]                 = useState({ ...EMPTY });
  const [saving, setSaving]             = useState(false);
  // Modal de alumnos
  const [cursoSelec, setCursoSelec]     = useState<Curso | null>(null);
  const [alumnosCurso, setAlumnosCurso] = useState<Alumno[]>([]);
  const [todosAlumnos, setTodosAlumnos] = useState<Alumno[]>([]);
  const [busqAlumno, setBusqAlumno]     = useState("");
  const [showAlumnos, setShowAlumnos]   = useState(false);

  useEffect(() => {
    if (convenioId) {
      cargar(); cargarAreas(); cargarSubtipos();
      cargarInstitucion(); cargarSedes();
    }
  }, [convenioId, areaId]);

  // Tipos que indican institución única (no red)
  const TIPOS_UNICOS = ["Hospital","Clínica","Clinica","Instituto","Policlínico","Policlinico","Centro de Salud"];
  const esInstitucionUnica = (tipo: string) =>
    TIPOS_UNICOS.some(t => tipo?.toLowerCase().includes(t.toLowerCase()));

  const cargarInstitucion = async () => {
    const { data } = await supabase
      .from("agreements")
      .select("instituciones(nombre, tipo)")
      .eq("id", convenioId)
      .single();
    const inst = (data as any)?.instituciones;
    setInstInfo(inst ? { nombre: inst.nombre, tipo: inst.tipo || "" } : null);
  };

  const cargarSedes = async () => {
    const { data } = await supabase
      .from("convenio_sedes")
      .select("sede_id, sedes_hospitalarias(id, nombre)")
      .eq("convenio_id", convenioId);
    setSedes(
      (data || [])
        .map((d: any) => d.sedes_hospitalarias)
        .filter(Boolean)
        .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))
    );
  };

  const cargarSubtipos = async () => {
    const { data } = await supabase
      .from("agreement_subtypes")
      .select("id, subtipo_nombre")
      .eq("agreement_id", convenioId)
      .order("subtipo_nombre");
    // Cursos: solo subtipos de PREGRADO
    setSubtipos((data || []).filter((s: any) =>
      s.subtipo_nombre?.toUpperCase().includes("PREGRADO")
    ));
  };

  const cargarAreas = async () => {
    // Paso 1: IDs de áreas vinculadas al convenio
    const { data: links } = await supabase
      .from("agreement_areas_vinculadas")
      .select("area_vinculada_id")
      .eq("agreement_id", convenioId);

    if (!links || links.length === 0) { setAreas([]); return; }

    // Paso 2: Detalles de esas áreas
    const ids = links.map((l: any) => l.area_vinculada_id).filter(Boolean);
    const { data: areasData } = await supabase
      .from("areas_vinculadas")
      .select("id, nombre")
      .in("id", ids)
      .order("nombre");

    // Cursos: solo áreas pregrado (Escuelas Profesionales)
    setAreas((areasData || []).filter((a: any) =>
      a.nombre?.toLowerCase().includes("escuela")
    ));
  };

  const cargar = async () => {
    if (!convenioId) { setCursos([]); return; }
    setLoading(true);
    let q = supabase.from("cursos")
      .select("*, num_alumnos:curso_alumnos(count)")
      .eq("convenio_id", convenioId)
      .order("fecha_inicio", { ascending: false });
    // Filtrar por área solo si está seleccionada
    if (areaId) q = q.eq("area_vinculada_id", areaId);
    const { data } = await q;
    const procesados = (data || []).map((c: any) => ({
      ...c, num_alumnos: c.num_alumnos?.[0]?.count ?? 0
    }));
    setCursos(procesados);
    setLoading(false);
  };

  const cursosFiltrados = cursos.filter(c => {
    if (filtroAnio && String(c.anio) !== filtroAnio) return false;
    if (filtroSem  && c.semestre !== filtroSem) return false;
    return true;
  });

  const aniosDisponibles = [...new Set(cursos.map(c => c.anio).filter(Boolean))].sort((a,b) => b-a);
  const semestresDisponibles = [...new Set(cursos.map(c => c.semestre).filter(Boolean))].sort();

  const abrirNuevo = () => {
    setEditando(null);
    // Si es institución única, auto-completar sede
    const sedeAuto = instInfo && esInstitucionUnica(instInfo.tipo) ? instInfo.nombre : "";
    setForm({ ...EMPTY, sede_hospital: sedeAuto });
    setShowForm(true);
  };
  const abrirEditar = (c: Curso) => {
    setEditando(c);
    setForm({
      nombre_curso: c.nombre_curso || "", escuela: c.escuela || "Medicina",
      grado: c.grado || "Pregrado", nombre_grupo: c.nombre_grupo || "",
      sede_hospital: c.sede_hospital || "",
      horas_semana_sel: HORAS_OPT.includes(String(c.horas_semana)) ? String(c.horas_semana) : "Otro",
      horas_semana_manual: HORAS_OPT.includes(String(c.horas_semana)) ? "" : String(c.horas_semana),
      fecha_inicio: c.fecha_inicio || "", fecha_fin: c.fecha_fin || "",
      nombre_tutor: c.nombre_tutor || "",
      areaVinculadaId: c.area_vinculada_id || "",
    });
    setShowForm(true);
  };

  const guardar = async () => {
    if (!form.nombre_curso.trim() || !form.fecha_inicio || !form.fecha_fin) {
      alert("❌ Nombre del curso, fecha inicio y fecha fin son obligatorios"); return;
    }
    const horas = form.horas_semana_sel === "Otro"
      ? parseFloat(form.horas_semana_manual) || null
      : parseFloat(form.horas_semana_sel) || null;
    const sem = getSemestre(form.fecha_inicio);
    const anio = parseInt(form.fecha_inicio.split("-")[0]) || null;

    const payload = {
      convenio_id: convenioId,
      area_vinculada_id: form.areaVinculadaId || areaId || null,
      nombre_curso: form.nombre_curso.trim(),
      escuela: form.escuela || null,
      grado: form.grado, nombre_grupo: form.nombre_grupo.trim() || null,
      sede_hospital: form.sede_hospital.trim() || null,
      horas_semana: horas, fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin, nombre_tutor: form.nombre_tutor.trim() || null,
      semestre: sem, anio,
    };
    setSaving(true);
    let error;
    if (editando) {
      ({ error } = await supabase.from("cursos").update(payload).eq("id", editando.id));
    } else {
      ({ error } = await supabase.from("cursos").insert(payload));
    }
    setSaving(false);
    if (error) { alert("❌ " + error.message); return; }
    setShowForm(false); cargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este curso y todas sus asignaciones de alumnos?")) return;
    await supabase.from("cursos").delete().eq("id", id);
    cargar();
  };

  // ── Gestión de alumnos del curso ──
  const abrirAlumnos = async (curso: Curso) => {
    setCursoSelec(curso); setBusqAlumno(""); setShowAlumnos(true);
    const [{ data: asignados }, { data: todos }] = await Promise.all([
      supabase.from("curso_alumnos").select("alumno_id, alumnos(*)").eq("curso_id", curso.id),
      supabase.from("alumnos").select("*").order("apellidos"),
    ]);
    setAlumnosCurso((asignados || []).map((a: any) => a.alumnos).filter(Boolean));
    setTodosAlumnos(todos || []);
  };

  const asignarAlumno = async (alumno: Alumno) => {
    if (alumnosCurso.find(a => a.id === alumno.id)) return;
    await supabase.from("curso_alumnos").insert({ curso_id: cursoSelec!.id, alumno_id: alumno.id });
    setAlumnosCurso(prev => [...prev, alumno]);
    cargar();
  };

  const quitarAlumno = async (alumnoId: string) => {
    await supabase.from("curso_alumnos").delete()
      .eq("curso_id", cursoSelec!.id).eq("alumno_id", alumnoId);
    setAlumnosCurso(prev => prev.filter(a => a.id !== alumnoId));
    cargar();
  };

  const alumnosFiltrados = todosAlumnos.filter(a => {
    const q = busqAlumno.toLowerCase();
    if (!q) return !alumnosCurso.find(ac => ac.id === a.id);
    return (a.apellidos + " " + a.nombres + " " + a.dni).toLowerCase().includes(q)
      && !alumnosCurso.find(ac => ac.id === a.id);
  });

  const F = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const labelStyle = { fontSize: ".82rem", fontWeight: 600 as const, marginBottom: 4, display: "block" as const };
  const inputStyle = { width: "100%", padding: ".65rem .9rem", border: "1.5px solid #DEE2E6",
    borderRadius: 8, fontSize: ".9rem", outline: "none" as const };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1A6B3A, #145C30)",
        color: "white", padding: "1.25rem 1.75rem", borderRadius: 12,
        marginBottom: "1.25rem", display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>📚 Cursos</h3>
          <p style={{ margin: "0.2rem 0 0", opacity: .85, fontSize: ".85rem" }}>
            {areaNombre} · {cursos.length} cursos registrados
          </p>
        </div>
        {!isAdmin && (
          <button onClick={abrirNuevo}
            style={{ background: "white", color: "#1A6B3A", border: "none",
              padding: ".6rem 1.2rem", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            ➕ Nuevo Curso
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: 120 }}>
          <option value="">Todos los años</option>
          {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtroSem} onChange={e => setFiltroSem(e.target.value)}
          style={{ ...inputStyle, width: "auto", minWidth: 140 }}>
          <option value="">Todos los semestres</option>
          {semestresDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filtroAnio || filtroSem) && (
          <button onClick={() => { setFiltroAnio(""); setFiltroSem(""); }}
            className="btn btn-sm btn-outline-secondary">🔄 Limpiar</button>
        )}
      </div>

      {/* Lista de cursos */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner-border text-success" role="status"/></div>
      ) : cursosFiltrados.length === 0 ? (
        <div style={{ background: "white", borderRadius: 12, padding: "3rem",
          textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: "2.5rem" }}>📚</div>
          <p style={{ color: "#6C757D", marginTop: ".75rem" }}>No hay cursos para los filtros seleccionados</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {cursosFiltrados.map(c => (
            <div key={c.id} style={{ background: "white", borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,.08)", overflow: "hidden",
              border: "1px solid #E9ECEF" }}>
              <div style={{ padding: "1rem 1.25rem", display: "flex",
                justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".4rem", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "1rem", color: "#1A1A2E" }}>{c.nombre_curso}</strong>
                    <span style={{ background: c.grado === "Pregrado" ? "#D4EDDA" : "#CCE5FF",
                      color: c.grado === "Pregrado" ? "#155724" : "#004085",
                      padding: ".2rem .65rem", borderRadius: 12, fontSize: ".78rem", fontWeight: 600 }}>
                      {c.grado}
                    </span>
                    <span style={{ background: "#FFF3CD", color: "#856404",
                      padding: ".2rem .65rem", borderRadius: 12, fontSize: ".78rem", fontWeight: 600 }}>
                      {c.semestre}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                    gap: ".3rem .75rem", fontSize: ".82rem", color: "#6C757D" }}>
                    {c.escuela    && <span>🏫 {c.escuela}</span>}
                    {c.sede_hospital && <span>🏥 {c.sede_hospital}</span>}
                    {c.nombre_grupo  && <span>👥 {c.nombre_grupo}</span>}
                    {c.nombre_tutor  && <span>👨‍🏫 {c.nombre_tutor}</span>}
                    {c.horas_semana  && <span>⏱️ {c.horas_semana}h/sem</span>}
                    <span>📅 {c.fecha_inicio} → {c.fecha_fin}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: ".4rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={() => abrirAlumnos(c)}
                    style={{ background: "#E8F5EE", color: "#1A6B3A", border: "1px solid #1A6B3A",
                      padding: ".4rem .9rem", borderRadius: 8, cursor: "pointer", fontSize: ".82rem", fontWeight: 600 }}>
                    👩‍🎓 Alumnos ({c.num_alumnos})
                  </button>
                  {!isAdmin && (
                    <>
                      <button onClick={() => abrirEditar(c)} className="btn btn-sm btn-outline-secondary">✏️</button>
                      <button onClick={() => eliminar(c.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Crear/Editar curso */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 700,
            maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid #E9ECEF",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: "#1A6B3A" }}>
                {editando ? "✏️ Editar Curso" : "📚 Registrar nuevo curso"}
              </h5>
              <button onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#6C757D" }}>×</button>
            </div>

            <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Nombre del curso */}
              <div>
                <label style={labelStyle}>Nombre del Curso / Campo Clínico <span style={{ color: "#DC3545" }}>*</span></label>
                <input style={inputStyle} value={form.nombre_curso} onChange={F("nombre_curso")} placeholder="Ej: Semiología Médica"/>
              </div>

              {/* Subtipo Docente — lista del convenio */}
              <div>
                <label style={labelStyle}>
                  Subtipo Docente <span style={{ color: "#DC3545" }}>*</span>
                  <span style={{ color: "#6C757D", fontWeight: 400, fontSize: ".78rem", marginLeft: 4 }}>
                    (subtipos del convenio)
                  </span>
                </label>
                {subtipos.length > 0 ? (
                  <select style={inputStyle} value={form.grado} onChange={F("grado")}>
                    <option value="">Seleccionar subtipo...</option>
                    {subtipos.map(s => (
                      <option key={s.id} value={s.subtipo_nombre}>{s.subtipo_nombre}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ ...inputStyle, background: "#FFF3CD", color: "#856404",
                    fontSize: ".85rem", display: "flex", alignItems: "center" }}>
                    ⚠️ Este convenio no tiene subtipos configurados
                  </div>
                )}
              </div>

              {/* Área Vinculada — siempre, lista del convenio */}
              <div>
                <label style={labelStyle}>
                  Área Vinculada <span style={{ color: "#6C757D", fontWeight: 400, fontSize: ".78rem" }}>
                    (áreas configuradas en el convenio)
                  </span>
                </label>
                {areas.length > 0 ? (
                  <select style={inputStyle} value={form.areaVinculadaId} onChange={F("areaVinculadaId")}>
                    <option value="">Seleccionar área...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                ) : (
                  <div style={{ ...inputStyle, background: "#FFF3CD", color: "#856404",
                    fontSize: ".85rem", display: "flex", alignItems: "center" }}>
                    ⚠️ Este convenio no tiene áreas vinculadas — configúralas en el módulo de Convenios
                  </div>
                )}
              </div>

              {/* Nombre grupo */}
              <div>
                <label style={labelStyle}>Nombre Grupo</label>
                <input style={inputStyle} value={form.nombre_grupo} onChange={F("nombre_grupo")} placeholder="Ej: Grupo A - Turno mañana"/>
              </div>

              {/* Sede / Hospital — condicional según tipo de institución */}
              <div>
                <label style={labelStyle}>Sede / Hospital</label>
                {instInfo && esInstitucionUnica(instInfo.tipo) ? (
                  /* Institución única → se auto-completa, solo lectura */
                  <div style={{ ...inputStyle, background: "#F0FAF5",
                    color: "#155724", border: "1.5px solid #C3E6CB",
                    display: "flex", alignItems: "center", gap: ".5rem" }}>
                    🏥 {instInfo.nombre}
                    <span style={{ fontSize: ".75rem", color: "#6C757D", marginLeft: "auto" }}>
                      (auto-completado)
                    </span>
                  </div>
                ) : sedes.length > 0 ? (
                  /* Red / DIRIS → dropdown de sedes vinculadas */
                  <select style={inputStyle} value={form.sede_hospital}
                    onChange={F("sede_hospital")}>
                    <option value="">Seleccionar sede...</option>
                    {sedes.map(s => (
                      <option key={s.id} value={s.nombre}>{s.nombre}</option>
                    ))}
                  </select>
                ) : (
                  /* Sin sedes configuradas → texto libre */
                  <input style={inputStyle} value={form.sede_hospital}
                    onChange={F("sede_hospital")}
                    placeholder="Ej: Hospital Nacional Arzobispo Loayza"/>
                )}
              </div>

              {/* Horas a la semana */}
              <div className="row g-3">
                <div className="col-md-4">
                  <label style={labelStyle}>Horas a la semana</label>
                  <select style={inputStyle} value={form.horas_semana_sel} onChange={F("horas_semana_sel")}>
                    {HORAS_OPT.map(h => <option key={h} value={h}>{h === "Otro" ? "Ingresar manualmente" : `${h} horas`}</option>)}
                  </select>
                </div>
                {form.horas_semana_sel === "Otro" && (
                  <div className="col-md-4">
                    <label style={labelStyle}>Horas (manual)</label>
                    <input type="number" style={inputStyle} value={form.horas_semana_manual}
                      onChange={F("horas_semana_manual")} placeholder="Ej: 18" min="1" max="40"/>
                  </div>
                )}
                <div className="col-md-4">
                  <label style={labelStyle}>Nombre del Tutor</label>
                  <input style={inputStyle} value={form.nombre_tutor} onChange={F("nombre_tutor")} placeholder="Dr. Juan Pérez"/>
                </div>
              </div>

              {/* Fechas + semestre auto */}
              <div className="row g-3">
                <div className="col-md-4">
                  <label style={labelStyle}>Fecha Inicio <span style={{ color: "#DC3545" }}>*</span></label>
                  <input type="date" style={inputStyle} value={form.fecha_inicio} onChange={F("fecha_inicio")}/>
                </div>
                <div className="col-md-4">
                  <label style={labelStyle}>Fecha Final <span style={{ color: "#DC3545" }}>*</span></label>
                  <input type="date" style={inputStyle} value={form.fecha_fin} onChange={F("fecha_fin")}/>
                </div>
                <div className="col-md-4">
                  <label style={labelStyle}>Semestre (automático)</label>
                  <div style={{ ...inputStyle, background: "#F8F9FA", color: "#495057", border: "1.5px solid #E9ECEF" }}>
                    {form.fecha_inicio ? getSemestre(form.fecha_inicio) : "—"}
                  </div>
                </div>
              </div>

              {/* Nota periodo */}
              {form.fecha_inicio && (
                <div style={{ background: "#E8F5EE", padding: ".65rem 1rem", borderRadius: 8,
                  fontSize: ".82rem", color: "#1A6B3A" }}>
                  ℹ️ Período detectado: <strong>
                    {parseInt(form.fecha_inicio.split("-")[1]) <= 6 ? "Enero – Junio" : "Julio – Diciembre"}
                    {" " + form.fecha_inicio.split("-")[0]}
                  </strong> · Semestre <strong>{getSemestre(form.fecha_inicio)}</strong>
                </div>
              )}

              {/* Acciones */}
              <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", marginTop: ".5rem" }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" disabled={saving}>Cancelar</button>
                <button onClick={guardar} disabled={saving}
                  style={{ background: "#1A6B3A", color: "white", border: "none",
                    padding: ".65rem 1.5rem", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                  {saving ? "Guardando..." : "💾 Guardar Curso"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Alumnos del curso */}
      {showAlumnos && cursoSelec && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
          zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 720,
            maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid #E9ECEF",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <div>
                <h5 style={{ margin: 0, fontWeight: 700, color: "#1A6B3A" }}>
                  👩‍🎓 Alumnos — {cursoSelec.nombre_curso}
                </h5>
                <p style={{ margin: ".2rem 0 0", fontSize: ".82rem", color: "#6C757D" }}>
                  {cursoSelec.semestre} · {alumnosCurso.length} alumnos asignados
                </p>
              </div>
              <button onClick={() => setShowAlumnos(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#6C757D" }}>×</button>
            </div>

            <div style={{ padding: "1.25rem 1.75rem" }}>
              {/* Alumnos asignados */}
              {alumnosCurso.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h6 style={{ fontWeight: 700, color: "#1A6B3A", marginBottom: ".75rem" }}>
                    ✅ Asignados ({alumnosCurso.length})
                  </h6>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", maxHeight: 220, overflowY: "auto" }}>
                    {alumnosCurso.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: ".5rem .9rem",
                        background: "#F0FAF5", borderRadius: 8, border: "1px solid #C3E6CB" }}>
                        <div>
                          <strong style={{ fontSize: ".9rem" }}>{a.apellidos}, {a.nombres}</strong>
                          <span style={{ fontSize: ".78rem", color: "#6C757D", marginLeft: ".5rem" }}>
                            DNI: {a.dni || "-"}
                          </span>
                        </div>
                        {!isAdmin && (
                          <button onClick={() => quitarAlumno(a.id)}
                            className="btn btn-sm btn-outline-danger" style={{ padding: ".2rem .6rem" }}>✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buscar y agregar alumnos */}
              {!isAdmin && (
                <div>
                  <h6 style={{ fontWeight: 700, color: "#495057", marginBottom: ".75rem" }}>
                    ➕ Agregar alumno del padrón
                  </h6>
                  <input type="text" value={busqAlumno} onChange={e => setBusqAlumno(e.target.value)}
                    placeholder="🔍  Buscar por nombre o DNI..."
                    style={{ ...inputStyle, marginBottom: ".75rem" }}/>
                  <div style={{ maxHeight: 260, overflowY: "auto", display: "flex",
                    flexDirection: "column", gap: ".35rem" }}>
                    {alumnosFiltrados.slice(0, 50).map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: ".5rem .9rem",
                        background: "#F8F9FA", borderRadius: 8, border: "1px solid #E9ECEF" }}>
                        <div>
                          <span style={{ fontSize: ".9rem" }}><strong>{a.apellidos}</strong>, {a.nombres}</span>
                          <span style={{ fontSize: ".78rem", color: "#6C757D", marginLeft: ".5rem" }}>
                            {a.dni || a.codigo_universitario || ""}
                          </span>
                        </div>
                        <button onClick={() => asignarAlumno(a)}
                          style={{ background: "#1A6B3A", color: "white", border: "none",
                            padding: ".3rem .75rem", borderRadius: 6, cursor: "pointer", fontSize: ".82rem" }}>
                          + Agregar
                        </button>
                      </div>
                    ))}
                    {alumnosFiltrados.length === 0 && (
                      <p style={{ color: "#6C757D", fontSize: ".85rem", textAlign: "center", padding: "1rem" }}>
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
    </div>
  );
}