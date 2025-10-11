import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import InstitucionesForm from "./InstitucionesForm";

export default function InstitucionesList() {
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInstitution, setEditingInstitution] = useState<any | null>(null);

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
    if (!confirm("¿Seguro de eliminar esta institución?")) return;
    const { error } = await supabase.from("instituciones").delete().eq("id", id);
    if (error) alert("❌ Error al eliminar institución");
    else {
      alert("✅ Institución eliminada correctamente");
      fetchInstituciones();
    }
  };

  if (loading) return <p>Cargando instituciones...</p>;

  return (
    <div style={{ padding: "10px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>🏛️ Lista de Instituciones</h2>

      {editingInstitution ? (
        <InstitucionesForm
          existingInstitution={editingInstitution}
          onSave={() => {
            setEditingInstitution(null);
            fetchInstituciones();
          }}
          onCancel={() => setEditingInstitution(null)}
        />
      ) : (
        <div>
          <button
            onClick={() => setEditingInstitution({})}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginBottom: "10px",
            }}
          >
            ➕ Nueva Institución
          </button>

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
                  <th style={{ padding: "10px" }}>Contacto</th>
                  <th style={{ padding: "10px" }}>Email</th>
                  <th style={{ padding: "10px" }}>Teléfono</th>
                  <th style={{ padding: "10px" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {instituciones.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "15px" }}>
                      No hay instituciones registradas.
                    </td>
                  </tr>
                ) : (
                  instituciones.map((i) => (
                    <tr key={i.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "10px" }}>{i.nombre}</td>
                      <td style={{ padding: "10px" }}>{i.tipo}</td>
                      <td style={{ padding: "10px" }}>{i.pais}</td>
                      <td style={{ padding: "10px" }}>{i.ciudad}</td>
                      <td style={{ padding: "10px" }}>{i.contacto}</td>
                      <td style={{ padding: "10px" }}>{i.email}</td>
                      <td style={{ padding: "10px" }}>{i.telefono}</td>
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => setEditingInstitution(i)}
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
                          onClick={() => handleDelete(i.id)}
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

