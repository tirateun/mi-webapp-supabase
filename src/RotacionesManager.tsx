// src/RotacionesManager.tsx
// Rotaciones externas: cada rotante es un registro individual con sus propias características
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const getPeriodo = (f: string) => {
  if (!f) return "";
  const [y, m] = f.split("-").map(Number);
  const sy = m >= 10 ? y : y - 1;
  return `OCT ${sy} – SEP ${sy + 1}`;
};

interface Rotante {
  id: string; convenio_id: string;
  dni: string; apellidos: string; nombres: string;
  especialidad: string; anio_residencia: number; institucion_origen: string;
  subtipo_id: string; sede_id: string; area_vinculada_id: string;
  fecha_inicio: string; fecha_fin: string; periodo: string;
  subtipo_nombre?: string; sede_nombre?: string; area_nombre?: string;
}
interface Subtipo { id: string; subtipo_nombre: string; }
interface Sede    { id: string; nombre: string; }
interface Area    { id: string; nombre: string; }

interface Props { convenioId: string; convenioNombre: string; isAdmin?: boolean; }

const EMPTY = {
  dni: "", apellidos: "", nombres: "", especialidad: "",
  anio_residencia: "1", institucion_origen: "",
  subtipoId: "", sedeId: "", areaId: "",
  fechaInicio: "", fechaFin: "",
};

export default function RotacionesManager({ convenioId, convenioNombre, isAdmin = false }: Props) {
  const [rotantes, setRotantes]     = useState<Rotante[]>([]);
  const [subtipos, setSubtipos]     = useState<Subtipo[]>([]);
  const [sedes, setSedes]           = useState<Sede[]>([]);
  const [areas, setAreas]           = useState<Area[]>([]);
  const [instInfo, setInstInfo]     = useState<{nombre:string;tipo:string}|null>(null);
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editando, setEditando]     = useState<Rotante|null>(null);
  const [form, setForm]             = useState({ ...EMPTY });
  const [saving, setSaving]         = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState("");

  const TIPOS_UNICOS = ["hospital","clínica","clinica","instituto","policlínico","policlinico"];
  const esUnica = (t: string) => TIPOS_UNICOS.some(x => t?.toLowerCase().includes(x));

  useEffect(() => {
    if (convenioId) { cargar(); cargarSubtipos(); cargarSedes(); cargarInstInfo(); cargarAreas(); }
  }, [convenioId]);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rotacion_personas")
      .select(`*, agreement_subtypes(subtipo_nombre),
               sedes_hospitalarias(nombre), areas_vinculadas(nombre)`)
      .eq("convenio_id", convenioId)
      .order("apellidos");
    setRotantes((data || []).map((r: any) => ({
      ...r,
      subtipo_nombre: r.agreement_subtypes?.subtipo_nombre || "",
      sede_nombre: r.sedes_hospitalarias?.nombre || "",
      area_nombre: r.areas_vinculadas?.nombre || "",
    })));
    setLoading(false);
  };

  const cargarSubtipos = async () => {
    const { data } = await supabase.from("agreement_subtypes")
      .select("id, subtipo_nombre").eq("agreement_id", convenioId).order("subtipo_nombre");
    setSubtipos((data || []).filter((s: any) =>
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
    setSedes((data || []).map((d: any) => d.sedes_hospitalarias).filter(Boolean));
  };

  const cargarAreas = async () => {
    const { data: links } = await supabase.from("agreement_areas_vinculadas")
      .select("area_vinculada_id").eq("agreement_id", convenioId);
    if (!links || links.length === 0) { setAreas([]); return; }
    const ids = links.map((l: any) => l.area_vinculada_id).filter(Boolean);
    const { data } = await supabase.from("areas_vinculadas")
      .select("id, nombre").in("id", ids).order("nombre");
    setAreas((data || []).filter((a: any) => !a.nombre?.toLowerCase().includes("escuela")));
  };

  const abrirNuevo = () => {
    setEditando(null);
    const sedeAuto = instInfo && esUnica(instInfo.tipo) ? instInfo.nombre : "";
    setForm({ ...EMPTY, sedeId: sedeAuto });
    setShowForm(true);
  };

  const abrirEditar = (r: Rotante) => {
    setEditando(r);
    setForm({
      dni: r.dni || "", apellidos: r.apellidos, nombres: r.nombres,
      especialidad: r.especialidad || "", anio_residencia: String(r.anio_residencia || 1),
      institucion_origen: r.institucion_origen || "",
      subtipoId: r.subtipo_id || "", sedeId: r.sede_id || "",
      areaId: r.area_vinculada_id || "",
      fechaInicio: r.fecha_inicio || "", fechaFin: r.fecha_fin || "",
    });
    setShowForm(true);
  };

  const guardar = async () => {
    if (!form.apellidos.trim() || !form.nombres.trim()) {
      alert("❌ Apellidos y nombres son obligatorios"); return;
    }
    if (!form.fechaInicio || !form.fechaFin) {
      alert("❌ Las fechas son obligatorias"); return;
    }
    const periodo = getPeriodo(form.fechaInicio);
    setSaving(true);
    try {
      const payload = {
        convenio_id: convenioId,
        subtipo_id: form.subtipoId || null,
        sede_id: form.sedeId || null,
        area_vinculada_id: form.areaId || null,
        dni: form.dni.trim() || null,
        apellidos: form.apellidos.trim(),
        nombres: form.nombres.trim(),
        especialidad: form.especialidad.trim() || null,
        anio_residencia: parseInt(form.anio_residencia) || null,
        institucion_origen: form.institucion_origen.trim() || null,
        fecha_inicio: form.fechaInicio,
        fecha_fin: form.fechaFin,
        periodo,
      };
      const { error } = editando
        ? await supabase.from("rotacion_personas").update(payload).eq("id", editando.id)
        : await supabase.from("rotacion_personas").insert(payload);
      if (error) throw error;
      setShowForm(false); cargar();
    } catch (e: any) { alert("❌ " + e.message); }
    finally { setSaving(false); }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este rotante?")) return;
    await supabase.from("rotacion_personas").delete().eq("id", id);
    cargar();
  };

  const F = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width: "100%", padding: ".65rem .9rem", border: "1.5px solid #DEE2E6",
    borderRadius: 8, fontSize: ".9rem", outline: "none" as const };
  const lbl = { display: "block" as const, fontWeight: 600 as const, fontSize: ".82rem", marginBottom: 4 };

  const sedeField = () => {
    if (instInfo && esUnica(instInfo.tipo))
      return <div style={{ ...inp, background: "#F0FAF5", color: "#155724",
        border: "1.5px solid #C3E6CB", display: "flex", alignItems: "center" }}>
        🏥 {instInfo.nombre}
        <span style={{ fontSize: ".75rem", color: "#6C757D", marginLeft: "auto" }}>(auto)</span>
      </div>;
    if (sedes.length > 0)
      return <select style={inp} value={form.sedeId} onChange={F("sedeId")}>
        <option value="">Seleccionar sede...</option>
        {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
      </select>;
    return <input style={inp} value={form.sedeId} onChange={F("sedeId")}
      placeholder="Nombre del hospital..."/>;
  };

  const periodos = [...new Set(rotantes.map(r => r.periodo).filter(Boolean))].sort().reverse();
  const filtrados = rotantes.filter(r => !filtroPeriodo || r.periodo === filtroPeriodo);

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1A6B3A,#0D4A28)", color: "white",
        padding: "1.25rem 1.75rem", borderRadius: 12, marginBottom: "1.25rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>🔄 Rotaciones Externas</h3>
          <p style={{ margin: ".2rem 0 0", opacity: .85, fontSize: ".85rem" }}>
            Cada rotante es un registro individual · {filtrados.length} registros
          </p>
        </div>
        {!isAdmin && (
          <button onClick={abrirNuevo}
            style={{ background: "white", color: "#0D4A28", border: "none",
              padding: ".6rem 1.2rem", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            ➕ Nuevo Rotante
          </button>
        )}
      </div>

      {/* Filtro periodo */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
        <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}
          style={{ ...inp, width: "auto", minWidth: 200 }}>
          <option value="">Todos los periodos</option>
          {periodos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {filtroPeriodo && (
          <button onClick={() => setFiltroPeriodo("")} className="btn btn-sm btn-outline-secondary">🔄</button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner-border" style={{ color: "#1A6B3A" }} role="status"/>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ background: "white", borderRadius: 12, padding: "3rem",
          textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: "2.5rem" }}>🔄</div>
          <p style={{ color: "#6C757D", marginTop: ".75rem" }}>No hay rotantes registrados</p>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-hover mb-0">
              <thead style={{ background: "#E8F5EE" }}>
                <tr>
                  <th>Rotante</th><th>Especialidad</th><th>Institución Origen</th>
                  <th>Área / Subtipo</th><th>Sede</th><th>Periodo</th>
                  <th>Fechas</th>
                  {!isAdmin && <th style={{ width: 80 }}>Acc.</th>}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ fontSize: ".88rem" }}>{r.apellidos}, {r.nombres}</strong>
                      {r.dni && <div><code style={{ fontSize: ".78rem" }}>{r.dni}</code></div>}
                    </td>
                    <td style={{ fontSize: ".85rem" }}>
                      {r.especialidad || "-"}
                      {r.anio_residencia ? <span style={{ fontSize: ".75rem", color: "#6C757D" }}> Año {r.anio_residencia}</span> : ""}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>{r.institucion_origen || "-"}</td>
                    <td style={{ fontSize: ".8rem" }}>
                      {r.area_nombre && <div style={{ color: "#1A4F8A" }}>{r.area_nombre}</div>}
                      {r.subtipo_nombre && <div style={{ color: "#6C757D", fontSize: ".75rem" }}>{r.subtipo_nombre}</div>}
                    </td>
                    <td style={{ fontSize: ".82rem" }}>{r.sede_nombre || "-"}</td>
                    <td>
                      {r.periodo && (
                        <span style={{ background: "#E2D9F3", color: "#4A1E7A",
                          padding: ".15rem .55rem", borderRadius: 8, fontSize: ".75rem", fontWeight: 600 }}>
                          {r.periodo}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "#6C757D" }}>
                      {r.fecha_inicio}<br/>{r.fecha_fin}
                    </td>
                    {!isAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: ".3rem" }}>
                          <button onClick={() => abrirEditar(r)} className="btn btn-sm btn-outline-secondary">✏️</button>
                          <button onClick={() => eliminar(r.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear/editar rotante */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1050,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 640,
            maxHeight: "93vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid #E9ECEF",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: "#0D4A28" }}>
                {editando ? "✏️ Editar Rotante" : "🔄 Nuevo Rotante"}
              </h5>
              <button onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem",
                  cursor: "pointer", color: "#6C757D" }}>×</button>
            </div>
            <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: ".9rem" }}>
              {/* Datos personales */}
              <div className="row g-3">
                <div className="col-5">
                  <label style={lbl}>DNI</label>
                  <input style={inp} value={form.dni} onChange={F("dni")} placeholder="12345678"/>
                </div>
                <div className="col-7">
                  <label style={lbl}>Institución de Origen</label>
                  <input style={inp} value={form.institucion_origen} onChange={F("institucion_origen")}
                    placeholder="Hospital Regional del Cusco"/>
                </div>
                <div className="col-6">
                  <label style={lbl}>Apellidos <span style={{ color: "#DC3545" }}>*</span></label>
                  <input style={inp} value={form.apellidos} onChange={F("apellidos")} placeholder="García López"/>
                </div>
                <div className="col-6">
                  <label style={lbl}>Nombres <span style={{ color: "#DC3545" }}>*</span></label>
                  <input style={inp} value={form.nombres} onChange={F("nombres")} placeholder="María"/>
                </div>
                <div className="col-8">
                  <label style={lbl}>Especialidad</label>
                  <input style={inp} value={form.especialidad} onChange={F("especialidad")} placeholder="Oncología Médica"/>
                </div>
                <div className="col-4">
                  <label style={lbl}>Año Resid.</label>
                  <select style={inp} value={form.anio_residencia} onChange={F("anio_residencia")}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}°</option>)}
                  </select>
                </div>
              </div>

              {/* Subtipo */}
              <div>
                <label style={lbl}>Subtipo Docente</label>
                <select style={inp} value={form.subtipoId} onChange={F("subtipoId")}>
                  <option value="">Seleccionar subtipo...</option>
                  {subtipos.map(s => <option key={s.id} value={s.id}>{s.subtipo_nombre}</option>)}
                </select>
              </div>

              {/* Área vinculada */}
              <div>
                <label style={lbl}>Área Vinculada</label>
                {areas.length > 0 ? (
                  <select style={inp} value={form.areaId} onChange={F("areaId")}>
                    <option value="">Seleccionar área...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                ) : (
                  <div style={{ ...inp, background: "#FFF3CD", color: "#856404", fontSize: ".85rem" }}>
                    ⚠️ No hay áreas de postgrado vinculadas a este convenio
                  </div>
                )}
              </div>

              {/* Sede */}
              <div>
                <label style={lbl}>Sede / Hospital</label>
                {sedeField()}
              </div>

              {/* Fechas */}
              <div className="row g-3">
                <div className="col-6">
                  <label style={lbl}>Fecha Inicio <span style={{ color: "#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={form.fechaInicio} onChange={F("fechaInicio")}/>
                </div>
                <div className="col-6">
                  <label style={lbl}>Fecha Fin <span style={{ color: "#DC3545" }}>*</span></label>
                  <input type="date" style={inp} value={form.fechaFin} onChange={F("fechaFin")}/>
                </div>
              </div>

              {form.fechaInicio && (
                <div style={{ background: "#E8F5EE", padding: ".65rem 1rem",
                  borderRadius: 8, fontSize: ".82rem", color: "#1A6B3A" }}>
                  ℹ️ Periodo: <strong>{getPeriodo(form.fechaInicio)}</strong>
                </div>
              )}

              <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" disabled={saving}>
                  Cancelar
                </button>
                <button onClick={guardar} disabled={saving}
                  style={{ background: "#1A6B3A", color: "white", border: "none",
                    padding: ".65rem 1.5rem", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                  {saving ? "Guardando..." : "💾 Guardar Rotante"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}