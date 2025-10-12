import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface InstitucionesFormProps {
  existingInstitucion?: any; // ✅ agregado
  onSave: () => void;
  onCancel: () => void;
}

export default function InstitucionesForm({
  existingInstitucion,
  onSave,
  onCancel,
}: InstitucionesFormProps) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Hospital");
  const [pais, setPais] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    if (existingInstitucion) {
      setNombre(existingInstitucion.nombre);
      setTipo(existingInstitucion.tipo || "Hospital");
      setPais(existingInstitucion.pais);
      setCiudad(existingInstitucion.ciudad || "");
      setDireccion(existingInstitucion.direccion || "");
      setContacto(existingInstitucion.contacto || "");
      setEmail(existingInstitucion.email || "");
      setTelefono(existingInstitucion.telefono || "");
    }
  }, [existingInstitucion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nombre,
      tipo,
      pais,
      ciudad,
      direccion,
      contacto,
      email,
      telefono,
    };

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
      alert("❌ Error al guardar institución: " + error.message);
    } else {
      alert("✅ Institución guardada correctamente");
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
        {existingInstitucion ? "✏️ Editar Institución" : "🏛️ Crear Nueva Institución"}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
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
            <option value="Hospital">Hospital</option>
            <option value="Universidad">Universidad</option>
            <option value="Instituto">Instituto</option>
            <option value="Otro">Otro</option>
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
          <label>Email</label>
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



