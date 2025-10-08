import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsProps {
  role: string;
  user: any;
}

export default function Agreements({ role, user }: AgreementsProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAgreements = async () => {
    setLoading(true);
    setError("");

    try {
      let query = supabase.from("agreements").select(`
        id,
        name,
        institucion,
        convenio,
        pais,
        signature_date,
        duration_years,
        expiration_date,
        profiles!agreements_internal_responsible_fkey ( full_name )
      `);

      // 🔹 Si no es admin, solo muestra los convenios donde el usuario es responsable interno o externo
      if (role !== "admin") {
        query = query.or(
          `internal_responsible.eq.${user.id},external_responsible.eq.${user.id}`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setAgreements(data || []);
    } catch (err: any) {
      console.error("❌ Error al obtener convenios:", err);
      setError("Error al cargar convenios");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  if (loading) return <p>Cargando convenios...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div id="ver-convenios">
      <h2>📑 Lista de Convenios</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Nombre</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Institución</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Convenio</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>País</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Responsable Interno</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fecha Firma</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Años Duración</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Fecha Vencimiento</th>
            {role === "admin" && (
              <th style={{ border: "1px solid #ccc", padding: "8px" }}>Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {agreements.length === 0 ? (
            <tr>
              <td colSpan={role === "admin" ? 9 : 8} style={{ textAlign: "center", padding: "10px" }}>
                No hay convenios registrados.
              </td>
            </tr>
          ) : (
            agreements.map((a) => (
              <tr key={a.id}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.name}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.institucion}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.convenio}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.pais}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {a.profiles?.full_name || "—"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.signature_date}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.duration_years}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{a.expiration_date}</td>
                {role === "admin" && (
                  <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                    <button
                      onClick={async () => {
                        const confirmDelete = confirm("¿Deseas eliminar este convenio?");
                        if (!confirmDelete) return;

                        const { error } = await supabase
                          .from("agreements")
                          .delete()
                          .eq("id", a.id);
                        if (error) {
                          alert("Error al eliminar convenio: " + error.message);
                        } else {
                          alert("✅ Convenio eliminado correctamente");
                          fetchAgreements();
                        }
                      }}
                      style={{
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 10px",
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
  );
}

















