// src/AgreementsList.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsListProps {
  user?: any;
  role?: string;
  onEdit: (agreement: any) => void;
  onCreate: () => void;
}

export default function AgreementsList({
  user: _user, // renombradas para evitar TS6133 cuando no se usan
  role: _role, // renombradas para evitar TS6133 cuando no se usan
  onEdit,
  onCreate,
}: AgreementsListProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgreements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);

    // Intentamos traer la relación a instituciones por su FK 'instituciones'
    const { data, error } = await supabase
      .from("agreements")
      .select(
        `
        id,
        name,
        institucion_id,
        convenio,
        pais,
        signature_date,
        duration_years,
        expiration_date,
        created_at,
        instituciones (id, nombre)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al cargar convenios:", error);
      setAgreements([]);
    } else {
      setAgreements(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro de eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) {
      alert("❌ Error al eliminar convenio");
      console.error("Error eliminar convenio:", error);
    } else {
      alert("✅ Convenio eliminado correctamente");
      fetchAgreements();
    }
  };

  if (loading) return <p>Cargando convenios...</p>;

  return (
    <div style={{ padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h2 style={{ textAlign: "left", marginBottom: 0 }}>📄 Lista de Convenios</h2>
        <button
          onClick={onCreate}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            padding: "8px 14px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ➕ Nuevo Convenio
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderRadius: 8,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left" }}>
              <th style={{ padding: "10px" }}>Nombre</th>
              <th style={{ padding: "10px" }}>Institución</th>
              <th style={{ padding: "10px" }}>Tipo</th>
              <th style={{ padding: "10px" }}>País</th>
              <th style={{ padding: "10px" }}>Firma</th>
              <th style={{ padding: "10px" }}>Duración</th>
              <th style={{ padding: "10px" }}>Vencimiento</th>
              <th style={{ padding: "10px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {agreements.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "15px", color: "#6b7280", fontStyle: "italic" }}>
                  No hay convenios registrados.
                </td>
              </tr>
            ) : (
              agreements.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #e6edf3" }}>
                  <td style={{ padding: "10px" }}>{a.name}</td>
                  <td style={{ padding: "10px" }}>{a.instituciones?.nombre || "—"}</td>
                  <td style={{ padding: "10px" }}>{a.convenio || "—"}</td>
                  <td style={{ padding: "10px" }}>{a.pais || "—"}</td>
                  <td style={{ padding: "10px" }}>{a.signature_date || "—"}</td>
                  <td style={{ padding: "10px" }}>{a.duration_years ?? "—"} años</td>
                  <td style={{ padding: "10px" }}>{a.expiration_date || "—"}</td>
                  <td style={{ padding: "10px", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => onEdit(a)}
                      style={{
                        background: "#3b82f6",
                        color: "white",
                        border: "none",
                        padding: "6px 10px",
                        borderRadius: 6,
                        marginRight: 8,
                        cursor: "pointer",
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
                        padding: "6px 10px",
                        borderRadius: 6,
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
  );
}
