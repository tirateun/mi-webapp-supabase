// src/CursosManager.tsx
// Vista por convenio: muestra los tramos de cursos (multisede) que tocan ESTE convenio.
// La creación de cursos/grupos/alumnos ahora vive en CursoMaestroManager (nivel Escuela).
// Aquí solo se consulta y se edita el cupo de campos clínicos otorgado a cada tramo.
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

interface Tramo {
  rotacion_id: string; grupo_id: string; curso_id: string;
  nombre_curso: string; area_vinculada_id: string; nombre_grupo: string;
  convenio_id: string; sede_id: string; sede_nombre: string; sede_hospital: string;
  orden: number; fecha_inicio: string; fecha_fin: string;
  campos_clinicos_asignados: number | null; alumnos_asignados: number; porcentaje_uso: number | null;
}
interface Alumno { id: string; dni: string; apellidos: string; nombres: string; }

interface Props {
  convenioId: string;
  convenioNombre: string;
  areaId: string;
  areaNombre: string;
  isAdmin?: boolean;
}

export default function CursosManager({ convenioId, convenioNombre, areaId, areaNombre, isAdmin = false }: Props) {
  const [tramos, setTramos]     = useState<Tramo[]>([]);
  const [loading, setLoading]   = useState(false);
  const [filtroAnio, setFiltroAnio] = useState("");
  const [editCampos, setEditCampos] = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState<string | null>(null);

  const [expandido, setExpandido] = useState<string | null>(null);
  const [alumnosTramo, setAlumnosTramo] = useState<Alumno[]>([]);

  useEffect(() => { if (convenioId) cargar(); }, [convenioId, areaId]);

  const cargar = async () => {
    setLoading(true);
    let q = supabase.from("v_curso_rotaciones_uso").select("*").eq("convenio_id", convenioId).order("fecha_inicio", { ascending: false });
    if (areaId) q = q.eq("area_vinculada_id", areaId);
    const { data } = await q;
    setTramos(data || []);
    setLoading(false);
  };

  const tramosFiltrados = tramos.filter(t => !filtroAnio || t.fecha_inicio?.startsWith(filtroAnio));
  const aniosDisponibles = [...new Set(tramos.map(t => t.fecha_inicio?.split("-")[0]).filter(Boolean))].sort((a, b) => b.localeCompare(a));

  const abrirAlumnos = async (t: Tramo) => {
    if (expandido === t.rotacion_id) { setExpandido(null); return; }
    setExpandido(t.rotacion_id);
    const { data } = await supabase.from("curso_grupo_alumnos").select("alumnos(*)").eq("grupo_id", t.grupo_id);
    setAlumnosTramo((data || []).map((a: any) => a.alumnos).filter(Boolean));
  };

  const guardarCampos = async (t: Tramo) => {
    const valor = editCampos[t.rotacion_id];
    const num = valor === "" ? null : parseInt(valor);
    if (num != null && num < t.alumnos_asignados) {
      alert(`❌ Este tramo ya tiene ${t.alumnos_asignados} alumnos asignados — no puedes bajar el cupo a ${num}.`);
      return;
    }
    setSaving(t.rotacion_id);
    try {
      const { error } = await supabase.from("curso_rotaciones").update({ campos_clinicos_asignados: num }).eq("id", t.rotacion_id);
      if (error) throw error;
      await cargar();
      setEditCampos(prev => { const p = { ...prev }; delete p[t.rotacion_id]; return p; });
    } catch (e: any) { alert("❌ " + e.message); }
    finally { setSaving(null); }
  };

  const inp = { width: "100%", padding: ".55rem .8rem", border: "1.5px solid #DEE2E6", borderRadius: 8, fontSize: ".88rem", outline: "none" as const };

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ background: "linear-gradient(135deg, #1A6B3A, #145C30)",
        color: "white", padding: "1.25rem 1.75rem", borderRadius: 12,
        marginBottom: "1.25rem", display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>📚 Cursos en este convenio</h3>
          <p style={{ margin: "0.2rem 0 0", opacity: .85, fontSize: ".85rem" }}>
            {areaNombre ? areaNombre + " · " : ""}{tramos.length} tramo(s) de rotación
          </p>
        </div>
      </div>

      <div style={{ background: "#E8F5EE", border: "1px solid #C3E6CB", borderRadius: 10,
        padding: ".85rem 1.1rem", marginBottom: "1.25rem", fontSize: ".85rem", color: "#1A6B3A" }}>
        ℹ️ Los cursos ahora se crean y gestionan a nivel Escuela (grupos, alumnos, sedes de rotación).
        Aquí solo puedes ver los tramos que llegan a este convenio y ajustar el número de <strong>campos clínicos</strong> que le otorgas a cada uno.
      </div>

      {/* Filtro año */}
      {aniosDisponibles.length > 0 && (
        <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)} style={{ ...inp, width: "auto", minWidth: 120 }}>
            <option value="">Todos los años</option>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {filtroAnio && (
            <button onClick={() => setFiltroAnio("")} className="btn btn-sm btn-outline-secondary">🔄 Limpiar</button>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}><div className="spinner-border text-success" role="status"/></div>
      ) : tramosFiltrados.length === 0 ? (
        <div style={{ background: "white", borderRadius: 12, padding: "3rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: "2.5rem" }}>📚</div>
          <p style={{ color: "#6C757D", marginTop: ".75rem" }}>No hay tramos de curso registrados para este convenio</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tramosFiltrados.map(t => {
            const uso = t.porcentaje_uso;
            const colorUso = uso == null ? "#6C757D" : uso > 100 ? "#DC3545" : uso >= 90 ? "#1A6B3A" : uso >= 50 ? "#856404" : "#DC3545";
            const enEdicion = editCampos[t.rotacion_id] !== undefined;
            return (
              <div key={t.rotacion_id} style={{ background: "white", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,.08)", border: "1px solid #E9ECEF", overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".75rem" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap", marginBottom: ".35rem" }}>
                      <strong style={{ fontSize: "1rem" }}>{t.nombre_curso}</strong>
                      <span style={{ background: "#FEF3C7", color: "#7B5A1A", padding: ".15rem .6rem", borderRadius: 10, fontSize: ".78rem", fontWeight: 600 }}>{t.nombre_grupo}</span>
                    </div>
                    <div style={{ fontSize: ".82rem", color: "#6C757D", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {(t.sede_nombre || t.sede_hospital) && <span>🏥 {t.sede_nombre || t.sede_hospital}</span>}
                      <span>📅 {t.fecha_inicio} → {t.fecha_fin}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flexWrap: "wrap" }}>
                    <button onClick={() => abrirAlumnos(t)}
                      style={{ background: "#E8F5EE", color: "#1A6B3A", border: "1px solid #1A6B3A",
                        padding: ".4rem .9rem", borderRadius: 8, cursor: "pointer", fontSize: ".82rem", fontWeight: 600 }}>
                      👩‍🎓 {t.alumnos_asignados} alumno(s) {expandido === t.rotacion_id ? "▲" : "▼"}
                    </button>

                    {!isAdmin && enEdicion ? (
                      <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                        <input type="number" min="0" style={{ ...inp, width: 90 }}
                          value={editCampos[t.rotacion_id]} onChange={e => setEditCampos(prev => ({ ...prev, [t.rotacion_id]: e.target.value }))}/>
                        <button onClick={() => guardarCampos(t)} disabled={saving === t.rotacion_id}
                          style={{ background: "#1A6B3A", color: "white", border: "none", padding: ".4rem .8rem", borderRadius: 7, cursor: "pointer", fontSize: ".8rem", fontWeight: 600 }}>
                          {saving === t.rotacion_id ? "..." : "💾"}
                        </button>
                        <button onClick={() => setEditCampos(prev => { const p = { ...prev }; delete p[t.rotacion_id]; return p; })}
                          className="btn btn-sm btn-outline-secondary">✕</button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: ".85rem", fontWeight: 700, color: colorUso }}>
                          {t.alumnos_asignados} / {t.campos_clinicos_asignados ?? "?"} campos {uso != null && `(${uso}%)`}
                        </div>
                        {!isAdmin && (
                          <button onClick={() => setEditCampos(prev => ({ ...prev, [t.rotacion_id]: String(t.campos_clinicos_asignados ?? "") }))}
                            style={{ background: "none", border: "none", color: "#1A6B3A", fontSize: ".78rem", cursor: "pointer", padding: 0 }}>
                            ✏️ Editar cupo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {expandido === t.rotacion_id && (
                  <div style={{ borderTop: "1px solid #E9ECEF", padding: "1rem 1.25rem", background: "#FAFBFC" }}>
                    {alumnosTramo.length === 0 ? (
                      <p style={{ color: "#6C757D", fontSize: ".85rem", margin: 0 }}>Sin alumnos asignados todavía</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
                        {alumnosTramo.map(a => (
                          <div key={a.id} style={{ padding: ".4rem .8rem", background: "white", borderRadius: 8, border: "1px solid #E9ECEF", fontSize: ".85rem" }}>
                            <strong>{a.apellidos}</strong>, {a.nombres} <span style={{ color: "#6C757D", fontSize: ".78rem" }}>DNI: {a.dni || "-"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ color: "#6C757D", fontSize: ".78rem", marginTop: ".75rem", marginBottom: 0 }}>
                      Los alumnos de este grupo se gestionan desde Cursos (Escuela), no aquí.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}