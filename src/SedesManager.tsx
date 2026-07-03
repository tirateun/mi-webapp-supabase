// src/SedesManager.tsx
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const TIPOS_RED  = ["red","diris","diresa","disa","gobierno regional","microred"];
const TIPOS_SEDE = ["Hospital","Centro de Salud","CAP I","CAP II","CAP III","Policlínico","Clínica","Instituto","CERP","Otro"];
const esRed = (tipo: string) => TIPOS_RED.some(t => tipo?.toLowerCase().includes(t));

interface Convenio { id: string; name: string; }
interface InstInfo  { nombre: string; tipo: string; }
interface Sede      { id: string; nombre: string; tipo: string; direccion: string; distrito: string; activo: boolean; }

const EMPTY = { nombre:"", tipo:"Hospital", direccion:"", distrito:"", activo:true };

export default function SedesManager() {
  // Convenio selector
  const [convenios, setConvenios]         = useState<Convenio[]>([]);
  const [convenioId, setConvenioId]       = useState("");
  const [convenioNombre, setConvenioNombre] = useState("");
  const [busqConv, setBusqConv]           = useState("");
  const [instInfo, setInstInfo]           = useState<InstInfo | null>(null);
  const [loadingConv, setLoadingConv]     = useState(false);
  // Sedes del convenio
  const [sedes, setSedes]     = useState<Sede[]>([]);
  const [loading, setLoading] = useState(false);
  // Form crear/editar
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Sede | null>(null);
  const [form, setForm]         = useState({ ...EMPTY });
  const [saving, setSaving]     = useState(false);
  // Vincular sedes existentes
  const [todasSedes, setTodasSedes] = useState<Sede[]>([]);
  const [showVinc, setShowVinc]     = useState(false);
  const [busqSede, setBusqSede]     = useState("");

  useEffect(() => { cargarConvenios(); }, []);
  useEffect(() => {
    if (convenioId) { cargarInstInfo(); cargarSedes(); }
    else { setInstInfo(null); setSedes([]); setShowVinc(false); }
  }, [convenioId]);

  const cargarConvenios = async () => {
    setLoadingConv(true);
    const { data } = await supabase.from("agreements")
      .select("id, name").contains("tipo_convenio", ["Docente Asistencial"]).order("name");
    setConvenios(data || []);
    setLoadingConv(false);
  };

  const cargarInstInfo = async () => {
    const { data } = await supabase.from("agreements")
      .select("instituciones(nombre, tipo)").eq("id", convenioId).single();
    const inst = (data as any)?.instituciones;
    setInstInfo(inst ? { nombre: inst.nombre, tipo: inst.tipo || "" } : null);
  };

  const cargarSedes = async () => {
    setLoading(true);
    const { data } = await supabase.from("convenio_sedes")
      .select("sedes_hospitalarias(id,nombre,tipo,direccion,distrito,activo)")
      .eq("convenio_id", convenioId);
    setSedes(
      (data || []).map((d: any) => d.sedes_hospitalarias).filter(Boolean)
        .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre))
    );
    setLoading(false);
  };

  const cargarTodasSedes = async () => {
    const { data } = await supabase.from("sedes_hospitalarias")
      .select("*").eq("activo", true).order("nombre");
    setTodasSedes(data || []);
    setShowVinc(true);
  };

  const vincularExistente = async (sedeId: string) => {
    if (sedes.some(s => s.id === sedeId)) return;
    const { error } = await supabase.from("convenio_sedes")
      .insert({ convenio_id: convenioId, sede_id: sedeId });
    if (error) { alert("❌ " + error.message); return; }
    cargarSedes();
  };

  const desvincular = async (sedeId: string, nombre: string) => {
    if (!confirm(`¿Desvincular "${nombre}" de este convenio?`)) return;
    await supabase.from("convenio_sedes")
      .delete().eq("convenio_id", convenioId).eq("sede_id", sedeId);
    cargarSedes();
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { alert("❌ El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(), tipo: form.tipo,
        direccion: form.direccion.trim() || null,
        distrito: form.distrito.trim() || null,
        activo: form.activo
      };
      if (editando) {
        const { error } = await supabase.from("sedes_hospitalarias")
          .update(payload).eq("id", editando.id);
        if (error) throw error;
      } else {
        const { data: nueva, error: e1 } = await supabase
          .from("sedes_hospitalarias").insert(payload).select().single();
        if (e1) throw e1;
        const { error: e2 } = await supabase.from("convenio_sedes")
          .insert({ convenio_id: convenioId, sede_id: (nueva as any).id });
        if (e2) throw e2;
      }
      setShowForm(false); cargarSedes();
    } catch (err: any) {
      alert("❌ " + (err.message || JSON.stringify(err)));
    } finally { setSaving(false); }
  };

  const F = (k: string) => (e: any) =>
    setForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const convFiltrados  = convenios.filter(c =>
    !busqConv || c.name.toLowerCase().includes(busqConv.toLowerCase()));
  const noVinculadas   = todasSedes.filter(s =>
    !sedes.some(sv => sv.id === s.id) &&
    (!busqSede || s.nombre.toLowerCase().includes(busqSede.toLowerCase())));

  const inp = { width:"100%", padding:".65rem .9rem", border:"1.5px solid #DEE2E6",
    borderRadius:8, fontSize:".9rem", outline:"none" as const };
  const lbl = { display:"block" as const, fontWeight:600 as const, fontSize:".85rem", marginBottom:4 };

  return (
    <div style={{ padding:"1.5rem" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1A4F8A,#0D3060)", color:"white",
        padding:"1.5rem 2rem", borderRadius:12, marginBottom:"1.5rem" }}>
        <h2 style={{ margin:0, fontSize:"1.5rem", fontWeight:700 }}>🏛️ Sedes Hospitalarias</h2>
        <p style={{ margin:"0.25rem 0 0", opacity:.85, fontSize:".9rem" }}>
          Gestión de sedes para redes de salud y DIRIS
        </p>
      </div>

      {/* Paso 1: Selector de convenio */}
      <div style={{ background:"white", borderRadius:12, padding:"1.5rem",
        boxShadow:"0 2px 8px rgba(0,0,0,.08)", marginBottom:"1.25rem" }}>
        <h6 style={{ fontWeight:700, color:"#1A4F8A", marginBottom:".75rem" }}>
          1️⃣ Selecciona el convenio
        </h6>
        {convenioId ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:".75rem 1rem", background:"#EBF2FB",
            border:"1.5px solid #B8D0F0", borderRadius:8 }}>
            <span style={{ fontWeight:600, color:"#1A4F8A", fontSize:".9rem" }}>
              ✅ {convenioNombre}
            </span>
            <button onClick={() => { setConvenioId(""); setConvenioNombre(""); setBusqConv(""); }}
              style={{ background:"none", border:"none", cursor:"pointer",
                color:"#DC3545", fontWeight:700, fontSize:"1.1rem" }}>✕</button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:".5rem" }}>
            <input type="text" value={busqConv} onChange={e => setBusqConv(e.target.value)}
              placeholder="🔍  Escribir para filtrar convenios..."
              style={{ ...inp }}/>
            <select value="" onChange={e => {
                if (!e.target.value) return;
                const c = convenios.find(c => c.id === e.target.value);
                setConvenioId(e.target.value);
                setConvenioNombre(c?.name || "");
              }}
              style={{ ...inp }}
              size={Math.min(convFiltrados.length + 1, 7)}>
              <option value="" disabled>
                {loadingConv ? "Cargando..." : `— ${convFiltrados.length} convenio(s) —`}
              </option>
              {convFiltrados.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Paso 2: Verificación tipo institución */}
      {convenioId && instInfo && (
        <>
          {!esRed(instInfo.tipo) ? (
            <div style={{ background:"#FFF3CD", border:"1px solid #FFEAA7",
              borderRadius:12, padding:"1.25rem 1.5rem" }}>
              <h6 style={{ fontWeight:700, color:"#856404", margin:"0 0 .5rem" }}>
                ℹ️ Este convenio no requiere gestión de sedes
              </h6>
              <p style={{ margin:0, fontSize:".88rem", color:"#856404" }}>
                <strong>{instInfo.nombre}</strong> es de tipo <strong>{instInfo.tipo}</strong> —
                institución única. La sede se auto-completa al crear cursos.
              </p>
            </div>
          ) : (
            <>
              {/* Banner tipo Red */}
              <div style={{ background:"#D4EDDA", border:"1px solid #C3E6CB",
                borderRadius:10, padding:".9rem 1.25rem", marginBottom:"1.25rem",
                display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:".75rem" }}>
                <div>
                  <strong style={{ color:"#155724" }}>🌐 {instInfo.nombre}</strong>
                  <span style={{ fontSize:".8rem", color:"#155724", marginLeft:".5rem" }}>
                    ({instInfo.tipo}) — Red con múltiples sedes
                  </span>
                </div>
                <div style={{ display:"flex", gap:".5rem" }}>
                  <button onClick={cargarTodasSedes}
                    style={{ background:"white", color:"#1A4F8A",
                      border:"1px solid #1A4F8A", padding:".55rem 1rem",
                      borderRadius:8, cursor:"pointer", fontSize:".85rem", fontWeight:600 }}>
                    🔗 Vincular existente
                  </button>
                  <button onClick={() => { setEditando(null); setForm({...EMPTY}); setShowForm(true); }}
                    style={{ background:"#1A4F8A", color:"white", border:"none",
                      padding:".55rem 1rem", borderRadius:8, cursor:"pointer", fontSize:".85rem", fontWeight:700 }}>
                    ➕ Crear nueva sede
                  </button>
                </div>
              </div>

              {/* Panel vincular existentes */}
              {showVinc && (
                <div style={{ background:"white", borderRadius:10, border:"1px solid #E9ECEF",
                  padding:"1rem", marginBottom:"1.25rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:".75rem" }}>
                    <strong style={{ fontSize:".9rem", color:"#1A4F8A" }}>
                      Sedes disponibles ({noVinculadas.length})
                    </strong>
                    <button onClick={() => setShowVinc(false)}
                      style={{ background:"none", border:"none", cursor:"pointer",
                        color:"#6C757D", fontSize:"1.1rem" }}>×</button>
                  </div>
                  <input type="text" value={busqSede} onChange={e => setBusqSede(e.target.value)}
                    placeholder="🔍  Filtrar sedes..." style={{ ...inp, marginBottom:".75rem" }}/>
                  <div style={{ maxHeight:260, overflowY:"auto",
                    display:"flex", flexDirection:"column", gap:".35rem" }}>
                    {noVinculadas.map(s => (
                      <div key={s.id} style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", padding:".5rem .75rem",
                        background:"#F8F9FA", borderRadius:7, border:"1px solid #E9ECEF" }}>
                        <div>
                          <span style={{ fontSize:".88rem", fontWeight:500 }}>{s.nombre}</span>
                          <span style={{ fontSize:".75rem", color:"#6C757D", marginLeft:".5rem" }}>
                            {s.tipo}{s.distrito && ` · ${s.distrito}`}
                          </span>
                        </div>
                        <button onClick={() => vincularExistente(s.id)}
                          style={{ background:"#1A4F8A", color:"white", border:"none",
                            padding:".3rem .75rem", borderRadius:6,
                            cursor:"pointer", fontSize:".8rem", fontWeight:600, flexShrink:0 }}>
                          + Vincular
                        </button>
                      </div>
                    ))}
                    {noVinculadas.length === 0 && (
                      <p style={{ color:"#6C757D", fontSize:".85rem",
                        textAlign:"center", padding:".75rem" }}>
                        Todas las sedes ya están vinculadas
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Lista sedes vinculadas */}
              {loading ? (
                <div style={{ textAlign:"center", padding:"2rem" }}>
                  <div className="spinner-border text-primary" role="status"/>
                </div>
              ) : sedes.length === 0 ? (
                <div style={{ background:"white", borderRadius:12, padding:"3rem",
                  textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}>
                  <div style={{ fontSize:"2.5rem" }}>🏥</div>
                  <p style={{ color:"#6C757D", marginTop:".75rem" }}>
                    No hay sedes vinculadas — usa "Vincular existente" o "Crear nueva sede"
                  </p>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
                  {sedes.map(s => (
                    <div key={s.id} style={{ background:"white", borderRadius:12,
                      boxShadow:"0 2px 8px rgba(0,0,0,.08)", padding:"1.1rem",
                      border:"1px solid #E9ECEF" }}>
                      <strong style={{ fontSize:".9rem", color:"#1A1A2E",
                        display:"block", marginBottom:".35rem" }}>{s.nombre}</strong>
                      <div style={{ fontSize:".8rem", color:"#6C757D", marginBottom:".65rem" }}>
                        {s.tipo}{s.distrito && ` · ${s.distrito}`}
                        {s.direccion && <div>{s.direccion}</div>}
                      </div>
                      <div style={{ display:"flex", gap:".4rem" }}>
                        <button onClick={() => { setEditando(s);
                          setForm({ nombre:s.nombre, tipo:s.tipo||"Hospital",
                            direccion:s.direccion||"", distrito:s.distrito||"", activo:s.activo });
                          setShowForm(true); }}
                          className="btn btn-sm btn-outline-secondary">✏️</button>
                        <button onClick={() => desvincular(s.id, s.nombre)}
                          className="btn btn-sm btn-outline-danger">🔗 Desvincular</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal crear/editar */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)",
          zIndex:1050, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:16, width:"100%", maxWidth:500,
            boxShadow:"0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding:"1.25rem 1.75rem", borderBottom:"1px solid #E9ECEF",
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h5 style={{ margin:0, fontWeight:700, color:"#1A4F8A" }}>
                {editando ? "✏️ Editar Sede" : "🏥 Nueva Sede"}
              </h5>
              <button onClick={() => setShowForm(false)}
                style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#6C757D" }}>×</button>
            </div>
            <div style={{ padding:"1.5rem 1.75rem", display:"flex", flexDirection:"column", gap:".9rem" }}>
              <div>
                <label style={lbl}>Nombre <span style={{ color:"#DC3545" }}>*</span></label>
                <input style={inp} value={form.nombre} onChange={F("nombre")}
                  placeholder="Ej: Hospital II Luis Negreiros Vega"/>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <label style={lbl}>Tipo</label>
                  <select style={inp} value={form.tipo} onChange={F("tipo")}>
                    {TIPOS_SEDE.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-6">
                  <label style={lbl}>Distrito</label>
                  <input style={inp} value={form.distrito} onChange={F("distrito")} placeholder="Ej: Callao"/>
                </div>
              </div>
              <div>
                <label style={lbl}>Dirección</label>
                <input style={inp} value={form.direccion} onChange={F("direccion")}
                  placeholder="Ej: Av. Tomás Valle Cdra. 39"/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:".5rem" }}>
                <input type="checkbox" id="activo-cb" checked={form.activo} onChange={F("activo")}
                  style={{ width:16, height:16, cursor:"pointer" }}/>
                <label htmlFor="activo-cb" style={{ cursor:"pointer", fontWeight:600, fontSize:".9rem" }}>
                  Sede activa
                </label>
              </div>
              <div style={{ display:"flex", gap:".75rem", justifyContent:"flex-end" }}>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary" disabled={saving}>
                  Cancelar
                </button>
                <button onClick={guardar} disabled={saving}
                  style={{ background:"#1A4F8A", color:"white", border:"none",
                    padding:".65rem 1.5rem", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
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