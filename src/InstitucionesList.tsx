import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import InstitucionesForm from "./InstitucionesForm";

interface InstitucionesListProps {
  role: string; // 👈 añadimos el rol para controlar permisos
}

export default function InstitucionesList({ role }: InstitucionesListProps) {
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInstitucion, setEditingInstitucion] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInstituciones();
  }, []);

  const fetchInstituciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("instituciones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("❌ Error al cargar instituciones:", error);
    else setInstituciones(data || []);

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta institución?")) return;
    const { error } = await supabase.from("instituciones").delete().eq("id", id);
    if (error) {
      alert("❌ Error al eliminar institución: " + error.message);
    } else {
      alert("✅ Institución eliminada correctamente");
      fetchInstituciones();
    }
  };

  if (loading) return <p>Cargando instituciones...</p>;

  // 🔹 Mostrar formulario si se edita o crea
  if (editingInstitucion || creating) {
    return (
      <InstitucionesForm
        existingInstitucion={editingInstitucion || undefined}
        onSave={() => {
          setEditingInstitucion(null);
          setCreating(false);
          fetchInstituciones();
        }}
        onCancel={() => {
          setEditingInstitucion(null);
          setCreating(false);
        }}
      />
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>🏛️ Lista de Instituciones</h2>

      {/* 👇 Solo los admin ven el botón "Nueva Institución" */}
      {role === "admin" && (
        <div style={{ textAlign: "right", marginBottom: "15px" }}>
          <button
            onClick={() => setCreating(true)}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ➕ Nueva Institución
          </button>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderRadius: "10px",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={{ padding: "10px" }}>Nombre</th>
              <th style={{ padding: "10px" }}>Tipo</th>
              <th style={{ padding: "10px" }}>País</th>
              <th style={{ padding: "10px" }}>Ciudad</th>
              <th style={{ padding: "10px" }}>Dirección</th>
              <th style={{ padding: "10px" }}>Contacto</th>
              <th style={{ padding: "10px" }}>Email</th>
              <th style={{ padding: "10px" }}>Teléfono</th>
              {/* 👇 Solo admin ve la columna de Acciones */}
              {role === "admin" && <th style={{ padding: "10px" }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {instituciones.length === 0 ? (
              <tr>
                <td colSpan={role === "admin" ? 9 : 8} style={{ textAlign: "center", padding: "15px" }}>
                  No hay instituciones registradas.
                </td>
              </tr>
            ) : (
              instituciones.map((inst) => (
                <tr key={inst.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px" }}>{inst.nombre}</td>
                  <td style={{ padding: "10px" }}>{inst.tipo}</td>
                  <td style={{ padding: "10px" }}>{inst.pais}</td>
                  <td style={{ padding: "10px" }}>{inst.ciudad}</td>
                  <td style={{ padding: "10px" }}>{inst.direccion}</td>
                  <td style={{ padding: "10px" }}>{inst.contacto}</td>
                  <td style={{ padding: "10px" }}>{inst.email}</td>
                  <td style={{ padding: "10px" }}>{inst.telefono}</td>

                  {/* 👇 Acciones solo visibles para admin */}
                  {role === "admin" && (
                    <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => setEditingInstitucion(inst)}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "5px",
                          marginRight: "5px",
                          cursor: "pointer",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(inst.id)}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "5px",
                          cursor: "pointer",
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}




