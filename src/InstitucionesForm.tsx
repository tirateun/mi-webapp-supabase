import { useState } from "react";
import { supabase } from "./supabaseClient";

interface InstitucionesFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function InstitucionesForm({ onSave, onCancel }: InstitucionesFormProps) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Hospital");
  const [pais, setPais] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("instituciones").insert([
      {
        nombre,
        tipo,
        pais,
        ciudad,
        direccion,
        contacto,
        email,
        telefono,
      },
    ]);

    if (error) {
      alert("❌ Error al guardar la institución: " + error.message);
    } else {
      alert("✅ Institución registrada correctamente");
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
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#1e3a8a", marginBottom: "20px" }}>
        🏛️ Registrar Nueva Institución
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
        <div>
          <label>Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          >
            <option>Hospital</option>
            <option>Universidad</option>
            <option>Instituto</option>
            <option>Otro</option>
          </select>
        </div>

        <div>
          <label>País</label>
          <input
            type="text"
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Ciudad</label>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
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
          <label>Contacto</label>
          <input
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
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
          <label>Teléfono</label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          type="submit"
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
            marginRight: "10px",
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


