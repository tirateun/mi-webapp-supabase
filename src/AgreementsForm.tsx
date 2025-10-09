import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface AgreementsFormProps {
  user: any;
  role: string;
  existingAgreement?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function AgreementsForm({
  user,
  role,
  existingAgreement,
  onSave,
  onCancel,
}: AgreementsFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    institucion: "",
    convenio: "marco",
    pais: "",
    signature_date: "",
    duration_years: 1,
    internal_responsible: user?.id || null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingAgreement) {
      setFormData({
        name: existingAgreement.name,
        institucion: existingAgreement["Institución"],
        convenio: existingAgreement.convenio,
        pais: existingAgreement.pais,
        signature_date: existingAgreement.signature_date,
        duration_years: existingAgreement.duration_years,
        internal_responsible: existingAgreement.internal_responsible,
      });
    }
  }, [existingAgreement]);

  const handleSubmit = async () => {
    setLoading(true);
    const table = supabase.from("agreements");

    const { error } = existingAgreement
      ? await table.update(formData).eq("id", existingAgreement.id)
      : await table.insert([formData]);

    setLoading(false);

    if (error) alert("❌ Error al guardar convenio");
    else {
      alert("✅ Convenio guardado correctamente");
      onSave();
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "auto",
        padding: "20px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        {existingAgreement ? "✏️ Editar Convenio" : "➕ Crear Convenio"}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <label>Nombre del convenio</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{ padding: "8px" }}
        />

        <label>Institución</label>
        <input
          value={formData.institucion}
          onChange={(e) =>
            setFormData({ ...formData, institucion: e.target.value })
          }
          style={{ padding: "8px" }}
        />

        <label>Tipo de convenio</label>
        <select
          value={formData.convenio}
          onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
          style={{ padding: "8px" }}
        >
          <option value="marco">Marco</option>
          <option value="específico">Específico</option>
        </select>

        <label>País</label>
        <select
          value={formData.pais}
          onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
          style={{ padding: "8px" }}
        >
          <option value="">Seleccione un país</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <label>Fecha de firma</label>
        <input
          type="date"
          value={formData.signature_date}
          onChange={(e) =>
            setFormData({ ...formData, signature_date: e.target.value })
          }
          style={{ padding: "8px" }}
        />

        <label>Duración (años)</label>
        <input
          type="number"
          value={formData.duration_years}
          onChange={(e) =>
            setFormData({
              ...formData,
              duration_years: Number(e.target.value),
            })
          }
          style={{ padding: "8px" }}
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              background: "#94a3b8",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

