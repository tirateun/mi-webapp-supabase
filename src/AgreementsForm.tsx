import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface AgreementsFormProps {
  user: any;
  onSave: () => void;
  onCancel: () => void;
  existingAgreement?: any;
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
  const [signatureDate, setSignatureDate] = useState(existingAgreement?.signature_date || "");
  const [durationYears, setDurationYears] = useState(existingAgreement?.duration_years || 1);
  const [internalResponsible, setInternalResponsible] = useState(existingAgreement?.internal_responsible || "");
  const [externalResponsible, setExternalResponsible] = useState(existingAgreement?.external_responsible || "");
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [externalUsers, setExternalUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name, role");
    if (!error && data) {
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

    const { error } = existingAgreement
      ? await supabase.from("agreements").update(agreementData).eq("id", existingAgreement.id)
      : await supabase.from("agreements").insert([agreementData]);

    if (error) alert("❌ Error al guardar: " + error.message);
    else {
      alert(existingAgreement ? "✅ Convenio actualizado correctamente" : "✅ Convenio creado correctamente");
      onSave();
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#2563eb" }}>
        {existingAgreement ? "✏️ Editar Convenio" : "📝 Crear Convenio"}
      </h2>

      <form onSubmit={handleSubmit}>
        <label style={labelStyle}>Nombre del Convenio</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />

        <label style={labelStyle}>Institución</label>
        <input style={inputStyle} value={institucion} onChange={(e) => setInstitucion(e.target.value)} required />

        <label style={labelStyle}>Tipo de Convenio</label>
        <select style={inputStyle} value={convenio} onChange={(e) => setConvenio(e.target.value)}>
          <option value="marco">Marco</option>
          <option value="específico">Específico</option>
        </select>

        <label style={labelStyle}>País</label>
        <select style={inputStyle} value={pais} onChange={(e) => setPais(e.target.value)}>
          <option value="">Seleccione un país</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Responsable Interno</label>
        <select style={inputStyle} value={internalResponsible} onChange={(e) => setInternalResponsible(e.target.value)}>
          <option value="">Seleccione</option>
          {internalUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Responsable Externo</label>
        <select style={inputStyle} value={externalResponsible} onChange={(e) => setExternalResponsible(e.target.value)}>
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
          style={inputStyle}
          value={signatureDate}
          onChange={(e) => setSignatureDate(e.target.value)}
          required
        />

        <label style={labelStyle}>Duración (años)</label>
        <input
          type="number"
          style={inputStyle}
          value={durationYears}
          onChange={(e) => setDurationYears(Number(e.target.value))}
          required
          min={1}
        />

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button type="submit" style={buttonPrimary}>
            {existingAgreement ? "Guardar Cambios" : "Crear Convenio"}
          </button>
          <button type="button" onClick={onCancel} style={buttonCancel}>
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
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginTop: "4px",
  border: "1px solid #CBD5E0",
  borderRadius: "6px",
};

const buttonPrimary = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "10px",
};

const buttonCancel = {
  background: "#CBD5E0",
  color: "#2D3748",
  border: "none",
  padding: "10px 20px",
  borderRadius: "6px",
  cursor: "pointer",
};

};




