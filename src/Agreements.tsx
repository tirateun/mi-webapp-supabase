import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Agreements({ user }: { user: any }) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [internalResponsible, setInternalResponsible] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🧠 Determinar si el usuario es admin
  const isAdmin = user?.user_metadata?.role === "admin" || user?.role === "admin";

  // 📌 Traer convenios según el rol
  const fetchAgreements = async () => {
    setError("");
    let query = supabase.from("agreements").select(`
      id,
      name,
      hospital,
      signature_date,
      duration_years,
      expiration_date,
      internal_responsible:internal_responsible(full_name, id),
      external_responsible:external_responsible(full_name, id)
    `);

    if (!isAdmin) {
      query = query.or(
        `internal_responsible.eq.${user.id},external_responsible.eq.${user.id}`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("❌ Error al traer convenios:", error.message);
      setError(error.message);
    } else {
      setAgreements(data || []);
    }
  };

  // 📌 Cargar usuarios disponibles
  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name, role");
    if (!error) setProfiles(data || []);
  };

  useEffect(() => {
    fetchProfiles();
    fetchAgreements();
  }, []);

  // 📌 Crear un nuevo convenio
  const handleAddAgreement = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.from("agreements").insert([
        {
          name,
          hospital,
          internal_responsible: internalResponsible,
          external_responsible: externalResponsible,
          signature_date: signatureDate,
          duration_years: durationYears,
        },
      ]);

      if (error) throw error;

      setSuccess("✅ Convenio agregado correctamente");
      setName("");
      setHospital("");
      setInternalResponsible("");
      setExternalResponsible("");
      setSignatureDate("");
      setDurationYears(1);
      fetchAgreements();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  // 📌 Eliminar convenio (solo admin)
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) {
      alert("❌ Error al eliminar: " + error.message);
    } else {
      fetchAgreements();
    }
  };

  return (
    <div id="convenios" style={{ padding: "20px" }}>
      <h2>📑 Lista de Convenios</h2>

      {/* Solo admin puede crear convenios */}
      {isAdmin && (
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="text"
            placeholder="Hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <label>Responsable Interno:</label>
          <select
            value={internalResponsible}
            onChange={(e) => setInternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">-- Selecciona interno --</option>
            {profiles
              .filter((p) => p.role === "internal" || p.role === "admin")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
          </select>

          <label>Responsable Externo:</label>
          <select
            value={externalResponsible}
            onChange={(e) => setExternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">-- Selecciona externo --</option>
            {profiles
              .filter((p) => p.role === "external")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
          </select>

          <label>Fecha de firma:</label>
          <input
            type="date"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <label>Duración (años):</label>
          <input
            type="number"
            min={1}
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value))}
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
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Interno</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Externo</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Duración</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Vencimiento</th>
            {isAdmin && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acción</th>
            )}
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
                  {a.internal_responsible?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.external_responsible?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.signature_date}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.duration_years}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.expiration_date}</td>
                {isAdmin && (
                  <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
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


