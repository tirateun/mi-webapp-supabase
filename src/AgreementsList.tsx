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

  // 🔹 Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroConvenio, setFiltroConvenio] = useState("todos");
  const [filtrosTipo, setFiltrosTipo] = useState<string[]>([]);

  const tiposConvenio = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

  // 🔹 Cargar convenios
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

  // 🔹 Manejo de cambios en el filtro múltiple
  const toggleFiltroTipo = (tipo: string) => {
    setFiltrosTipo((prev) =>
      prev.includes(tipo)
        ? prev.filter((t) => t !== tipo)
        : [...prev, tipo]
    );
  };

  // 🔹 Aplicar filtros dinámicos
  useEffect(() => {
    let result = agreements;

    // 🔍 Filtro por nombre o país
    if (searchTerm.trim() !== "") {
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.pais.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 📘 Filtro por tipo de convenio (marco / específico)
    if (filtroConvenio !== "todos") {
      result = result.filter((a) => a.convenio === filtroConvenio);
    }

    // ✅ Filtro múltiple (modo OR)
    if (filtrosTipo.length > 0) {
      result = result.filter((a) => {
        if (!a.tipo_convenio) return false;
        const tipos = Array.isArray(a.tipo_convenio)
          ? a.tipo_convenio
          : [a.tipo_convenio];
        return tipos.some((t) => filtrosTipo.includes(t));
      });
    }

    setFiltered(result);
  }, [searchTerm, filtroConvenio, filtrosTipo, agreements]);

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
      <div className="card shadow-sm mb-4 p-4 border-0 bg-light">
        <div className="row g-3 align-items-center">
          {/* 🔍 Buscar */}
          <div className="col-md-4">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre o país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* 📘 Tipo de convenio (Marco / Específico) */}
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
        </div>

        {/* ✅ Filtros múltiples */}
        <div className="mt-3">
          <label className="fw-semibold text-secondary">Filtrar por tipo:</label>
          <div className="d-flex flex-wrap mt-2">
            {tiposConvenio.map((tipo) => (
              <div key={tipo} className="form-check me-3 mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`chk-${tipo}`}
                  checked={filtrosTipo.includes(tipo)}
                  onChange={() => toggleFiltroTipo(tipo)}
                />
                <label className="form-check-label" htmlFor={`chk-${tipo}`}>
                  {tipo}
                </label>
              </div>
            ))}
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






