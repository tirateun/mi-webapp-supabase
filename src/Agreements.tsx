import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  user: any;
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    hospital: "",
    internal_responsible: "",
    external_responsible: "",
    signature_date: "",
    duration_years: 1,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Cargar convenios según rol
  const fetchAgreements = async () => {
    let query = supabase.from("agreements").select(`
      *,
      profiles:internal_responsible(full_name)
    `);

    if (role !== "admin") {
      query = query.or(
        `internal_responsible.eq.${user.id},external_responsible.eq.${user.id}`
      );
    }

    const { data, error } = await query;
    if (!error) setAgreements(data || []);
  };

  // Cargar responsables internos
  const fetchInternalUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "internal");
    if (!error) setInternalUsers(data || []);
  };

  useEffect(() => {
    fetchAgreements();
    fetchInternalUsers();
  }, []);

  // Crear convenio (solo admin)
  const handleAddAgreement = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.from("agreements").insert([
        {
          name: form.name,
          hospital: form.hospital,
          internal_responsible: form.internal_responsible,
          external_responsible: user.id,
          signature_date: form.signature_date,
          duration_years: form.duration_years,
        },
      ]);
      if (error) throw error;

      setSuccess("✅ Convenio agregado exitosamente");
      setForm({
        name: "",
        hospital: "",
        internal_responsible: "",
        external_responsible: "",
        signature_date: "",
        duration_years: 1,
      });
      fetchAgreements();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  // Eliminar convenio (solo admin)
  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (!error) {
      setAgreements(agreements.filter((a) => a.id !== id));
    } else {
      alert("Error al eliminar convenio");
    }
  };

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>

      {role === "admin" && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            maxWidth: "600px",
          }}
        >
          <h3>➕ Agregar Convenio</h3>
          <input
            type="text"
            placeholder="Nombre del convenio"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="text"
            placeholder="Hospital"
            value={form.hospital}
            onChange={(e) => setForm({ ...form, hospital: e.target.value })}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <select
            value={form.internal_responsible}
            onChange={(e) =>
              setForm({ ...form, internal_responsible: e.target.value })
            }
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccionar responsable interno</option>
            {internalUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.signature_date}
            onChange={(e) =>
              setForm({ ...form, signature_date: e.target.value })
            }
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="number"
            placeholder="Duración (años)"
            value={form.duration_years}
            onChange={(e) =>
              setForm({ ...form, duration_years: Number(e.target.value) })
            }
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <button
            onClick={handleAddAgreement}
            disabled={loading}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          {error && <p style={{ color: "red" }}>❌ {error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </div>
      )}

      <h3 style={{ marginTop: "30px" }}>Convenios Registrados</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Hospital</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Interno</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fecha Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Duración</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Vencimiento</th>
            {role === "admin" && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={role === "admin" ? 7 : 6} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.hospital}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.profiles?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.signature_date}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.duration_years}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.expiration_date}</td>
                {role === "admin" && (
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "6px 10px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Eliminar
                    </button>
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





