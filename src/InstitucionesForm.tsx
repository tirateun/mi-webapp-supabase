import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

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
  const [tipo, setTipo] = useState("Hospital");
  const [pais, setPais] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [direccion, setDireccion] = useState("");
  const [contacto, setContacto] = useState("");
  const [cargo, setCargo] = useState(""); // 🆕 AGREGAR
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
      setCargo(existingInstitucion.cargo || ""); // 🆕 AGREGAR
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
      cargo, // 🆕 AGREGAR
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
      if (
        error.message.includes("violates row-level security policy") ||
        error.message.toLowerCase().includes("permission")
      ) {
        alert("❌ No tienes permisos para crear o editar instituciones.");
      } else {
        alert("❌ Error al guardar institución: " + error.message);
      }
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
        {/* Nombre */}
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

        {/* Tipo */}
        <div>
          <label>Tipo</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="Hospital">Hospital</option>
            <option value="Universidad pública">Universidad pública</option>
            <option value="Universidad privada">Universidad privada</option>
            <option value="Instituto">Instituto</option>
            <option value="Asociación">Asociación</option>
            <option value="Colegio profesional">Colegio profesional</option>
            <option value="Sociedad">Sociedad</option>
            <option value="Laboratorio">Laboratorio</option>
            <option value="Clínica">Clínica</option>
            <option value="Red de salud">Red de salud</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {/* País */}
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

        {/* Ciudad */}
        <div>
          <label>Ciudad</label>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* Dirección */}
        <div>
          <label>Dirección</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* Contacto */}
        <div>
          <label>Contacto</label>
          <input
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* 🆕 CARGO */}
        <div>
          <label>Cargo</label>
          <input
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Ej: Director, Jefe de UADEI"
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* Email */}
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        {/* Teléfono */}
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

      {/* Botones */}
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





