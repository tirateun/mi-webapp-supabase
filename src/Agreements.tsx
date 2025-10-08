import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  user: any;
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [internalResponsible, setInternalResponsible] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);

  // ✅ Traer convenios
  const fetchAgreements = async () => {
    let query = supabase.from("agreements").select(`
      id, name, institution, signature_date, duration_years, expiration_date,
      profiles!agreements_internal_responsible_fkey(full_name),
      external_profiles:profiles!agreements_external_responsible_fkey(full_name)
    `);

    // 🧩 Filtrar por rol
    if (role !== "admin") {
      query = query.or(
        `internal_responsible.eq.${user.id},external_responsible.eq.${user.id}`
      );
    }

    const { data, error } = await query;
    if (error) console.error(error);
    else setAgreements(data || []);
  };

  // ✅ Traer lista de usuarios (para desplegables)
  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name, role");
    if (!error) setProfiles(data || []);
  };

  useEffect(() => {
    fetchAgreements();
    fetchProfiles();
  }, []);

  // ✅ Crear convenio
  const handleAddAgreement = async () => {
    setError("");
    setSuccess("");

    if (!name || !institution || !signatureDate || !internalResponsible || !externalResponsible) {
      setError("Por favor completa todos los campos.");
      return;
    }

    const { error } = await supabase.from("agreements").insert([
      {
        name,
        institution,
        internal_responsible: internalResponsible,
        external_responsible: externalResponsible,
        signature_date: signatureDate,
        duration_years: durationYears,
      },
    ]);

    if (error) {
      console.error(error);
      setError("Error al guardar convenio.");
    } else {
      setSuccess("✅ Convenio guardado correctamente.");
      setName("");
      setInstitution("");
      setInternalResponsible("");
      setExternalResponsible("");
      setSignatureDate("");
      setDurationYears(1);
      fetchAgreements();
    }
  };

  // ✅ Eliminar convenio (solo admin)
  const handleDeleteAgreement = async (id: string) => {
    if (role !== "admin") {
      setError("Solo el administrador puede eliminar convenios.");
      return;
    }

    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) {
      console.error(error);
      setError("Error al eliminar convenio.");
    } else {
      setSuccess("🗑️ Convenio eliminado correctamente.");
      fetchAgreements();
    }
  };

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>

      {/* 🔹 Crear convenio (solo admin) */}
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
            placeholder="Nombre del convenio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <input
            type="text"
            placeholder="Institución"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <label>📅 Fecha de firma:</label>
          <input
            type="date"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <label>📆 Duración (años):</label>
          <input
            type="number"
            value={durationYears}
            min="1"
            onChange={(e) => setDurationYears(parseInt(e.target.value))}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          <label>👤 Responsable interno:</label>
          <select
            value={internalResponsible}
            onChange={(e) => setInternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccionar</option>
            {profiles
              .filter((p) => p.role === "internal" || p.role === "admin")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
          </select>

          <label>👥 Responsable externo:</label>
          <select
            value={externalResponsible}
            onChange={(e) => setExternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccionar</option>
            {profiles
              .filter((p) => p.role === "external")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
          </select>

          <button
            onClick={handleAddAgreement}
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
            Guardar
          </button>

          {error && <p style={{ color: "red" }}>❌ {error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}
        </div>
      )}

      {/* 🔹 Tabla de convenios */}
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
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Institución</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Interno</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Externo</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Años</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Vencimiento</th>
            {role === "admin" && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>
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
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.institution}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.profiles?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.external_profiles?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.signature_date}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.duration_years}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.expiration_date}</td>
                {role === "admin" && (
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <button
                      onClick={() => handleDeleteAgreement(a.id)}
                      style={{
                        padding: "5px 10px",
                        background: "red",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
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














