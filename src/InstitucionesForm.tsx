import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface InstitucionesFormProps {
  existingInstitucion?: any;
  onSave: () => void;
  onCancel: () => void;
}

export default function InstitucionesForm({
  existingInstitucion,
  onSave,
  onCancel,
}: InstitucionesFormProps) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState("");

  useEffect(() => {
    if (existingInstitucion) {
      setNombre(existingInstitucion.nombre);
      setDireccion(existingInstitucion.direccion || "");
      setTelefono(existingInstitucion.telefono || "");
      setEmail(existingInstitucion.email || "");
      setWeb(existingInstitucion.web || "");
    }
  }, [existingInstitucion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = { nombre, direccion, telefono, email, web };
    let result;

    if (existingInstitucion) {
      result = await supabase
        .from("instituciones")
        .update(data)
        .eq("id", existingInstitucion.id);
    } else {
      result = await supabase.from("instituciones").insert([data]);
    }

    const { error } = result;
    if (error) {
      console.error("❌ Error al guardar institución:", error);
      alert("❌ No se pudo guardar la institución.");
    } else {
      alert("✅ Institución guardada correctamente");
      onSave();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          color: "#1e3a8a",
          marginBottom: "20px",
        }}
      >
        {existingInstitucion ? "✏️ Editar Institución" : "🏛️ Nueva Institución"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
        <div style={{ gridColumn: "1 / span 2" }}>
          <label>Nombre de la institución</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Dirección</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Teléfono</label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Sitio web</label>
          <input
            type="text"
            value={web}
            onChange={(e) => setWeb(e.target.value)}
            placeholder="https://..."
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: "25px",
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
