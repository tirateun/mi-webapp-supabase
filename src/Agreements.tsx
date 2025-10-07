import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  user: any;
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [externalUsers, setExternalUsers] = useState<any[]>([]);

  // Formulario
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [selectedInternal, setSelectedInternal] = useState<string | null>(null);
  const [selectedExternal, setSelectedExternal] = useState<string | null>(null);
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🧭 Cargar convenios
  const fetchAgreements = async () => {
    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setAgreements(data);
  };

  // 🧭 Cargar usuarios internos
  const fetchInternalUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,role")
      .in("role", ["internal", "admin"])
      .order("full_name", { ascending: true });
    if (!error && data) setInternalUsers(data);
  };

  // 🧭 Cargar usuarios externos
  const fetchExternalUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,role")
      .eq("role", "external")
      .order("full_name", { ascending: true });
    if (!error && data) setExternalUsers(data);
  };

  useEffect(() => {
    fetchAgreements();
    fetchInternalUsers();
    fetchExternalUsers();

    if (user?.id) setSelectedInternal(user.id);
  }, [user]);

  // 📝 Crear convenio
  const handleAddAgreement = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (role !== "admin") throw new Error("No tienes permisos para crear convenios.");
      if (!name || !hospital || !selectedInternal || !selectedExternal || !signatureDate)
        throw new Error("Completa todos los campos requeridos.");

      const { error } = await supabase.from("agreements").insert([
        {
          name,
          hospital,
          internal_responsible: selectedInternal,
          external_responsible: selectedExternal,
          signature_date: signatureDate,
          duration_years: durationYears,
        },
      ]);
      if (error) throw error;

      setSuccess("✅ Convenio creado correctamente.");
      setName("");
      setHospital("");
      setSignatureDate("");
      setDurationYears(1);
      setSelectedExternal(null);
      setSelectedInternal(user?.id || null);
      await fetchAgreements();
    } catch (err: any) {
      setError(err.message || "Error al crear convenio.");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Eliminar convenio
  const handleDelete = async (id: string) => {
    if (role !== "admin") return alert("No tienes permisos para eliminar convenios.");
    if (!confirm("¿Eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("❌ Error al eliminar: " + error.message);
    else fetchAgreements();
  };

  // Mapas de nombres para mostrar
  const internalMap = new Map(internalUsers.map((u) => [u.id, u.full_name]));
  const externalMap = new Map(externalUsers.map((u) => [u.id, u.full_name]));

  return (
    <div id="convenios" style={{ padding: "20px" }}>
      <h2>📑 Lista de Convenios</h2>

      {/* 📋 Formulario visible solo para admin */}
      {role === "admin" && (
        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "10px",
            maxWidth: "700px",
          }}
        >
          <h3>➕ Crear nuevo convenio</h3>

          <label>Nombre del convenio</label>
          <input
            type="text"
            placeholder="Ej. Convenio con Hospital San Juan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
          />

          <label>Hospital</label>
          <input
            type="text"
            placeholder="Nombre del hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
          />

          <label>Responsable interno</label>
          <select
            value={selectedInternal ?? ""}
            onChange={(e) => setSelectedInternal(e.target.value || null)}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
          >
            <option value="">Selecciona un responsable interno</option>
            {internalUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} {u.role === "admin" ? "(admin)" : ""}
              </option>
            ))}
          </select>

          <label>Responsable externo</label>
          <select
            value={selectedExternal ?? ""}
            onChange={(e) => setSelectedExternal(e.target.value || null)}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
          >
            <option value="">Selecciona un responsable externo</option>
            {externalUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>

          <label>📅 Fecha de firma</label>
          <input
            type="date"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
          />

          <label>⏳ Duración (años)</label>
          <input
            type="number"
            min={1}
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value))}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
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
            {loading ? "Guardando..." : "Guardar convenio"}
          </button>

          {error && <p style={{ color: "red", marginTop: 8 }}>{error}</p>}
          {success && <p style={{ color: "green", marginTop: 8 }}>{success}</p>}
        </div>
      )}

      {/* 📊 Tabla de convenios */}
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
            <th>Nombre</th>
            <th>Hospital</th>
            <th>Responsable Interno</th>
            <th>Responsable Externo</th>
            <th>Fecha de Firma</th>
            <th>Duración (años)</th>
            {role === "admin" && <th>Acciones</th>}
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
                <td>{a.name}</td>
                <td>{a.hospital}</td>
                <td>{internalMap.get(a.internal_responsible) ?? "-"}</td>
                <td>{externalMap.get(a.external_responsible) ?? "-"}</td>
                <td>{a.signature_date}</td>
                <td>{a.duration_years}</td>
                {role === "admin" && (
                  <td>
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











