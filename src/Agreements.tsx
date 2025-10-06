import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Agreements({ user }: { user: any }) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Campos del formulario
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    hospital: "",
    external_responsible: "",
    signature_date: "",
    duration_years: 1,
  });

  // 🔹 Cargar convenios y rol del usuario
  const fetchAgreements = async () => {
    const { data, error } = await supabase.from("agreements").select(`
      id, name, hospital, signature_date, duration_years, expiration_date,
      external_responsible:profiles!agreements_external_responsible_fkey(full_name),
      internal_responsible
    `);

    if (!error) setAgreements(data || []);
    setLoading(false);
  };

  const fetchRole = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role === "admin") setIsAdmin(true);
  };

  useEffect(() => {
    fetchAgreements();
    fetchRole();
  }, []);

  // 🔹 Crear o actualizar convenio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, hospital, external_responsible, signature_date, duration_years } =
      formData;

    if (!name || !hospital || !external_responsible || !signature_date)
      return alert("Todos los campos son obligatorios.");

    if (editingId) {
      // 🔄 Editar convenio
      const { error } = await supabase
        .from("agreements")
        .update({
          name,
          hospital,
          external_responsible,
          signature_date,
          duration_years,
        })
        .eq("id", editingId);
      if (error) return alert("Error al actualizar convenio");
      alert("✅ Convenio actualizado correctamente");
    } else {
      // 🆕 Crear convenio
      const { error } = await supabase.from("agreements").insert([
        {
          name,
          hospital,
          external_responsible,
          signature_date,
          duration_years,
          internal_responsible: user.id,
        },
      ]);
      if (error) return alert("Error al crear convenio");
      alert("✅ Convenio creado correctamente");
    }

    setFormData({
      name: "",
      hospital: "",
      external_responsible: "",
      signature_date: "",
      duration_years: 1,
    });
    setEditingId(null);
    fetchAgreements();
  };

  // 🔹 Editar convenio existente
  const handleEdit = (agreement: any) => {
    setEditingId(agreement.id);
    setFormData({
      name: agreement.name,
      hospital: agreement.hospital,
      external_responsible: agreement.external_responsible?.full_name || "",
      signature_date: agreement.signature_date,
      duration_years: agreement.duration_years,
    });
  };

  // 🔹 Eliminar convenio
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) return alert("Error al eliminar convenio");
    alert("🗑️ Convenio eliminado");
    fetchAgreements();
  };

  if (loading) return <p>Cargando convenios...</p>;

  return (
    <div id="convenios">
      <h2>📑 Lista de Convenios</h2>

      {/* 🧾 Formulario solo visible para admin */}
      {isAdmin && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#f9fafb",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            maxWidth: "600px",
          }}
        >
          <h3>{editingId ? "✏️ Editar Convenio" : "➕ Nuevo Convenio"}</h3>
          <input
            type="text"
            placeholder="Nombre del convenio"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
          />
          <input
            type="text"
            placeholder="Hospital"
            value={formData.hospital}
            onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
          />
          <input
            type="text"
            placeholder="Responsable externo"
            value={formData.external_responsible}
            onChange={(e) =>
              setFormData({ ...formData, external_responsible: e.target.value })
            }
            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
          />
          <label>Fecha de firma:</label>
          <input
            type="date"
            value={formData.signature_date}
            onChange={(e) =>
              setFormData({ ...formData, signature_date: e.target.value })
            }
            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
          />
          <label>Años de duración:</label>
          <input
            type="number"
            min={1}
            value={formData.duration_years}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration_years: parseInt(e.target.value, 10),
              })
            }
            style={{ width: "100%", padding: "8px", margin: "5px 0" }}
          />
          <button
            type="submit"
            style={{
              background: "#3b82f6",
              color: "white",
              padding: "10px 15px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {editingId ? "Actualizar" : "Crear"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  hospital: "",
                  external_responsible: "",
                  signature_date: "",
                  duration_years: 1,
                });
              }}
              style={{
                marginLeft: "10px",
                padding: "10px 15px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          )}
        </form>
      )}

      {/* 📋 Tabla de convenios */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Hospital</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Externo</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fecha Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Duración (años)</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Vencimiento</th>
            {isAdmin && <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.hospital}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.external_responsible?.full_name || "-"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.signature_date}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.duration_years}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.expiration_date}</td>
                {isAdmin && (
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <button
                      onClick={() => handleEdit(a)}
                      style={{
                        background: "#facc15",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginRight: "6px",
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      style={{
                        background: "#ef4444",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "white",
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


