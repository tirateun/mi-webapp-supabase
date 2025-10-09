import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface AgreementsFormProps {
  onSave: () => void;
  onCancel: () => void;
  existingAgreement?: any;
}

export default function AgreementsForm({
  onSave,
  onCancel,
  existingAgreement,
}: AgreementsFormProps) {
  const [name, setName] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [convenio, setConvenio] = useState("marco");
  const [pais, setPais] = useState("Perú");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [internalResponsible, setInternalResponsible] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    if (existingAgreement) {
      setName(existingAgreement.name || "");
      setInstitucion(existingAgreement["Institución"] || "");
      setConvenio(existingAgreement.convenio || "marco");
      setPais(existingAgreement.pais || "Perú");
      setSignatureDate(existingAgreement.signature_date || "");
      setDurationYears(existingAgreement.duration_years || 1);
      setInternalResponsible(existingAgreement.internal_responsible || "");
      setExternalResponsible(existingAgreement.external_responsible || "");
    }
  }, [existingAgreement]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role");
    if (!error) setUsers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      "Institución": institucion,
      convenio,
      pais,
      signature_date: signatureDate,
      duration_years: durationYears,
      internal_responsible: internalResponsible,
      external_responsible: externalResponsible,
    };

    let response;
    if (existingAgreement) {
      response = await supabase
        .from("agreements")
        .update(payload)
        .eq("id", existingAgreement.id);
    } else {
      response = await supabase.from("agreements").insert([payload]);
    }

    if (response.error) alert("❌ Error al guardar convenio");
    else {
      alert("✅ Convenio guardado exitosamente");
      onSave();
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        maxWidth: "600px",
        margin: "0 auto",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
        {existingAgreement ? "✏️ Editar Convenio" : "📝 Crear Convenio"}
      </h2>

      <label>Nombre del Convenio:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      <label>Institución:</label>
      <input
        type="text"
        value={institucion}
        onChange={(e) => setInstitucion(e.target.value)}
        required
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      <label>Tipo de Convenio:</label>
      <select
        value={convenio}
        onChange={(e) => setConvenio(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      >
        <option value="marco">Marco</option>
        <option value="específico">Específico</option>
      </select>

      <label>País:</label>
      <select
        value={pais}
        onChange={(e) => setPais(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      >
        {countries.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>

      <label>Responsable Interno:</label>
      <select
        value={internalResponsible}
        onChange={(e) => setInternalResponsible(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      >
        <option value="">Seleccione...</option>
        {users
          .filter((u) => u.role === "internal" || u.role === "admin")
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
      </select>

      <label>Responsable Externo:</label>
      <select
        value={externalResponsible}
        onChange={(e) => setExternalResponsible(e.target.value)}
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      >
        <option value="">Seleccione...</option>
        {users
          .filter((u) => u.role === "external")
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
      </select>

      <label>Fecha de Firma:</label>
      <input
        type="date"
        value={signatureDate}
        onChange={(e) => setSignatureDate(e.target.value)}
        required
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      <label>Duración (años):</label>
      <input
        type="number"
        value={durationYears}
        onChange={(e) => setDurationYears(Number(e.target.value))}
        required
        style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
      />

      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "8px 15px",
            border: "none",
            borderRadius: "6px",
            marginRight: "10px",
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "#9ca3af",
            color: "white",
            padding: "8px 15px",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

