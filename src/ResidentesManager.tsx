// src/ResidentesManager.tsx
// Gestión de residencias: contenedor + asignación de residentes (con datos propios)
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const getPeriodo = (f: string) => {
  if (!f) return "";
  const [y, m] = f.split("-").map(Number);
  const sy = m >= 10 ? y : y - 1;
  return `OCT ${sy} – SEP ${sy + 1}`;
};
const diffMeses = (i: string, f: string) => {
  const s = new Date(i), e = new Date(f);
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
};

interface Residencia {
  id: string; nombre: string; convenio_id: string;
  subtipo_nombre?: string; sede_nombre?: string;
  fecha_inicio: string; fecha_fin: string; periodo: string; anio: number;
  num_residentes?: number;
}
interface Residente {
  id: string; residencia_id: string; dni: string; codigo_universitario: string;
  apellidos: string; nombres: string; email_institucional: string;
  email_personal: string; telefono: string; especialidad: string; anio_residencia: number;
}
interface Subtipo { id: string; subtipo_nombre: string; }
interface Sede    { id: string; nombre: string; }

interface Props { convenioId: string; convenioNombre: string; isAdmin?: boolean; }

const EMPTY_RES = { nombre:"", subtipoId:"", sedeId:"", fechaInicio:"", fechaFin:"", areaId:"" };
const EMPTY_PER = { dni:"", codigo_universitario:"", apellidos:"", nombres:"",
  email_institucional:"", email_personal:"", telefono:"", especialidad:"", anio_residencia:"1" };

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
  // Modal residentes
  const [residSel, setResidSel]           = useState<Residencia|null>(null);
  const [residentes, setResidentes]       = useState<Residente[]>([]);
  const [showResidentes, setShowResidentes] = useState(false);
  const [showAddRes, setShowAddRes]       = useState(false);
  const [formPer, setFormPer]             = useState({ ...EMPTY_PER });
  const [savingPer, setSavingPer]         = useState(false);

  const TIPOS_UNICOS = ["hospital","clínica","clinica","instituto","policlínico","policlinico"];
  const esUnica = (t:string) => TIPOS_UNICOS.some(x => t?.toLowerCase().includes(x));

  useEffect(() => {
    if (convenioId) { cargar(); cargarSubtipos(); cargarSedes(); cargarInstInfo(); cargarAreas(); }
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

  const guardarResidencia = async () => {
    if (!form.nombre.trim() || !form.fechaInicio || !form.fechaFin) {
      alert("❌ Nombre y fechas son obligatorios"); return;
    }
    const periodo = getPeriodo(form.fechaInicio);
    const anio = parseInt(form.fechaInicio.split("-")[0]);
    const sedeId = form.sedeId || null;
    setSaving(true);
    try {
      const payload = {
        convenio_id: convenioId, nombre: form.nombre.trim(),
        subtipo_id: form.subtipoId || null, sede_id: sedeId,
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

  // Modal residentes
  const abrirResidentes = async (r: Residencia) => {
    setResidSel(r); setShowResidentes(true); setShowAddRes(false);
    setFormPer({ ...EMPTY_PER });
    const { data } = await supabase.from("residentes")
      .select("*").eq("residencia_id", r.id).order("apellidos");
    setResidentes(data || []);
  };

  const guardarResidente = async () => {
    if (!formPer.apellidos.trim() || !formPer.nombres.trim()) {
      alert("❌ Apellidos y nombres son obligatorios"); return;
    }
    setSavingPer(true);
    try {
      const { error } = await supabase.from("residentes").insert({
        residencia_id: residSel!.id, convenio_id: convenioId,
        dni: formPer.dni.trim() || null,
        codigo_universitario: formPer.codigo_universitario.trim() || null,
        apellidos: formPer.apellidos.trim(), nombres: formPer.nombres.trim(),
        email_institucional: formPer.email_institucional.trim() || null,
        email_personal: formPer.email_personal.trim() || null,
        telefono: formPer.telefono.trim() || null,
        especialidad: formPer.especialidad.trim() || null,
        anio_residencia: parseInt(formPer.anio_residencia) || 1,
        fecha_inicio: residSel!.fecha_inicio,
        fecha_fin: residSel!.fecha_fin,
        periodo: residSel!.periodo,
      });
      if (error) throw error;
      setFormPer({ ...EMPTY_PER });
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

  const F  = (k:string) => (e:any) => setForm(f => ({ ...f, [k]: e.target.value }));
  const FP = (k:string) => (e:any) => setFormPer(f => ({ ...f, [k]: e.target.value }));
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
          <button onClick={() => { setEditando(null); setForm({ ...EMPTY_RES }); setShowForm(true); }}
            style={{ background:"white", color:"#0D3060", border:"none", padding:".6rem 1.2rem", borderRadius:8, fontWeight:700, cursor:"pointer" }}>
            ➕ Nueva Residencia
          </button>
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
                      <button onClick={() => { setEditando(r); setForm({ nombre:r.nombre, subtipoId:"", sedeId:"", fechaInicio:r.fecha_inicio, fechaFin:r.fecha_fin }); setShowForm(true); }}
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

      {/* Modal residentes de la residencia */}
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
                          <strong style={{ fontSize:".88rem" }}>{r.apellidos}, {r.nombres}</strong>
                          <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>
                            {r.especialidad || ""} {r.anio_residencia ? `· Año ${r.anio_residencia}` : ""}
                          </span>
                          {r.dni && <span style={{ fontSize:".78rem", color:"#6C757D", marginLeft:".5rem" }}>DNI: {r.dni}</span>}
                        </div>
                        {!isAdmin && (
                          <button onClick={() => eliminarResidente(r.id)} className="btn btn-sm btn-outline-danger" style={{ padding:".2rem .6rem" }}>🗑️</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario agregar residente */}
              {!isAdmin && (
                <>
                  <button onClick={() => setShowAddRes(!showAddRes)}
                    style={{ background:"#1A4F8A", color:"white", border:"none",
                      padding:".6rem 1.2rem", borderRadius:8, fontWeight:600, cursor:"pointer",
                      marginBottom:showAddRes ? "1rem" : 0 }}>
                    {showAddRes ? "✕ Cancelar" : "➕ Agregar Residente"}
                  </button>
                  {showAddRes && (
                    <div style={{ border:"1.5px solid #B8D0F0", borderRadius:12, padding:"1.25rem" }}>
                      <h6 style={{ fontWeight:700, color:"#1A4F8A", marginBottom:"1rem" }}>Datos del residente</h6>
                      <div className="row g-2">
                        {[
                          { label:"DNI", key:"dni", ph:"12345678", col:6 },
                          { label:"Código Unv.", key:"codigo_universitario", ph:"", col:6 },
                          { label:"Apellidos *", key:"apellidos", ph:"García López", col:6 },
                          { label:"Nombres *", key:"nombres", ph:"María", col:6 },
                          { label:"Especialidad", key:"especialidad", ph:"Medicina Interna", col:8 },
                          { label:"Año de Residencia", key:"anio_residencia", ph:"1", col:4, type:"select" },
                          { label:"Email Institucional", key:"email_institucional", ph:"", col:6 },
                          { label:"Email Personal", key:"email_personal", ph:"", col:6 },
                          { label:"Teléfono", key:"telefono", ph:"987654321", col:6 },
                        ].map(f => (
                          <div key={f.key} className={`col-${f.col}`}>
                            <label style={lbl}>{f.label}</label>
                            {f.type === "select" ? (
                              <select style={inp} value={(formPer as any)[f.key]} onChange={FP(f.key)}>
                                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}°</option>)}
                              </select>
                            ) : (
                              <input style={inp} value={(formPer as any)[f.key]}
                                onChange={FP(f.key)} placeholder={f.ph}/>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"1rem" }}>
                        <button onClick={guardarResidente} disabled={savingPer}
                          style={{ background:"#1A4F8A", color:"white", border:"none",
                            padding:".65rem 1.5rem", borderRadius:8, fontWeight:600, cursor:"pointer" }}>
                          {savingPer ? "Guardando..." : "💾 Guardar Residente"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}