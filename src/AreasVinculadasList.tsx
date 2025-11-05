import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Area {
  id: string;
  nombre: string;
  created_at?: string;
}

export default function AreasVinculadasList() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editando, setEditando] = useState<Area | null>(null);
  const [nombre, setNombre] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  const puedeEditar = ["admin", "Admin", "Administrador"].includes(userRole);

  useEffect(() => {
    fetchUserRole();
    fetchAreas();
  }, []);

  // 🔹 Obtener rol de usuario
  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) console.error("Error al obtener rol:", error);
    else setUserRole(data?.role || "externo");
  };

  // 🔹 Cargar áreas
  const fetchAreas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("areas_vinculadas")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) console.error("Error al cargar áreas:", error);
    else setAreas(data || []);
    setLoading(false);
  };

  // 🔹 Guardar o actualizar
  const handleGuardar = async () => {
    if (!puedeEditar) {
      alert("❌ No tienes permisos para realizar esta acción.");
      return;
    }

    if (!nombre.trim()) {
      alert("⚠️ Debes ingresar un nombre.");
      return;
    }

    if (editando) {
      const { error } = await supabase
        .from("areas_vinculadas")
        .update({ nombre })
        .eq("id", editando.id);
      if (error) alert("❌ Error al actualizar: " + error.message);
      else {
        alert("✅ Área actualizada correctamente");
        setEditando(null);
        setNombre("");
        fetchAreas();
      }
    } else {
      const { error } = await supabase
        .from("areas_vinculadas")
        .insert([{ nombre }]);
      if (error) alert("❌ Error al crear área: " + error.message);
      else {
        alert("✅ Área creada correctamente");
        setNombre("");
        fetchAreas();
      }
    }
  };

  // 🔹 Editar área
  const handleEditar = (area: Area) => {
    setEditando(area);
    setNombre(area.nombre);
  };

  // 🔹 Eliminar área
  const handleEliminar = async (id: string) => {
    if (!puedeEditar) {
      alert("❌ No tienes permisos para eliminar áreas.");
      return;
    }

    if (!confirm("¿Seguro que deseas eliminar esta área vinculada?")) return;

    const { error } = await supabase
      .from("areas_vinculadas")
      .delete()
      .eq("id", id);

    if (error) alert("❌ Error al eliminar: " + error.message);
    else {
      alert("✅ Área eliminada correctamente");
      fetchAreas();
    }
  };

  // 🔍 Filtrado
  const filteredAreas = areas.filter((a) =>
    a.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="container mt-5"
      style={{
        maxWidth: "800px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "30px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 className="text-center text-primary fw-bold mb-4">
        🏫 Áreas Vinculadas
      </h2>

      {/* 🔍 Buscador */}
      <div className="d-flex justify-content-between mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar área..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "300px" }}
        />
      </div>

      {/* 🧩 Formulario de creación/edición */}
      {puedeEditar && (
        <div className="card p-3 mb-4 shadow-sm border-0">
          <div className="mb-3">
            <label>Nombre del área vinculada</label>
            <input
              type="text"
              className="form-control"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ejemplo: Escuela de Medicina"
            />
          </div>
          <div className="d-flex justify-content-end">
            {editando && (
              <button
                className="btn btn-secondary me-2"
                onClick={() => {
                  setEditando(null);
                  setNombre("");
                }}
              >
                Cancelar
              </button>
            )}
            <button className="btn btn-primary" onClick={handleGuardar}>
              {editando ? "💾 Actualizar Área" : "➕ Crear Área"}
            </button>
          </div>
        </div>
      )}

      {/* 🧾 Tabla de áreas */}
      {loading ? (
        <p className="text-center">Cargando áreas...</p>
      ) : (
        <table className="table table-hover align-middle table-bordered">
          <thead className="table-primary">
            <tr>
              <th style={{ width: "60%" }}>Nombre</th>
              <th style={{ width: "25%" }}>Creado</th>
              {puedeEditar && <th style={{ width: "15%" }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAreas.length === 0 ? (
              <tr>
                <td colSpan={puedeEditar ? 3 : 2} className="text-center text-muted">
                  No se encontraron áreas vinculadas.
                </td>
              </tr>
            ) : (
              filteredAreas.map((a) => (
                <tr key={a.id}>
                  <td>{a.nombre}</td>
                  <td>{new Date(a.created_at || "").toLocaleDateString("es-PE")}</td>
                  {puedeEditar && (
                    <td>
                      <button
                        className="btn btn-outline-warning btn-sm me-2"
                        onClick={() => handleEditar(a)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleEliminar(a.id)}
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
      )}
    </div>
  );
}

