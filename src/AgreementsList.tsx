import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsListProps {
  user: any;
  role: string;
}

export default function AgreementsList({ user, role }: AgreementsListProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);

    let query = supabase
      .from("agreements")
      .select(
        `
        id, name, institucion, convenio, pais, 
        signature_date, duration_years, expiration_date,
        profiles!agreements_internal_responsible_fkey (full_name)
      `
      )
      .order("created_at", { ascending: false });

    // Si no es admin, solo muestra donde es responsable
    if (role !== "admin") {
      query = query.eq("internal_responsible", user.id);
    }

    const { data, error } = await query;

    if (error) console.error("Error al cargar convenios:", error);
    else setAgreements(data || []);

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro de eliminar este convenio?")) return;
    const { error } = await supabase.from("agreements").delete().eq("id", id);
    if (error) alert("Error al eliminar");
    else {
      alert("Convenio eliminado");
      fetchAgreements();
    }
  };

  if (loading) return <p>Cargando convenios...</p>;

  return (
    <div>
      <h2>📄 Lista de convenios</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#E2E8F0" }}>
            <th>Nombre</th>
            <th>Institución</th>
            <th>Tipo de convenio</th>
            <th>País</th>
            <th>Responsable interno</th>
            <th>Fecha firma</th>
            <th>Duración</th>
            <th>Vencimiento</th>
            {role === "admin" && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {agreements.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.institucion}</td>
              <td>{a.convenio}</td>
              <td>{a.pais}</td>
              <td>{a.profiles?.full_name || "—"}</td>
              <td>{a.signature_date}</td>
              <td>{a.duration_years} años</td>
              <td>{a.expiration_date}</td>
              {role === "admin" && (
                <td>
                  <button
                    onClick={() => handleDelete(a.id)}
                    style={{ color: "red" }}
                  >
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
