import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  role: string;
}

export default function Agreements({ role }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [convenio, setConvenio] = useState("específico");
  const [pais, setPais] = useState("");
  const [internalResponsible, setInternalResponsible] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [profiles, setProfiles] = useState<any[]>([]);

  // 🌎 Lista de países
  const countries = [
    "Perú", "Argentina", "Chile", "México", "Colombia", "Brasil", "Estados Unidos", "España", "Francia", "Italia",
    "Alemania", "Reino Unido", "Japón", "Canadá", "Australia", "China", "India", "Uruguay", "Ecuador", "Bolivia", "Paraguay",
    "Venezuela", "Costa Rica", "Panamá", "Guatemala", "El Salvador", "Honduras", "Nicaragua", "Cuba", "República Dominicana"
  ];

  const fetchAgreements = async () => {
    const { data, error } = await supabase.from("agreements").select(`
      id, name, institucion, convenio, pais, internal_responsible, external_responsible,
      signature_date, duration_years, expiration_date
    `);
    if (!error) setAgreements(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name", { ascending: true });
    setProfiles(data || []);
  };

  useEffect(() => {
    fetchAgreements();
    fetchProfiles();
  }, []);

  const handleAddAgreement = async () => {
    if (!name || !institucion || !signatureDate || !internalResponsible || !externalResponsible || !pais) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    const { error } = await supabase.from("agreements").insert([
      {
        name,
        institucion,
        convenio,
        pais,
        internal_responsible: internalResponsible,
        external_responsible: externalResponsible,
        signature_date: signatureDate,
        duration_years: durationYears,
      },
    ]);

    if (error) {
      alert("Error al crear convenio: " + error.message);
    } else {
      alert("✅ Convenio creado exitosamente");
      setName("");
      setInstitucion("");
      setConvenio("específico");
      setPais("");
      setInternalResponsible("");
      setExternalResponsible("");
      setSignatureDate("");
      setDurationYears(1);
      fetchAgreements();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("Error al eliminar: " + error.message);
    else fetchAgreements();
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
            background: "#f9f9f9",
            maxWidth: "700px",
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
            placeholder="Institución"
            value={institucion}
            onChange={(e) => setInstitucion(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

          {/* Tipo de convenio */}
          <label>Tipo de convenio:</label>
          <select
            value={convenio}
            onChange={(e) => setConvenio(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="específico">Específico</option>
            <option value="marco">Marco</option>
          </select>

          {/* País */}
          <label>País:</label>
          <select
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccione un país</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Responsables */}
          <label>Responsable interno:</label>
          <select
            value={internalResponsible}
            onChange={(e) => setInternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccione...</option>
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
            value={externalResponsible}
            onChange={(e) => setExternalResponsible(e.target.value)}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          >
            <option value="">Seleccione...</option>
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

          <label>Años de duración:</label>
          <input
            type="number"
            min={1}
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value))}
            style={{ margin: "5px", padding: "8px", width: "100%" }}
          />

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
            Guardar convenio
          </button>
        </div>
      )}

      {/* Tabla de convenios */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Institución</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Tipo</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>País</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Interno</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Externo</th>
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
              <td colSpan={9} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.institucion}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.convenio}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.pais}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.internal_responsible}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.external_responsible}</td>
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
                        padding: "6px 10px",
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













