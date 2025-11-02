import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import InstitucionesForm from "./InstitucionesForm";

interface InstitucionesListProps {
  role: string; // 👈 controlamos permisos
}

export default function InstitucionesList({ role }: InstitucionesListProps) {
  const [instituciones, setInstituciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInstitucion, setEditingInstitucion] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

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

  // 🔍 Filtrado por texto (nombre, tipo, país, ciudad, contacto, email, etc.)
  const filteredInstituciones = instituciones.filter((inst) =>
    [
      inst?.nombre,
      inst?.tipo,
      inst?.pais,
      inst?.ciudad,
      inst?.contacto,
      inst?.email,
      inst?.telefono,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px", maxWidth: 1120, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "18px" }}>
        🏛️ Lista de Instituciones
      </h2>

      {/* Fila superior: buscador + botón nueva (si admin) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 Buscar institución..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              width: 300,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#fff",
            }}
          />
        </div>

        {role === "admin" && (
          <div>
            <button
              onClick={() => setCreating(true)}
              style={{
                background: "#2563eb",
                color: "white",
                padding: "8px 14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              ➕ Nueva Institución
            </button>
          </div>
        )}
      </div>

      <div style={{ overflowX: "auto", background: "white", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#f8fafc", textAlign: "left", borderBottom: "1px solid #e6edf3" }}>
              <th style={{ padding: "12px 16px" }}>Nombre</th>
              <th style={{ padding: "12px 16px" }}>Tipo</th>
              <th style={{ padding: "12px 16px" }}>País</th>
              <th style={{ padding: "12px 16px" }}>Ciudad</th>
              <th style={{ padding: "12px 16px" }}>Dirección</th>
              <th style={{ padding: "12px 16px" }}>Contacto</th>
              <th style={{ padding: "12px 16px" }}>Email</th>
              <th style={{ padding: "12px 16px" }}>Teléfono</th>
              {role === "admin" && <th style={{ padding: "12px 16px", textAlign: "center" }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInstituciones.length === 0 ? (
              <tr>
                <td colSpan={role === "admin" ? 9 : 8} style={{ textAlign: "center", padding: 24, color: "#6b7280" }}>
                  No hay instituciones registradas.
                </td>
              </tr>
            ) : (
              filteredInstituciones.map((inst) => (
                <tr key={inst.id} style={{ borderBottom: "1px solid #eef2f6" }}>
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>{inst.nombre}</td>
                  <td style={{ padding: "12px 16px" }}>{inst.tipo}</td>
                  <td style={{ padding: "12px 16px" }}>{inst.pais}</td>
                  <td style={{ padding: "12px 16px" }}>{inst.ciudad}</td>
                  <td style={{ padding: "12px 16px" }}>{inst.direccion}</td>
                  <td style={{ padding: "12px 16px" }}>{inst.contacto}</td>
                  <td style={{ padding: "12px 16px" }}>{inst.email}</td>
                  <td style={{ padding: "12px 16px" }}>{inst.telefono}</td>

                  {role === "admin" && (
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap", textAlign: "center" }}>
                      <button
                        onClick={() => setEditingInstitucion(inst)}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          marginRight: 8,
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
                          padding: "6px 10px",
                          borderRadius: "6px",
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







