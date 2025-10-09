import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface AgreementsFormProps {
  user: any;
  onSave: () => void;
  onCancel: () => void;
  existingAgreement?: any; // ✅ Permite editar si se pasa un acuerdo existente
}

export default function AgreementsForm({
  user,
  onSave,
  onCancel,
  existingAgreement,
}: AgreementsFormProps) {
  const [name, setName] = useState(existingAgreement?.name || "");
  const [institucion, setInstitucion] = useState(existingAgreement?.["Institución"] || "");
  const [convenio, setConvenio] = useState(existingAgreement?.convenio || "marco");
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [signatureDate, setSignatureDate] = useState(
    existingAgreement?.signature_date || ""
  );
  const [durationYears, setDurationYears] = useState(
    existingAgreement?.duration_years || 1
  );
  const [internalResponsible, setInternalResponsible] = useState(
    existingAgreement?.internal_responsible || ""
  );
  const [externalResponsible, setExternalResponsible] = useState(
    existingAgreement?.external_responsible || ""
  );
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [externalUsers, setExternalUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name, role");
    if (error) console.error("Error al cargar usuarios:", error);
    else {
      setInternalUsers(data.filter((u) => u.role === "internal" || u.role === "admin"));
      setExternalUsers(data.filter((u) => u.role === "external"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agreementData = {
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
      // 🟢 Editar convenio existente
      response = await supabase
        .from("agreements")
        .update(agreementData)
        .eq("id", existingAgreement.id);
    } else {
      // 🟢 Crear nuevo convenio
      response = await supabase.from("agreements").insert([agreementData]);
    }

    const { error } = response;
    if (error) {
      alert("❌ Error al guardar convenio: " + error.message);
    } else {
      alert(existingAgreement ? "✅ Convenio actualizado correctamente" : "✅ Convenio creado correctamente");
      onSave();
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#2B6CB0",
        }}
      >
        {existingAgreement ? "✏️ Editar Convenio" : "📝 Crear Nuevo Convenio"}
      </h2>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Nombre del Convenio</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Institución</label>
        <input
          type="text"
          value={institucion}
          onChange={(e) => setInstitucion(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Tipo de Convenio</label>
        <select
          value={convenio}
          onChange={(e) => setConvenio(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="marco">Marco</option>
          <option value="específico">Específico</option>
        </select>

        <label style={labelStyle}>País</label>
        <select
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">Seleccione un país</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Responsable Interno</label>
        <select
          value={internalResponsible}
          onChange={(e) => setInternalResponsible(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">Seleccione</option>
          {internalUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Responsable Externo</label>
        <select
          value={externalResponsible}
          onChange={(e) => setExternalResponsible(e.target.value)}
          required
          style={inputStyle}
        >
          <option value="">Seleccione</option>
          {externalUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Fecha de Firma</label>
        <input
          type="date"
          value={signatureDate}
          onChange={(e) => setSignatureDate(e.target.value)}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Duración (en años)</label>
        <input
          type="number"
          min="1"
          value={durationYears}
          onChange={(e) => setDurationYears(Number(e.target.value))}
          required
          style={inputStyle}
        />

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            type="submit"
            style={{
              background: "#3B82F6",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            {existingAgreement ? "Guardar Cambios" : "Crear Convenio"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "#CBD5E0",
              color: "#2D3748",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginTop: "10px",
  fontWeight: "bold",
  color: "#2D3748",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  border: "1px solid #CBD5E0",
  borderRadius: "6px",
  marginTop: "4px",
};




