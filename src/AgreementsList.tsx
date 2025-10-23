import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementsListProps {
  user: any;
  role: string;
  onEdit: (agreement: any) => void;
  onCreate: () => void;
  onOpenContraprestaciones: (agreementId: string) => void;
  onOpenEvidencias: (agreementId: string) => void;
}

export default function AgreementsList({
  user,
  role,
  onEdit,
  onCreate,
  onOpenContraprestaciones,
  onOpenEvidencias,
}: AgreementsListProps) {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const tipos = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

  // 🔹 Cargar convenios
  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from("agreements")
        .select("*")
        .order("created_at", { ascending: false });

      // 🔹 Filtra según rol del usuario
      if (["internal", "interno"].includes(role)) {
        query = query.eq("internal_responsible", user.id);
      } else if (["external", "externo"].includes(role)) {
        query = query.eq("external_responsible", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error al cargar convenios:", error);
        alert("Error al cargar convenios. Revisa consola.");
      } else {
        setAgreements(data || []);
        setFiltered(data || []);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Filtrar por búsqueda y tipo de convenio
  useEffect(() => {
    let filteredData = agreements;

    if (search.trim() !== "") {
      filteredData = filteredData.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedTipos.length > 0) {
      filteredData = filteredData.filter((a) =>
        a.tipo_convenio?.some((t: string) => selectedTipos.includes(t))
      );
    }

    setFiltered(filteredData);
  }, [search, selectedTipos, agreements]);

  const toggleTipo = (tipo: string) => {
    setSelectedTipos((prev) =>
      prev.includes(tipo)
        ? prev.filter((t) => t !== tipo)
        : [...prev, tipo]
    );
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">📄 Lista de Convenios</h3>
        {role === "admin" && (
          <button className="btn btn-success" onClick={onCreate}>
            ➕ Nuevo Convenio
          </button>
        )}
      </div>

      {/* 🔍 Filtros y búsqueda */}
      <div className="card p-3 shadow-sm border-0 mb-4">
        <div className="row">
          <div className="col-md-6 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar convenio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-6 mb-2">
            <div className="d-flex flex-wrap">
              {tipos.map((tipo) => (
                <button
                  key={tipo}
                  className={`btn btn-sm me-2 mb-2 ${
                    selectedTipos.includes(tipo)
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => toggleTipo(tipo)}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Tabla de convenios */}
      {loading ? (
        <p className="text-center">Cargando convenios...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted">No se encontraron convenios.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-primary">
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Subtipo Docente</th>
                <th>País</th>
                <th>Resolución Rectoral</th>
                <th>Duración (años)</th>
                <th>Objetivos</th>
                <th>Fecha Firma</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="fw-semibold">{a.name}</td>
                  <td>
                    {a.convenio
                      ? a.convenio.charAt(0).toUpperCase() + a.convenio.slice(1)
                      : "-"}
                  </td>
                  <td>{a.sub_tipo_docente || "-"}</td>
                  <td>{a.pais || "-"}</td>
                  <td>{a["Resolución Rectoral"] || "-"}</td>
                  <td>{a.duration_years}</td>
                  <td style={{ maxWidth: "250px", whiteSpace: "pre-wrap" }}>
                    {a.objetivos || "-"}
                  </td>
                  <td>
                    {a.signature_date
                      ? new Date(a.signature_date).toLocaleDateString("es-PE")
                      : "-"}
                  </td>
                  <td className="d-flex flex-wrap gap-2">
                    {role === "admin" && (
                      <>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => onEdit(a)}
                        >
                          ✏️ Editar
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => onOpenContraprestaciones(a.id)}
                    >
                      📋 Programar
                    </button>
                    <button
                      className="btn btn-outline-info btn-sm"
                      onClick={() => onOpenEvidencias(a.id)}
                    >
                      📂 Cumplimiento
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









