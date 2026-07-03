// src/AlumnosManager.tsx
// Gestión de alumnos: alta individual + importación masiva por Excel
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";

interface Alumno {
  id: string;
  dni: string;
  codigo_universitario: string;
  apellidos: string;
  nombres: string;
  email_institucional: string;
  email_personal: string;
  telefono: string;
}

interface Props { isAdmin?: boolean; }

const EMPTY_FORM = {
  dni: "", codigo_universitario: "", apellidos: "", nombres: "",
  email_institucional: "", email_personal: "", telefono: ""
};

export default function AlumnosManager({ isAdmin = false }: Props) {
  const [alumnos, setAlumnos]     = useState<Alumno[]>([]);
  const [filtrados, setFiltrados] = useState<Alumno[]>([]);
  const [loading, setLoading]     = useState(false);
  const [busqueda, setBusqueda]   = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando]   = useState<Alumno | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [importando, setImportando] = useState(false);
  const [importLog, setImportLog] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { cargar(); }, []);
  useEffect(() => { filtrar(); }, [alumnos, busqueda]);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("alumnos").select("*").order("apellidos");
    setAlumnos(data || []);
    setLoading(false);
  };

  const filtrar = () => {
    if (!busqueda.trim()) { setFiltrados(alumnos); return; }
    const q = busqueda.toLowerCase();
    setFiltrados(alumnos.filter(a =>
      a.apellidos?.toLowerCase().includes(q) ||
      a.nombres?.toLowerCase().includes(q) ||
      a.dni?.includes(q) ||
      a.codigo_universitario?.toLowerCase().includes(q)
    ));
  };

  const abrirNuevo = () => {
    setEditando(null); setForm({ ...EMPTY_FORM }); setShowModal(true);
  };
  const abrirEditar = (a: Alumno) => {
    setEditando(a);
    setForm({
      dni: a.dni || "", codigo_universitario: a.codigo_universitario || "",
      apellidos: a.apellidos || "", nombres: a.nombres || "",
      email_institucional: a.email_institucional || "",
      email_personal: a.email_personal || "", telefono: a.telefono || ""
    });
    setShowModal(true);
  };

  const guardar = async () => {
    if (!form.apellidos.trim() || !form.nombres.trim()) {
      alert("❌ Apellidos y Nombres son obligatorios"); return;
    }
    setSaving(true);
    const payload = { ...form };
    let error;
    if (editando) {
      ({ error } = await supabase.from("alumnos").update(payload).eq("id", editando.id));
    } else {
      ({ error } = await supabase.from("alumnos").insert(payload));
    }
    setSaving(false);
    if (error) { alert("❌ Error: " + error.message); return; }
    setShowModal(false); cargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este alumno? Esta acción no se puede deshacer.")) return;
    await supabase.from("alumnos").delete().eq("id", id);
    cargar();
  };

  // ── Excel: descargar plantilla ──
  const descargarPlantilla = () => {
    const rows = [{ "DNI":"", "Código Unv.":"", "Apellidos":"", "Nombres":"",
      "Email Institucional":"", "Email Personal":"", "Teléfono":"" }];
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [12,15,22,22,32,32,14].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
    XLSX.writeFile(wb, "plantilla_alumnos.xlsx");
  };

  // ── Excel: importar ──
  const importarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImportando(true); setImportLog([]);
    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf);
      const ws  = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      const registros = rows
        .filter(r => r["Apellidos"] && r["Nombres"])
        .map(r => ({
          dni: r["DNI"]?.toString().trim() || null,
          codigo_universitario: r["Código Unv."]?.toString().trim() || null,
          apellidos: r["Apellidos"]?.toString().trim() || "",
          nombres:   r["Nombres"]?.toString().trim() || "",
          email_institucional: r["Email Institucional"]?.toString().trim() || null,
          email_personal:      r["Email Personal"]?.toString().trim() || null,
          telefono:  r["Teléfono"]?.toString().trim() || null,
        }));

      if (registros.length === 0) { alert("No se encontraron filas válidas"); setImportando(false); return; }

      const { error } = await supabase
        .from("alumnos")
        .upsert(registros, { onConflict: "dni", ignoreDuplicates: false });

      if (error) throw error;
      setImportLog([`✅ ${registros.length} alumnos importados/actualizados correctamente`]);
      cargar();
    } catch (err: any) {
      setImportLog(["❌ Error al importar: " + (err.message || err)]);
    } finally {
      setImportando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const F = (k: keyof typeof EMPTY_FORM) => (e: any) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #5B2C6F, #3D1A4F)",
        color: "white", padding: "1.5rem 2rem", borderRadius: 12,
        marginBottom: "1.5rem", display: "flex",
        justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>👩‍🎓 Alumnos</h2>
          <p style={{ margin: "0.25rem 0 0", opacity: .85, fontSize: ".9rem" }}>
            Padrón maestro de estudiantes · {alumnos.length} registros
          </p>
        </div>
        {!isAdmin && (
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <button onClick={descargarPlantilla}
              style={{ background: "rgba(255,255,255,.15)", color: "white", border: "1px solid rgba(255,255,255,.3)",
                padding: ".6rem 1.1rem", borderRadius: 8, cursor: "pointer", fontSize: ".85rem", fontWeight: 600 }}>
              📄 Plantilla Excel
            </button>
            <label style={{ background: "#FDB913", color: "#3D1A4F", border: "none",
              padding: ".6rem 1.1rem", borderRadius: 8, cursor: "pointer", fontSize: ".85rem", fontWeight: 600 }}>
              {importando ? "⏳ Importando..." : "📥 Importar Excel"}
              <input ref={fileRef} type="file" accept=".xlsx,.xls"
                onChange={importarExcel} style={{ display: "none" }} disabled={importando} />
            </label>
            <button onClick={abrirNuevo}
              style={{ background: "white", color: "#3D1A4F", border: "none",
                padding: ".6rem 1.25rem", borderRadius: 8, cursor: "pointer", fontSize: ".9rem", fontWeight: 700 }}>
              ➕ Nuevo Alumno
            </button>
          </div>
        )}
      </div>

      {/* Log de importación */}
      {importLog.length > 0 && (
        <div style={{ background: importLog[0].startsWith("✅") ? "#d4edda" : "#f8d7da",
          color: importLog[0].startsWith("✅") ? "#155724" : "#721c24",
          padding: ".75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: ".9rem" }}>
          {importLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* Buscador */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍  Buscar por nombre, apellido, DNI o código..."
          style={{ width: "100%", maxWidth: 480, padding: ".7rem 1rem",
            border: "2px solid #E9ECEF", borderRadius: 8, fontSize: ".9rem", outline: "none" }}
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner-border text-primary" role="status"/>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ background: "white", borderRadius: 12, padding: "3rem",
          textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: "2.5rem" }}>👩‍🎓</div>
          <p style={{ color: "#6C757D", marginTop: ".75rem" }}>
            {busqueda ? "Sin resultados para esa búsqueda" : "No hay alumnos registrados aún"}
          </p>
          {!isAdmin && !busqueda && (
            <button onClick={abrirNuevo} className="btn btn-primary mt-2">➕ Crear primer alumno</button>
          )}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,.08)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table table-hover mb-0">
              <thead style={{ background: "#F8F9FA" }}>
                <tr>
                  <th>DNI</th><th>Código Unv.</th><th>Apellidos y Nombres</th>
                  <th>Email Institucional</th><th>Teléfono</th>
                  {!isAdmin && <th style={{ width: 90 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(a => (
                  <tr key={a.id}>
                    <td><code style={{ fontSize: ".85rem" }}>{a.dni || "-"}</code></td>
                    <td style={{ fontSize: ".85rem" }}>{a.codigo_universitario || "-"}</td>
                    <td><strong>{a.apellidos}</strong>, {a.nombres}</td>
                    <td style={{ fontSize: ".85rem" }}>{a.email_institucional || "-"}</td>
                    <td style={{ fontSize: ".85rem" }}>{a.telefono || "-"}</td>
                    {!isAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: ".35rem" }}>
                          <button onClick={() => abrirEditar(a)} className="btn btn-sm btn-outline-secondary">✏️</button>
                          <button onClick={() => eliminar(a.id)} className="btn btn-sm btn-outline-danger">🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: ".75rem 1.25rem", background: "#F8F9FA",
            fontSize: ".8rem", color: "#6C757D", borderTop: "1px solid #DEE2E6" }}>
            Mostrando {filtrados.length} de {alumnos.length} alumnos
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          zIndex: 1050, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 600,
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #E9ECEF",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h5 style={{ margin: 0, fontWeight: 700, color: "#3D1A4F" }}>
                {editando ? "✏️ Editar Alumno" : "➕ Registrar nuevo alumno"}
              </h5>
              <button onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem",
                  cursor: "pointer", color: "#6C757D", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "1.5rem 2rem" }}>
              <div className="row g-3">
                {[
                  { label: "DNI", key: "dni", col: 6, ph: "12345678" },
                  { label: "Código Unv.", key: "codigo_universitario", col: 6, ph: "20190001A" },
                  { label: "Apellidos", key: "apellidos", col: 6, ph: "García López", req: true },
                  { label: "Nombres", key: "nombres", col: 6, ph: "María", req: true },
                  { label: "Email institucional", key: "email_institucional", col: 6, ph: "m.garcia@unmsm.edu.pe" },
                  { label: "Email personal", key: "email_personal", col: 6, ph: "maria.garcia@gmail.com" },
                  { label: "Teléfono", key: "telefono", col: 6, ph: "987654321" },
                ].map(f => (
                  <div key={f.key} className={`col-${f.col}`}>
                    <label className="form-label" style={{ fontSize: ".85rem", fontWeight: 600 }}>
                      {f.label}{f.req && <span style={{ color: "#DC3545" }}> *</span>}
                    </label>
                    <input className="form-control" value={(form as any)[f.key]}
                      onChange={F(f.key as any)} placeholder={f.ph} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                <button onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={saving}>Cancelar</button>
                <button onClick={guardar} className="btn btn-primary" disabled={saving}
                  style={{ background: "#5B2C6F", border: "none" }}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}