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
        `id, name, institucion, convenio, pais, signature_date, duration_years, expiration_date,
         profiles!agreements_internal_responsible_fkey (full_name)`
      )
      .order("created_at", { ascending: false });

    if (role !== "admin") {
      query = query.eq("internal_responsible", user.id);
    }

    const { data, error } = await query;
    if (error) console.error("❌ Error al cargar convenios:", error);
    else setAgreements(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro de eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("Error al eliminar convenio");
    else {
      alert("✅ Convenio eliminado correctamente");
      fetchAgreements();
    }
  };

  if (loading) return <p>Cargando convenios...</p>;

  return (
    <div style={{ padding: "10px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>📑 Lista de Convenios</h2>

      {editingAgreement ? (
        <AgreementsForm
          user={user}
          existingAgreement={editingAgreement}
          onSave={() => {
            setEditingAgreement(null);
            fetchAgreements();
          }}
          onCancel={() => setEditingAgreement(null)}
        />
      ) : (
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
                <th style={{ padding: "10px" }}>Institución</th>
                <th style={{ padding: "10px" }}>Tipo</th>
                <th style={{ padding: "10px" }}>País</th>
                <th style={{ padding: "10px" }}>Responsable interno</th>
                <th style={{ padding: "10px" }}>Firma</th>
                <th style={{ padding: "10px" }}>Duración</th>
                <th style={{ padding: "10px" }}>Vencimiento</th>
                {role === "admin" && <th style={{ padding: "10px" }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {agreements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "15px" }}>
                    No hay convenios registrados.
                  </td>
                </tr>
              ) : (
                agreements.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px" }}>{a.name}</td>
                    <td style={{ padding: "10px" }}>{a.institucion}</td>
                    <td style={{ padding: "10px" }}>{a.convenio}</td>
                    <td style={{ padding: "10px" }}>{a.pais}</td>
                    <td style={{ padding: "10px" }}>{a.profiles?.full_name || "—"}</td>
                    <td style={{ padding: "10px" }}>{a.signature_date}</td>
                    <td style={{ padding: "10px" }}>{a.duration_years} años</td>
                    <td style={{ padding: "10px" }}>{a.expiration_date}</td>
                    {role === "admin" && (
                      <td style={{ padding: "10px" }}>
                        <button
                          onClick={() => setEditingAgreement(a)}
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
                          onClick={() => handleDelete(a.id)}
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









