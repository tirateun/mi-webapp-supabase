import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json"; // JSON con lista de países

interface AgreementsFormProps {
  user: any;
  role: string;
}

export default function AgreementsForm({ user, role }: AgreementsFormProps) {
  const [form, setForm] = useState({
    name: "",
    institucion: "",
    convenio: "Marco",
    pais: "",
    internal_responsible: user.id,
    external_responsible: "",
    signature_date: "",
    duration_years: 1,
  });
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role");
    if (!error && data) setProfiles(data);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase.from("agreements").insert([form]);
    if (error) {
      console.error(error);
      alert("Error al crear convenio");
    } else {
      alert("✅ Convenio creado correctamente");
      setForm({
        name: "",
        institucion: "",
        convenio: "Marco",
        pais: "",
        internal_responsible: user.id,
        external_responsible: "",
        signature_date: "",
        duration_years: 1,
      });
    }
  };

  if (role !== "admin") {
    return <p>No tienes permisos para crear convenios.</p>;
  }

  return (
    <div>
      <h2>➕ Crear nuevo convenio</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
        <label>Nombre del convenio:</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Institución:</label>
        <input
          name="institucion"
          value={form.institucion}
          onChange={handleChange}
          required
        />

        <label>Tipo de convenio:</label>
        <select
          name="convenio"
          value={form.convenio}
          onChange={handleChange}
          required
        >
          <option value="Marco">Marco</option>
          <option value="Específico">Específico</option>
        </select>

        <label>País:</label>
        <select
          name="pais"
          value={form.pais}
          onChange={handleChange}
          required
        >
          <option value="">Seleccionar país</option>
          {countries.map((c: any) => (
            <option key={c.code} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <label>Responsable interno:</label>
        <select
          name="internal_responsible"
          value={form.internal_responsible}
          onChange={handleChange}
          required
        >
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
          name="external_responsible"
          value={form.external_responsible}
          onChange={handleChange}
          required
        >
          <option value="">Seleccionar</option>
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
          name="signature_date"
          value={form.signature_date}
          onChange={handleChange}
          required
        />

        <label>Duración (años):</label>
        <input
          type="number"
          name="duration_years"
          value={form.duration_years}
          onChange={handleChange}
          required
          min={1}
        />

        <button type="submit" style={{ marginTop: "20px" }}>
          Guardar convenio
        </button>
      </form>
    </div>
  );
}
