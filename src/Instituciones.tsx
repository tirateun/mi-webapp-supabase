import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Institucion {
  id?: string;
  nombre: string;
  tipo: string;
  pais: string;
  ciudad: string;
  direccion: string;
  contacto: string;
  email: string;
  telefono: string;
}

export default function Instituciones() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Institucion | null>(null);
  const [formData, setFormData] = useState<Institucion>({
    nombre: "",
    tipo: "Hospital",
    pais: "",
    ciudad: "",
    direccion: "",
    contacto: "",
    email: "",
    telefono: "",
  });

  // 🔹 Cargar todas las instituciones
  useEffect(() => {
    fetchInstituciones();
  }, []);

  const fetchInstituciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("instituciones")
      .select("*")
      .order("nombre", { ascending: true });
    if (error) console.error("❌ Error al cargar instituciones:", error);
    else setInstituciones(data || []);
    setLoading(false);
  };

  // 🔹 Guardar o actualizar institución
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert("⚠️ El nombre es obligatorio");
      return;
    }

    const { error } = editing
      ? await supabase
          .from("instituciones")
          .update(formData)
          .eq("id", editing.id)
      : await supabase.from("instituciones").insert([formData]);

    if (error) {
      alert("❌ Error al guardar: " + error.message);
    } else {
      alert(editing ? "✅ Institución actualizada" : "✅ Institución registrada");
      setFormData({
        nombre: "",
        tipo: "Hospital",
        pais: "",
        ciudad: "",
        direccion: "",
        contacto: "",
        email: "",
        telefono: "",
      });
      setEditing(null);
      fetchInstituciones();
    }
  };

  // 🔹 Editar
  const handleEdit = (inst: Institucion) => {
    setEditing(inst);
    setFormData(inst);
  };

  // 🔹 Eliminar
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro de eliminar esta institución?")) return;
    const { error } = await supabase.from("instituciones").delete().eq("id", id);
    if (error) alert("❌ Error al eliminar: " + error.message);
    else {
      alert("✅ Institución eliminada");
      fetchInstituciones();
    }
  };

  // 🔹 Manejo de formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Cargando instituciones...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", color: "#1e3a8a", marginBottom: "20px" }}>
        🏥 Gestión de Instituciones
      </h2>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "900px",
          margin: "0 auto 30px",
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "15px",
        }}
      >
        <div>
          <label>Nombre</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Tipo</label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          >
            <option value="Hospital">Hospital</option>
            <option value="Universidad Privada">Universidad Privada</option>
            <option value="Universidad Publica">Universidad Publica</option>
            <option value="Instituto">Instituto</option>
            <option value="Asociacion">Asociacion</option>
            <option value="Colegio profesional">Colegio profesional</option>
            <option value="Sociedad">Sociedad</option>
            <option value="Laboratorio">Laboratorio</option>
            <option value="Clinica">Clinica</option>
            <option value="Red de salud">Red de salud</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label>País</label>
          <input
            type="text"
            name="pais"
            value={formData.pais}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Ciudad</label>
          <input
            type="text"
            name="ciudad"
            value={formData.ciudad}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Dirección</label>
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Contacto</label>
          <input
            type="text"
            name="contacto"
            value={formData.contacto}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div>
          <label>Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            marginTop: "15px",
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
              marginRight: "10px",
            }}
          >
            {editing ? "Actualizar" : "Guardar"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormData({
                  nombre: "",
                  tipo: "Hospital",
                  pais: "",
                  ciudad: "",
                  direccion: "",
                  contacto: "",
                  email: "",
                  telefono: "",
                });
              }}
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
          )}
        </div>
      </form>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={{ padding: "10px" }}>Nombre</th>
              <th style={{ padding: "10px" }}>Tipo</th>
              <th style={{ padding: "10px" }}>País</th>
              <th style={{ padding: "10px" }}>Ciudad</th>
              <th style={{ padding: "10px" }}>Contacto</th>
              <th style={{ padding: "10px" }}>Correo</th>
              <th style={{ padding: "10px" }}>Teléfono</th>
              <th style={{ padding: "10px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {instituciones.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "10px" }}>
                  No hay instituciones registradas.
                </td>
              </tr>
            ) : (
              instituciones.map((inst) => (
                <tr key={inst.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px" }}>{inst.nombre}</td>
                  <td style={{ padding: "10px" }}>{inst.tipo}</td>
                  <td style={{ padding: "10px" }}>{inst.pais}</td>
                  <td style={{ padding: "10px" }}>{inst.ciudad || "—"}</td>
                  <td style={{ padding: "10px" }}>{inst.contacto || "—"}</td>
                  <td style={{ padding: "10px" }}>{inst.email || "—"}</td>
                  <td style={{ padding: "10px" }}>{inst.telefono || "—"}</td>
                  <td style={{ padding: "10px" }}>
                    <button
                      onClick={() => handleEdit(inst)}
                      style={{
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        marginRight: "5px",
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id!)}
                      style={{
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
