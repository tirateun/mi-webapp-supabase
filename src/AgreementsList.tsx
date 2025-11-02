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
  const [showInformeModal, setShowInformeModal] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState<any | null>(null);

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
        const filteredData = (data || []).filter(
          (a) =>
            ["admin", "Admin", "Administrador"].includes(role) ||
            a.internal_responsible === user.id ||
            a.external_responsible === user.id
        );
        setAgreements(filteredData);
        setFiltered(filteredData);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filteredData = agreements;

    if (search.trim() !== "") {
      filteredData = filteredData.filter((a) =>
        a.name?.toLowerCase().includes(search.toLowerCase())
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
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 className="fw-bold text-primary" style={{ margin: 0 }}>📄 Lista de Convenios</h3>
        {role === "admin" && (
          <button className="btn btn-success" onClick={onCreate}>
            ➕ Nuevo Convenio
          </button>
        )}
      </div>

      {/* filtros */}
      <div className="card p-3 shadow-sm border-0 mb-4" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar convenio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tipos.map((tipo) => (
              <button
                key={tipo}
                className={`btn btn-sm ${selectedTipos.includes(tipo) ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => toggleTipo(tipo)}
              >
                {tipo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* tabla */}
      {loading ? (
        <p className="text-center">Cargando convenios...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted">No se encontraron convenios.</p>
      ) : (
        <div style={{ overflowX: "auto", background: "white", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e6edf3" }}>
              <tr>
                <th style={{ padding: 12, textAlign: "left" }}>Nombre</th>
                <th style={{ padding: 12 }}>Tipo</th>
                <th style={{ padding: 12 }}>Subtipo Docente</th>
                <th style={{ padding: 12 }}>País</th>
                <th style={{ padding: 12 }}>Resolución Rectoral</th>
                <th style={{ padding: 12 }}>Duración (años)</th>
                <th style={{ padding: 12 }}>Objetivos</th>
                <th style={{ padding: 12 }}>Fecha Firma</th>
                <th style={{ padding: 12, textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid #eef2f6" }}>
                  <td style={{ padding: 12, verticalAlign: "top", maxWidth: 300, whiteSpace: "normal" }} className="fw-semibold">{a.name}</td>
                  <td style={{ padding: 12 }}>{a.convenio ? a.convenio.charAt(0).toUpperCase() + a.convenio.slice(1) : "-"}</td>
                  <td style={{ padding: 12 }}>{a.sub_tipo_docente || "-"}</td>
                  <td style={{ padding: 12 }}>{a.pais || "-"}</td>
                  <td style={{ padding: 12 }}>{a["Resolución Rectoral"] || "-"}</td>
                  <td style={{ padding: 12 }}>{a.duration_years}</td>
                  <td style={{ padding: 12, maxWidth: 250, whiteSpace: "pre-wrap" }}>{a.objetivos || "-"}</td>
                  <td style={{ padding: 12 }}>
                    {a.signature_date ? new Date(a.signature_date).toLocaleDateString("es-PE") : "-"}
                  </td>
                  <td style={{ padding: 12, display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                    {/* Informe funcional (usa el callback que App.tsx implementa) */}
                    <button
                      className="btn btn-outline-warning btn-sm"
                      onClick={() => onOpenInforme(a.id)}
                    >
                      📝 Informe
                    </button>

                    {/* Editar (solo admin) */}
                    {role === "admin" && (
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => onEdit(a)}
                      >
                        ✏️ Editar
                      </button>
                    )}

                    {/* Programar */}
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => onOpenContraprestaciones(a.id)}
                    >
                      📋 Programar
                    </button>

                    {/* Cumplimiento */}
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

      {showInformeModal && selectedConvenio && (
        <InformeSemestralModal
          convenioId={selectedConvenio.id}
          onClose={() => {
            setShowInformeModal(false);
            setSelectedConvenio(null);
          }}
        />
      )}
    </div>
  );
}













