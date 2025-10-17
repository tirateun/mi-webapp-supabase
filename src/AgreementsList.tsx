import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsListProps {
  user: any;
  role: string;
  onEdit: (agreement: any) => void;
  onCreate: () => void;
}

interface Agreement {
  id: string;
  name: string;
  pais: string;
  convenio: string;
  duration_years: number;
  signature_date: string;
  "Resolución Rectoral"?: string;
  tipo_convenio?: string[] | string;
  internal_responsible?: string;
  external_responsible?: string;
  created_at?: string;
}

export default function AgreementsList({
  user,
  role,
  onEdit,
  onCreate,
}: AgreementsListProps) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgreements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agreements")
      .select(`
        id,
        name,
        pais,
        convenio,
        duration_years,
        signature_date,
        "Resolución Rectoral",
        tipo_convenio,
        internal_responsible,
        external_responsible,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al cargar convenios:", error.message);
      setAgreements([]);
    } else {
      setAgreements(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando convenios...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-primary">Listado de Convenios</h3>
        <button className="btn btn-success" onClick={onCreate}>
          ➕ Nuevo Convenio
        </button>
      </div>

      {agreements.length === 0 ? (
        <p className="text-muted text-center">No hay convenios registrados aún.</p>
      ) : (
        <div className="table-responsive shadow-sm">
          <table className="table table-hover align-middle">
            <thead className="table-primary">
              <tr>
                <th>Nombre</th>
                <th>País</th>
                <th>Convenio</th>
                <th>Duración (años)</th>
                <th>Fecha Firma</th>
                <th>Resolución Rectoral</th>
                <th>Tipo(s)</th>
                <th>Interno</th>
                <th>Externo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.pais}</td>
                  <td className="text-capitalize">{a.convenio}</td>
                  <td>{a.duration_years}</td>
                  <td>{a.signature_date ? new Date(a.signature_date).toLocaleDateString() : "-"}</td>
                  <td>{a["Resolución Rectoral"] || "-"}</td>
                  <td>
                    {Array.isArray(a.tipo_convenio)
                      ? a.tipo_convenio.join(", ")
                      : a.tipo_convenio || "-"}
                  </td>
                  <td>{a.internal_responsible || "-"}</td>
                  <td>{a.external_responsible || "-"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(a)}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}




