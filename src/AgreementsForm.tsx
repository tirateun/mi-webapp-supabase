import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface AgreementsFormProps {
  user: any;
  role: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function AgreementsForm({ user, role, onSave, onCancel }: AgreementsFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    institucion: "",
    convenio: "",
    pais: "",
    internal_responsible: user.id,
    external_responsible: "",
    signature_date: "",
    duration_years: 1,
  });

  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, role");
    setProfiles(data || []);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("agreements").insert([formData]);
    if (error) {
      alert("❌ Error al crear convenio: " + error.message);
    } else {
      alert("✅ Convenio creado correctamente");
      onSave();
    }
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>📝 Crear nuevo convenio</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <label>
          Nombre del convenio:
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </label>

        <label>
          Institución:
          <input
            type="text"
            value={formData.institucion}
            onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </label>

        <label>
          Tipo de convenio:
          <select
            value={formData.convenio}
            onChange={(e) => setFormData({ ...formData, convenio: e.target.value })}
            required
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">Selecciona tipo</option>
            <option value="marco">Marco</option>
            <option value="específico">Específico</option>
          </select>
        </label>

        <label>
          País:
          <select
            value={formData.pais}
            onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
            required
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">Selecciona país</option>
            {countries.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Responsable externo:
          <select
            value={formData.external_responsible}
            onChange={(e) => setFormData({ ...formData, external_responsible: e.target.value })}
            required
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="">Selecciona responsable externo</option>
            {profiles
              .filter((p) => p.role === "external")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
          </select>
        </label>

        <label>
          Fecha de firma:
          <input
            type="date"
            value={formData.signature_date}
            onChange={(e) => setFormData({ ...formData, signature_date: e.target.value })}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </label>

        <label>
          Duración (años):
          <input
            type="number"
            min={1}
            value={formData.duration_years}
            onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </label>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: "#CBD5E0",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            type="submit"
            style={{
              backgroundColor: "#2B6CB0",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Guardar convenio
          </button>
        </div>
      </form>
    </div>
  );
}


