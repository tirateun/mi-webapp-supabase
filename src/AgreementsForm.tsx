import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface AgreementsFormProps {
  existingAgreement?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function AgreementsForm({
  existingAgreement,
  onSave,
  onCancel,
}: AgreementsFormProps) {
  const [name, setName] = useState("");
  const [institucion, setInstitucion] = useState("");
  const [convenio, setConvenio] = useState("marco");
  const [pais, setPais] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [durationYears, setDurationYears] = useState(1);
  const [internalResponsible, setInternalResponsible] = useState("");
  const [externalResponsible, setExternalResponsible] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchProfiles();
    if (existingAgreement) {
      setName(existingAgreement.name);
      setInstitucion(existingAgreement.institucion);
      setConvenio(existingAgreement.convenio);
      setPais(existingAgreement.pais);
      setSignatureDate(existingAgreement.signature_date);
      setDurationYears(existingAgreement.duration_years);
      setInternalResponsible(existingAgreement.internal_responsible || "");
      setExternalResponsible(existingAgreement.external_responsible || "");
    }
  }, [existingAgreement]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name");
    if (error) console.error("❌ Error al cargar perfiles:", error);
    if (data) setProfiles(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const agreementData = {
      name,
      institucion, // ✅ coincide exactamente con la tabla
      convenio,
      pais,
      signature_date: signatureDate,
      duration_years: durationYears,
      internal_responsible: internalResponsible || null,
      external_responsible: externalResponsible || null,
    };

    console.log("📦 Datos a guardar:", agreementData);

    let result;
    if (existingAgreement) {
      result = await supabase
        .from("agreements")
        .update(agreementData)
        .eq("id", existingAgreement.id);
    } else {
      result = await supabase.from("agreements").insert([agreementData]);
    }

    const { error } = result;
    if (error) {
      console.error("❌ Error real de Supabase:", error);
      alert("❌ Error al guardar convenio: " + error.message);
    } else {
      alert("✅ Convenio guardado correctamente");
      onSave();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#1e3a8a", marginBottom: "20px" }}>
        {existingAgreement ? "✏️ Editar Convenio" : "📝 Crear Nuevo Convenio"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
        <div>
          <label>Nombre del convenio</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Institución</label>
          <input
            type="text"
            value={institucion}
            onChange={(e) => setInstitucion(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Tipo de convenio</label>
          <select
            value={convenio}
            onChange={(e) => setConvenio(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="marco">Marco</option>
            <option value="específico">Específico</option>
          </select>
        </div>

        <div>
          <label>País</label>
          <select
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">Seleccionar país</option>
            {countries.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Responsable interno</label>
          <select
            value={internalResponsible}
            onChange={(e) => setInternalResponsible(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">Seleccionar</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Responsable externo</label>
          <select
            value={externalResponsible}
            onChange={(e) => setExternalResponsible(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">Seleccionar</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Fecha de firma</label>
          <input
            type="date"
            value={signatureDate}
            onChange={(e) => setSignatureDate(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Duración (años)</label>
          <input
            type="number"
            value={durationYears}
            onChange={(e) => setDurationYears(Number(e.target.value))}
            min={1}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "15px",
        }}
      >
        <button
          type="submit"
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: "#ef4444",
            color: "white",
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
  );
}



