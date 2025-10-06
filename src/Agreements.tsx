import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  user: any;
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
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
    let query = supabase
      .from("agreements")
      .select(
        `
        id,
        name,
        hospital,
        signature_date,
        duration_years,
        expiration_date,
        internal_responsible(id, full_name),
        external_responsible(id, full_name)
      `
      )
      .order("created_at", { ascending: false });

    // Si no es admin, solo mostrar convenios donde es responsable
    if (role !== "admin") {
      query = query.or(
        `internal_responsible.eq.${user.id},external_responsible.eq.${user.id}`
      );
    }

    const { data, error } = await query;
    if (!error) setAgreements(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role");
    if (!error) setUsers(data || []);
  };

  useEffect(() => {
    fetchAgreements();
    fetchUsers();
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddAgreement = async () => {
    setLoading(true);
    const { error } = await supabase.from("agreements").insert([
      {
        name: form.name,
        hospital: form.hospital,
        signature_date: form.signature_date,
        duration_years: form.duration_years,
        internal_responsible: form.internal_responsible || null,
        external_responsible: form.external_responsible || null,
      },
    ]);

    if (!error) {
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

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (!error) fetchAgreements();
  };

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>

      {/* ✅ Solo admins pueden crear convenios */}
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
          <h3>➕ Crear Convenio</h3>
          <input
            type="text"
            name="name"
            placeholder="Nombre del convenio"
            value={form.name}
            onChange={handleChange}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="text"
            name="hospital"
            placeholder="Hospital"
            value={form.hospital}
            onChange={handleChange}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <label>Responsable interno:</label>
          <select
            name="internal_responsible"
            value={form.internal_responsible}
            onChange={handleChange}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccionar...</option>
            {users
              .filter((u) => u.role === "internal" || u.role === "admin")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
          </select>

          <label>Responsable externo:</label>
          <select
            name="external_responsible"
            value={form.external_responsible}
            onChange={handleChange}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccionar...</option>
            {users
              .filter((u) => u.role === "external")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
          </select>

          <input
            type="date"
            name="signature_date"
            value={form.signature_date}
            onChange={handleChange}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="number"
            name="duration_years"
            placeholder="Duración (años)"
            value={form.duration_years}
            onChange={handleChange}
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
            {loading ? "Guardando..." : "Guardar Convenio"}
          </button>
        </div>
      )}

      {/* ✅ Tabla de convenios */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "30px",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Hospital</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Responsable Interno
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Responsable Externo
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Fecha Firma
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Años Duración
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Fecha Vencimiento
            </th>
            {role === "admin" && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.hospital}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.internal_responsible?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.external_responsible?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.signature_date}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.duration_years}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.expiration_date}
                </td>
                {role === "admin" && (
                  <td
                    style={{
                      border: "1px solid #ccc",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Eliminar
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






