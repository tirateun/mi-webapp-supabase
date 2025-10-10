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
  const [institucion, setInstitucion] = useState(existingAgreement?.institucion || "");
  const [convenio, setConvenio] = useState(existingAgreement?.convenio || "específico");
  const [pais, setPais] = useState(existingAgreement?.pais || "");
  const [internalResponsible, setInternalResponsible] = useState(existingAgreement?.internal_responsible || "");
  const [externalResponsible, setExternalResponsible] = useState(existingAgreement?.external_responsible || "");
  const [signatureDate, setSignatureDate] = useState(existingAgreement?.signature_date || "");
  const [durationYears, setDurationYears] = useState(existingAgreement?.duration_years || 1);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name, role");
    if (!error && data) setProfiles(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const agreementData = {
      name,
      institucion, // 🔹 CORRECTO, coincide con tu tabla
      convenio,
      pais,
      internal_responsible: internalResponsible || null,
      external_responsible: externalResponsible || null,
      signature_date: signatureDate,
      duration_years: durationYears,
    };

    try {
      let result;
      if (existingAgreement) {
        result = await supabase.from("agreements").update(agreementData).eq("id", existingAgreement.id);
      } else {
        result = await supabase.from("agreements").insert([agreementData]);
      }

      if (result.error) {
        console.error("❌ Error real de Supabase:", result.error);
        alert("❌ Error al guardar convenio: " + result.error.message);
      } else {
        alert("✅ Convenio guardado correctamente");
        onSave();
      }
    } catch (error) {
      console.error("⚠️ Error inesperado:", error);
      alert("⚠️ Error inesperado al guardar convenio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
        {existingAgreement ? "✏️ Editar Convenio" : "➕ Crear Convenio"}
      </h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <label>Nombre del convenio:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Institución:</label>
        <input value={institucion} onChange={(e) => setInstitucion(e.target.value)} required />

        <label>Tipo de convenio:</label>
        <select value={convenio} onChange={(e) => setConvenio(e.target.value)}>
          <option value="específico">Específico</option>
          <option value="marco">Marco</option>
        </select>

        <label>País:</label>
        <select value={pais} onChange={(e) => setPais(e.target.value)} required>
          <option value="">Seleccionar país...</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <label>Responsable interno:</label>
        <select
          value={internalResponsible}
          onChange={(e) => setInternalResponsible(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {profiles
            .filter((p) => p.role === "internal")
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
        >
          <option value="">Seleccionar...</option>
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
          required
        />

        <label>Duración (años):</label>
        <input
          type="number"
          value={durationYears}
          onChange={(e) => setDurationYears(Number(e.target.value))}
          min="1"
          required
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <button type="submit" disabled={loading} style={{ background: "#3b82f6", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px" }}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: "#e5e7eb", padding: "8px 15px", border: "none", borderRadius: "5px" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}



