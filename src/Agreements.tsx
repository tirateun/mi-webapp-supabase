import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  user: any;
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [internals, setInternals] = useState<any[]>([]);
  const [externals, setExternals] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    hospital: "",
    internal_responsible: "",
    external_responsible: "",
    signature_date: "",
    duration_years: 1,
  });
  const [loading, setLoading] = useState(false);

  const fetchAgreements = async () => {
    const { data } = await supabase.from("agreements").select(`
      id, name, hospital, signature_date, duration_years, expiration_date,
      internal_responsible (full_name),
      external_responsible (full_name)
    `);
    setAgreements(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, role");
    if (data) {
      setInternals(data.filter((p) => p.role === "internal"));
      setExternals(data.filter((p) => p.role === "external"));
    }
  };

  useEffect(() => {
    fetchAgreements();
    fetchProfiles();
  }, []);

  const handleSubmit = async () => {
    if (role !== "admin") return alert("Solo los administradores pueden crear convenios.");

    setLoading(true);
    const { error } = await supabase.from("agreements").insert([form]);
    setLoading(false);
    if (!error) {
      alert("✅ Convenio guardado correctamente.");
      setForm({
        name: "",
        hospital: "",
        internal_responsible: "",
        external_responsible: "",
        signature_date: "",
        duration_years: 1,
      });
      fetchAgreements();
    }
  };

  const handleDelete = async (id: string) => {
    if (role !== "admin") return alert("Solo los administradores pueden eliminar convenios.");
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;
    await supabase.from("agreements").delete().eq("id", id);
    fetchAgreements();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📋 Lista de Convenios</h2>

      {role === "admin" && (
        <div style={card}>
          <h3>➕ Crear Convenio</h3>
          <label>Nombre del convenio:</label>
          <input style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>Hospital:</label>
          <input style={input} value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} />

          <label>Responsable interno:</label>
          <select
            style={input}
            value={form.internal_responsible}
            onChange={(e) => setForm({ ...form, internal_responsible: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {internals.map((i) => (
              <option key={i.id} value={i.id}>{i.full_name}</option>
            ))}
          </select>

          <label>Responsable externo:</label>
          <select
            style={input}
            value={form.external_responsible}
            onChange={(e) => setForm({ ...form, external_responsible: e.target.value })}
          >
            <option value="">Seleccionar...</option>
            {externals.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>

          <label>📅 Fecha de firma:</label>
          <input type="date" style={input} value={form.signature_date} onChange={(e) => setForm({ ...form, signature_date: e.target.value })} />

          <label>⏳ Años de duración:</label>
          <input type="number" min="1" style={input} value={form.duration_years} onChange={(e) => setForm({ ...form, duration_years: Number(e.target.value) })} />

          <button style={btn} onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Convenio"}
          </button>
        </div>
      )}

      <table style={table}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Hospital</th>
            <th>Responsable Interno</th>
            <th>Responsable Externo</th>
            <th>Fecha Firma</th>
            <th>Años Duración</th>
            <th>Fecha Vencimiento</th>
            {role === "admin" && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr><td colSpan={8}>No hay convenios registrados.</td></tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.hospital}</td>
                <td>{a.internal_responsible?.full_name || "-"}</td>
                <td>{a.external_responsible?.full_name || "-"}</td>
                <td>{a.signature_date}</td>
                <td>{a.duration_years}</td>
                <td>{a.expiration_date}</td>
                {role === "admin" && (
                  <td>
                    <button style={delBtn} onClick={() => handleDelete(a.id)}>Eliminar</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const input = {
  width: "100%",
  padding: "8px",
  margin: "5px 0 10px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const btn = {
  backgroundColor: "#3b82f6",
  color: "white",
  border: "none",
  padding: "10px",
  borderRadius: "6px",
  width: "100%",
  cursor: "pointer",
};

const delBtn = {
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};

const table = {
  width: "100%",
  marginTop: "20px",
  borderCollapse: "collapse" as const,
};

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  maxWidth: "600px",
  marginBottom: "30px",
};







