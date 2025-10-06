import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  role: string;
}

export default function Agreements({ role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    hospital: "",
    internal_responsible: "",
    external_responsible: "",
    signature_date: "",
    duration_years: 1,
  });

  const fetchAgreements = async () => {
    const { data, error } = await supabase
      .from("agreements")
      .select(
        `
        id,
        name,
        hospital,
        signature_date,
        duration_years,
        expiration_date,
        profiles_internal:internal_responsible(full_name),
        profiles_external:external_responsible(full_name)
      `
      );
    if (!error) setAgreements(data || []);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role");
    if (!error) setProfiles(data || []);
  };

  useEffect(() => {
    fetchAgreements();
    fetchProfiles();
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (role !== "admin") {
      alert("Solo los administradores pueden crear convenios.");
      return;
    }

    const { error } = await supabase.from("agreements").insert([
      {
        name: form.name,
        hospital: form.hospital,
        internal_responsible: form.internal_responsible,
        external_responsible: form.external_responsible,
        signature_date: form.signature_date,
        duration_years: form.duration_years,
      },
    ]);

    if (error) alert("❌ Error al guardar: " + error.message);
    else {
      alert("✅ Convenio guardado correctamente");
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
    if (role !== "admin") {
      alert("Solo los administradores pueden eliminar convenios.");
      return;
    }

    const confirm = window.confirm("¿Seguro que deseas eliminar este convenio?");
    if (!confirm) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("❌ Error al eliminar: " + error.message);
    else {
      alert("✅ Convenio eliminado correctamente");
      fetchAgreements();
    }
  };

  return (
    <div id="convenios">
      <h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        📑 Lista de Convenios
      </h2>

      {role === "admin" && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            background: "#fff",
            maxWidth: "700px",
          }}
        >
          <h3>➕ Crear Convenio</h3>

          <label>Nombre del convenio:</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Nombre del convenio"
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <label>Hospital:</label>
          <input
            type="text"
            name="hospital"
            value={form.hospital}
            onChange={handleChange}
            placeholder="Hospital"
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
            {profiles
              .filter((p) => p.role === "internal" || p.role === "admin")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
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
            {profiles
              .filter((p) => p.role === "external")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
          </select>

          <label>Fecha de firma del convenio:</label>
          <input
            type="date"
            name="signature_date"
            value={form.signature_date}
            onChange={handleChange}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <label>Años de duración:</label>
          <input
            type="number"
            name="duration_years"
            value={form.duration_years}
            onChange={handleChange}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <button
            onClick={handleSubmit}
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
            Guardar Convenio
          </button>
        </div>
      )}

      <h3 style={{ marginTop: "30px" }}>Convenios Registrados</h3>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
          background: "#fff",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Hospital</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Interno</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Externo</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fecha de Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Años Duración</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fecha Vencimiento</th>
            {role === "admin" && <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.hospital}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.profiles_internal?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.profiles_external?.full_name || "-"}
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

};







