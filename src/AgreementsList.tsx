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

  // 🔹 Cargar convenios
  const fetchAgreements = async () => {
    setLoading(true);

    let query = supabase
      .from("agreements")
      .select(`
        id, name, institucion, convenio, pais,
        signature_date, duration_years, expiration_date,
        profiles!agreements_internal_responsible_fkey (full_name)
      `)
      .order("created_at", { ascending: false });

    // Si no es admin, mostrar solo los convenios donde es responsable interno o externo
    if (role !== "admin") {
      query = query.or(
        `internal_responsible.eq.${user.id},external_responsible.eq.${user.id}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error al cargar convenios:", error);
    } else {
      setAgreements(data || []);
    }

    setLoading(false);
  };

  // 🔹 Eliminar convenio
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("❌ Error al eliminar convenio");
    else {
      alert("✅ Convenio eliminado correctamente");
      fetchAgreements();
    }
  };

  // 🔹 Mostrar formulario si se está editando
  if (editingAgreement) {
    return (
      <AgreementsForm
        existingAgreement={editingAgreement}
        onSave={() => {
          setEditingAgreement(null);
          fetchAgreements();
        }}
        onCancel={() => setEditingAgreement(null)}
      />
    );
  }

  // 🔹 Pantalla principal de lista
  return (
    <div style={{ padding: "20px" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: "15px",
          color: "#1e3a8a",
          fontWeight: "bold",
        }}
      >
        📑 Lista de Convenios
      </h2>

      {loading ? (
        <p>Cargando convenios...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              borderRadius: "10px",
              overflow: "hidden",
              fontSize: "0.95rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "10px" }}>Nombre</th>
                <th style={{ padding: "10px" }}>Institución</th>
                <th style={{ padding: "10px" }}>Tipo</th>
                <th style={{ padding: "10px" }}>País</th>
                <th style={{ padding: "10px" }}>Responsable Interno</th>
                <th style={{ padding: "10px" }}>Firma</th>
                <th style={{ padding: "10px" }}>Duración</th>
                <th style={{ padding: "10px" }}>Vencimiento</th>
                {role === "admin" && <th style={{ padding: "10px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {agreements.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: "15px",
                      fontStyle: "italic",
                      color: "#64748b",
                    }}
                  >
                    No hay convenios registrados.
                  </td>
                </tr>
              ) : (
                agreements.map((a) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLTableRowElement).style.backgroundColor =
                        "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLTableRowElement).style.backgroundColor =
                        "transparent")
                    }
                  >
                    <td style={{ padding: "10px" }}>{a.name}</td>
                    <td style={{ padding: "10px" }}>{a.institucion}</td>
                    <td style={{ padding: "10px" }}>{a.convenio}</td>
                    <td style={{ padding: "10px" }}>{a.pais}</td>
                    <td style={{ padding: "10px" }}>
                      {a.profiles?.full_name || "—"}
                    </td>
                    <td style={{ padding: "10px" }}>{a.signature_date}</td>
                    <td style={{ padding: "10px" }}>{a.duration_years} años</td>
                    <td style={{ padding: "10px" }}>{a.expiration_date}</td>
                    {role === "admin" && (
                      <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => setEditingAgreement(a)}
                          style={{
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            marginRight: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          style={{
                            background: "#dc2626",
                            color: "white",
                            border: "none",
                            padding: "5px 10px",
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
      )}
    </div>
  );
}








