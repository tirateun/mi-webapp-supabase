import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import AgreementsForm from "./AgreementsForm";

interface AgreementsListProps {
  user: any;
  role: string;
}

export default function AgreementsList({ user, role }: AgreementsListProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgreement, setEditingAgreement] = useState<any | null>(null);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);

    let query = supabase
      .from("agreements")
      .select(
        `
        id, name, "Institución", convenio, pais, 
        signature_date, duration_years, expiration_date,
        internal_responsible,
        profiles!agreements_internal_responsible_fkey(full_name)
      `
      )
      .order("created_at", { ascending: false });

    // 🔹 Si no es admin, filtra por responsable interno
    if (role !== "admin") {
      query = query.eq("internal_responsible", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error al cargar convenios:", error);
    } else {
      setAgreements(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;

    const { error } = await supabase.from("agreements").delete().eq("id", id);

    if (error) alert("❌ Error al eliminar convenio: " + error.message);
    else {
      alert("✅ Convenio eliminado correctamente");
      fetchAgreements();
    }
  };

  if (loading) return <p style={{ textAlign: "center" }}>Cargando convenios...</p>;

  // 🔹 Si se está editando un convenio, mostrar formulario de edición
  if (editingAgreement) {
    return (
      <AgreementsForm
        user={user}
        existingAgreement={editingAgreement}
        onSave={() => {
          setEditingAgreement(null);
          fetchAgreements();
        }}
        onCancel={() => setEditingAgreement(null)}
      />
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "100%", overflowX: "auto" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#2B6CB0",
        }}
      >
        📑 Lista de Convenios
      </h2>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "#E2E8F0", textAlign: "left" }}>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Institución</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>País</th>
              <th style={thStyle}>Responsable interno</th>
              <th style={thStyle}>Fecha firma</th>
              <th style={thStyle}>Duración</th>
              <th style={thStyle}>Vencimiento</th>
              {role === "admin" && <th style={thStyle}>Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {agreements.length === 0 ? (
              <tr>
                <td colSpan={role === "admin" ? 9 : 8} style={emptyStyle}>
                  No hay convenios registrados.
                </td>
              </tr>
            ) : (
              agreements.map((a) => (
                <tr key={a.id} style={trStyle}>
                  <td style={tdStyle}>{a.name}</td>
                  <td style={tdStyle}>{a["Institución"]}</td>
                  <td style={tdStyle}>{a.convenio}</td>
                  <td style={tdStyle}>{a.pais}</td>
                  <td style={tdStyle}>{a.profiles?.full_name || "—"}</td>
                  <td style={tdStyle}>{a.signature_date}</td>
                  <td style={tdStyle}>{a.duration_years} años</td>
                  <td style={tdStyle}>{a.expiration_date}</td>

                  {role === "admin" && (
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => setEditingAgreement(a)}
                        style={{
                          background: "#3B82F6",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          marginRight: "6px",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        style={{
                          background: "#EF4444",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
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

// 🎨 Estilos reutilizables
const thStyle = {
  padding: "10px",
  fontWeight: "600",
  fontSize: "0.95rem",
  borderBottom: "2px solid #CBD5E0",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #E2E8F0",
  fontSize: "0.9rem",
};

const trStyle = {
  transition: "background 0.2s",
  cursor: "default",
};

const emptyStyle = {
  textAlign: "center",
  padding: "15px",
  fontStyle: "italic",
};



