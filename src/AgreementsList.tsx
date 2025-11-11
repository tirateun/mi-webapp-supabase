import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import InformeSemestralModal from "./InformeSemestralModal";

interface AgreementsListProps {
  user: any;
  role: string;
  onEdit: (agreement: any) => void;
  onCreate: () => void;
  onOpenContraprestaciones: (agreementId: string) => void;
  onOpenEvidencias: (agreementId: string) => void;
  onOpenInforme: (agreementId: string) => void;
}

export default function AgreementsList({
  user,
  role,
  onEdit,
  onCreate,
  onOpenContraprestaciones,
  onOpenEvidencias,
  onOpenInforme,
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

  useEffect(() => {
    if (!user?.id || !role) return;
    fetchAgreements();
  }, [user?.id, role]);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("agreements")
        .select("*")
        .order("created_at", { ascending: false });

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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar el convenio "${name}"?`)) return;

    try {
      const { error } = await supabase.from("agreements").delete().eq("id", id);
      if (error) {
        console.error(error);
        alert("❌ Error al eliminar: " + error.message);
      } else {
        setAgreements((prev) => prev.filter((a) => a.id !== id));
        setFiltered((prev) => prev.filter((a) => a.id !== id));
        alert("✅ Convenio eliminado correctamente");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error inesperado al eliminar");
    }
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  useEffect(() => {
    let result = agreements;

    if (search.trim()) {
      result = result.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedTipos.length > 0) {
      result = result.filter((a) =>
        a.tipo_convenio?.some((t: string) => selectedTipos.includes(t))
      );
    }

    setFiltered(result);
  }, [search, selectedTipos, agreements]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary">
          📄 Lista de Convenios
        </h3>
        {role === "admin" && (
          <button className="btn btn-success shadow-sm" onClick={onCreate}>
            ➕ Nuevo Convenio
          </button>
        )}
      </div>

      {/* 🔍 Filtros y búsqueda */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <div className="row align-items-center">
          <div className="col-md-4 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar convenio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-8 d-flex flex-wrap">
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

      {/* 🔹 Tabla de convenios */}
      {loading ? (
        <p className="text-center">Cargando convenios...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted">No se encontraron convenios.</p>
      ) : (
        <div
          className="table-responsive shadow-sm"
          style={{
            maxHeight: "600px",
            overflowX: "auto",
            borderRadius: "10px",
            border: "1px solid #ddd",
          }}
        >
          <table
            className="table table-bordered align-middle table-hover"
            style={{
              fontSize: "0.9rem",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            <thead
              className="table-primary sticky-top"
              style={{ top: 0, zIndex: 1 }}
            >
              <tr>
                <th style={{ minWidth: "250px" }}>Nombre</th>
                <th>Tipo</th>
                <th>Subtipo Docente</th>
                <th>País</th>
                <th>Resolución Rectoral</th>
                <th>Duración (años)</th>
                <th style={{ minWidth: "300px" }}>Objetivos</th>
                <th>Fecha Firma</th>
                <th style={{ minWidth: "350px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={{ textAlign: "left" }}>{a.name}</td>
                  <td>{a.convenio || "-"}</td>
                  <td>{a.sub_tipo_docente || "-"}</td>
                  <td>{a.pais || "-"}</td>
                  <td>{a["Resolución Rectoral"] || "-"}</td>
                  <td>{a.duration_years}</td>
                  <td style={{ textAlign: "left", whiteSpace: "normal" }}>
                    {a.objetivos || "-"}
                  </td>
                  <td>
                    {a.signature_date
                      ? new Date(a.signature_date).toLocaleDateString("es-PE")
                      : "-"}
                  </td>
                  <td>
                    <div
                      className="d-flex justify-content-center align-items-center flex-wrap gap-2"
                      style={{
                        minWidth: "420px",
                        gap: "8px",
                      }}
                    >
                      {role === "admin" && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                            style={{ minWidth: "110px" }}
                            onClick={() => onEdit(a)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger d-flex align-items-center"
                            style={{ minWidth: "110px" }}
                            onClick={() => handleDelete(a.id, a.name)}
                          >
                            🗑️ Eliminar
                          </button>
                        </>
                      )}
                      <button
                        className="btn btn-sm btn-outline-success d-flex align-items-center"
                        style={{ minWidth: "140px" }}
                        onClick={() => onOpenContraprestaciones(a.id)}
                      >
                        📋 Programar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning d-flex align-items-center"
                        style={{ minWidth: "140px" }}
                        onClick={() => onOpenEvidencias(a.id)}
                      >
                        📂 Cumplimiento
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary d-flex align-items-center"
                        style={{ minWidth: "120px" }}
                        onClick={() => (window.location.href = `/informe/${a.id}`)}
                      >
                        📝 Informe
                      </button>
                    </div>
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

















