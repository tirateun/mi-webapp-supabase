import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  user: any;
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔹 Cargar convenios
  const fetchAgreements = async () => {
    const { data, error } = await supabase.from("agreements").select(`
      id, name, hospital, external_responsible, signature_date, duration_years, expiration_date
    `);
    if (!error) setAgreements(data || []);
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  // 🔹 Crear convenio (solo admin)
  const handleAddAgreement = async () => {
    if (role !== "admin") return alert("No tienes permisos para crear convenios.");

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.from("agreements").insert([
        {
          name,
          hospital,
          external_responsible: externalResponsible,
          signature_date: signatureDate,
          duration_years: durationYears,
          internal_responsible: user.id,
        },
      ]);

      if (error) throw error;

      setSuccess("✅ Convenio creado correctamente.");
      setName("");
      setHospital("");
      setExternalResponsible("");
      setSignatureDate("");
      setDurationYears(1);
      fetchAgreements();
    } catch (err: any) {
      setError("❌ " + err.message);
    }

    setLoading(false);
  };

  // 🔹 Eliminar convenio (solo admin)
  const handleDelete = async (id: string) => {
    if (role !== "admin") return alert("No tienes permisos para eliminar convenios.");

    if (!confirm("¿Deseas eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("❌ Error al eliminar convenio: " + error.message);
    else fetchAgreements();
  };

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>

      {/* Solo visible si es admin */}
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
          <h3>➕ Crear nuevo convenio</h3>
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
          <input
            type="text"
            placeholder="Responsable externo"
            value={externalResponsible}
            onChange={(e) => setExternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <label>📅 Fecha de firma:</label>
          <input
            type="date"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <label>⏳ Duración (años):</label>
          <input
            type="number"
            min="1"
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
            {loading ? "Guardando..." : "Guardar Convenio"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </div>
      )}

      <h3 style={{ marginTop: "30px" }}>📋 Convenios registrados</h3>
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
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>
              Responsable Externo
            </th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fecha Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Duración (años)</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Vencimiento</th>
            {role === "admin" && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={role === "admin" ? 7 : 6} style={{ textAlign: "center" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.hospital}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.external_responsible}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.signature_date}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.duration_years}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.expiration_date}</td>
                {role === "admin" && (
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{
                        background: "red",
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








