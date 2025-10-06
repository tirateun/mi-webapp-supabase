import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Agreements() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // Campos del formulario
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  // 🧭 Obtener usuario actual y su rol
  const fetchUserRole = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const email = session?.user?.email;
    if (!email) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .single();

    if (!error && data) setUserRole(data.role);
  };

  const fetchAgreements = async () => {
    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .order("id", { ascending: true });
    if (!error) setAgreements(data || []);
  };

  useEffect(() => {
    fetchUserRole();
    fetchAgreements();
  }, []);

  const handleAddAgreement = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!name || !hospital) {
      setError("El nombre y el hospital son obligatorios.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("agreements").insert([
      {
        name,
        hospital,
        external_responsible: externalResponsible,
        signature_date: signatureDate,
        duration_years: durationYears ? parseInt(durationYears) : null,
        expiration_date: expirationDate,
      },
    ]);

    if (error) {
      setError("❌ Error al guardar convenio: " + error.message);
    } else {
      setSuccess("✅ Convenio registrado exitosamente");
      setName("");
      setHospital("");
      setExternalResponsible("");
      setSignatureDate("");
      setDurationYears("");
      setExpirationDate("");
      fetchAgreements();
    }

    setLoading(false);
  };

  const handleDeleteAgreement = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) {
      alert("❌ Error al eliminar: " + error.message);
    } else {
      alert("✅ Convenio eliminado correctamente");
      fetchAgreements();
    }
  };

  return (
    <div id="convenios" style={{ padding: "20px" }}>
      <h2>📑 Lista de Convenios</h2>

      {/* Solo los admin pueden registrar convenios */}
      {userRole === "admin" && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            maxWidth: "600px",
          }}
        >
          <h3>➕ Registrar Nuevo Convenio</h3>

          <input
            type="text"
            placeholder="Nombre del Convenio"
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
            placeholder="Responsable Externo"
            value={externalResponsible}
            onChange={(e) => setExternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="date"
            placeholder="Fecha de Firma"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="number"
            placeholder="Años de duración"
            value={durationYears}
            onChange={(e) => setDurationYears(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />
          <input
            type="date"
            placeholder="Fecha de vencimiento"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <button
            onClick={handleAddAgreement}
            disabled={loading}
            style={{
              marginTop: "10px",
              padding: "10px",
              background: "#10b981",
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

      {/* TABLA DE CONVENIOS */}
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
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Externo</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Duración</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Vencimiento</th>
            {userRole === "admin" && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={userRole === "admin" ? 7 : 6} style={{ textAlign: "center", padding: "10px" }}>
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
                {userRole === "admin" && (
                  <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                    <button
                      onClick={() => handleDeleteAgreement(a.id)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
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


