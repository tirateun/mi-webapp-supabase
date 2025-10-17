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
  created_at?: string;
}

export default function AgreementsList({
  user,
  role,
  onEdit,
  onCreate,
}: AgreementsListProps) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [filtered, setFiltered] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroConvenio, setFiltroConvenio] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const tiposConvenio = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

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
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error al cargar convenios:", error.message);
      setAgreements([]);
      setFiltered([]);
    } else {
      setAgreements(data || []);
      setFiltered(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  // 🔹 Aplicar filtros dinámicos
  useEffect(() => {
    let result = agreements;

    if (searchTerm.trim() !== "") {
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.pais.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtroConvenio !== "todos") {
      result = result.filter((a) => a.convenio === filtroConvenio);
    }

    if (filtroTipo !== "todos") {
      result = result.filter((a) =>
        Array.isArray(a.tipo_convenio)
          ? a.tipo_convenio.includes(filtroTipo)
          : a.tipo_convenio === filtroTipo
      );
    }

    setFiltered(result);
  }, [searchTerm, filtroConvenio, filtroTipo, agreements]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando convenios...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* ENCABEZADO */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary mb-3 mb-md-0">📄 Gestor de Convenios</h3>
        <button className="btn btn-success shadow-sm" onClick={onCreate}>
          ➕ Registrar Convenio
        </button>
      </div>

      {/* FILTROS */}
      <div className="card shadow-sm mb-4 p-3 border-0 bg-light">
        <div className="row g-3 align-items-center">
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="🔍 Buscar por nombre o país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={filtroConvenio}
              onChange={(e) => setFiltroConvenio(e.target.value)}
            >
              <option value="todos">Todos los convenios</option>
              <option value="marco">Marco</option>
              <option value="específico">Específico</option>
            </select>
          </div>

          <div className="col-md-4">
            <select
              className="form-select"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">Todos los tipos</option>
              {tiposConvenio.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead className="bg-primary text-white">
              <tr>
                <th>Nombre</th>
                <th>País</th>
                <th>Convenio</th>
                <th>Duración</th>
                <th>Fecha Firma</th>
                <th>Resolución</th>
                <th>Tipo(s)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    No se encontraron convenios.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="fw-semibold">{a.name}</td>
                    <td>{a.pais}</td>
                    <td className="text-capitalize">{a.convenio}</td>
                    <td>{a.duration_years} año(s)</td>
                    <td>
                      {a.signature_date
                        ? new Date(a.signature_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{a["Resolución Rectoral"] || "-"}</td>
                    <td>
                      {Array.isArray(a.tipo_convenio)
                        ? a.tipo_convenio.join(", ")
                        : a.tipo_convenio || "-"}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => onEdit(a)}
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}




