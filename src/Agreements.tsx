import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// Props que recibe el componente
interface AgreementsProps {
  user: any; // session.user del Supabase (contiene id)
  role: string;
}

export default function Agreements({ user, role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [internalUsers, setInternalUsers] = useState<any[]>([]);

  // Formulario
  const [name, setName] = useState("");
  const [hospital, setHospital] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [selectedInternal, setSelectedInternal] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cargar convenios
  const fetchAgreements = async () => {
    const { data, error } = await supabase
      .from("agreements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setAgreements(data);
    // no mostramos error aquí para no molestar al usuario (si quieres, lo muestras)
  };

  // Cargar usuarios internos (para el select)
  const fetchInternalUsers = async () => {
    // Tomamos usuarios con rol internal o admin para poder asignarlos
    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,role")
      .in("role", ["internal", "admin"])
      .order("full_name", { ascending: true });

    if (!error && data) setInternalUsers(data);
  };

  useEffect(() => {
    fetchAgreements();
    fetchInternalUsers();
    // por defecto seleccionar al usuario logueado (si existe)
    if (user?.id) {
      setSelectedInternal(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Crear convenio (solo admin puede)
  const handleAddAgreement = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (role !== "admin") {
        throw new Error("No tienes permisos para crear convenios.");
      }

      if (!name || !hospital || !externalResponsible || !signatureDate) {
        throw new Error("Completa todos los campos requeridos.");
      }

      // selectedInternal puede ser null — recomendamos siempre asignar uno
      const internal_responsible = selectedInternal || user?.id || null;

      const { error } = await supabase.from("agreements").insert([
        {
          name,
          hospital,
          external_responsible: externalResponsible,
          signature_date: signatureDate,
          duration_years: durationYears,
          internal_responsible,
        },
      ]);

      if (error) throw error;

      setSuccess("✅ Convenio creado correctamente.");
      // limpiar formulario
      setName("");
      setHospital("");
      setExternalResponsible("");
      setSignatureDate("");
      setDurationYears(1);
      setSelectedInternal(user?.id || null);
      await fetchAgreements();
    } catch (err: any) {
      setError(err.message || "Error al crear convenio");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar (solo admin)
  const handleDelete = async (id: string) => {
    if (role !== "admin") {
      alert("No tienes permisos para eliminar convenios.");
      return;
    }
    if (!confirm("¿Eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("❌ Error al eliminar: " + error.message);
    else fetchAgreements();
  };

  // Mapa id -> nombre para mostrar responsable interno
  const internalMap = new Map(internalUsers.map((u) => [u.id, u.full_name]));

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>

      {/* Formulario visible solo para admin */}
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

          <label>Responsable externo</label>
          <input
            type="text"
            placeholder="Nombre del responsable externo"
            value={externalResponsible}
            onChange={(e) => setExternalResponsible(e.target.value)}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
          />

          <label>Responsable interno (asignar)</label>
          <select
            value={selectedInternal ?? ""}
            onChange={(e) => setSelectedInternal(e.target.value || null)}
            style={{ display: "block", width: "100%", margin: "6px 0", padding: "8px" }}
          >
            <option value="">{user?.id ? "Asignar a (por defecto: tú)" : "Selecciona un usuario"}</option>
            {internalUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} {u.role === "admin" ? "(admin)" : ""}
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
            <th style={{ border: "1px solid #ccc', padding: '8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc', padding: '8px" }}>Hospital</th>
            <th style={{ border: "1px solid #ccc', padding: '8px" }}>Responsable Externo</th>
            <th style={{ border: "1px solid #ccc', padding: '8px" }}>Responsable Interno</th>
            <th style={{ border: "1px solid #ccc', padding: '8px" }}>Fecha de Firma</th>
            <th style={{ border: "1px solid #ccc', padding: '8px" }}>Duración (años)</th>
            <th style={{ border: "1px solid #ccc', padding: '8px" }}>Vencimiento</th>
            {role === "admin" && <th style={{ border: "1px solid #ccc', padding: '8px" }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={role === "admin" ? 8 : 7} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc', padding: '8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc', padding: '8px" }}>{a.hospital}</td>
                <td style={{ border: "1px solid #ccc', padding: '8px" }}>{a.external_responsible}</td>
                <td style={{ border: "1px solid #ccc', padding: '8px" }}>
                  {a.internal_responsible ? internalMap.get(a.internal_responsible) ?? a.internal_responsible : "-"}
                </td>
                <td style={{ border: "1px solid #ccc', padding: '8px" }}>{a.signature_date}</td>
                <td style={{ border: "1px solid #ccc', padding: '8px" }}>{a.duration_years}</td>
                <td style={{ border: "1px solid #ccc', padding: '8px" }}>{a.expiration_date}</td>
                {role === "admin" && (
                  <td style={{ border: "1px solid #ccc', padding: '8px" }}>
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










