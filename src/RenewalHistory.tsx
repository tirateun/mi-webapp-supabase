// RenewalHistory.tsx - VERSIÓN MEJORADA COMO MODAL
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Renewal {
  id: string;
  agreement_id: string;
  renewal_year: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface RenewalHistoryProps {
  show: boolean;
  onClose: () => void;
  agreementId: string;
  agreementName: string;
}

export default function RenewalHistory({ 
  show, 
  onClose, 
  agreementId, 
  agreementName 
}: RenewalHistoryProps) {
  const [history, setHistory] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && agreementId) {
      fetchRenewals();
    }
  }, [show, agreementId]);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agreement_renewals")
        .select("id, agreement_id, renewal_year, start_date, end_date, created_at")
        .eq("agreement_id", agreementId)
        .order("created_at", { ascending: false }); // Más recientes primero

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Error cargando historial de renovaciones:", err);
      alert("Error al cargar historial de renovaciones.");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} días`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} meses`;
    const years = Math.round(diffDays / 365);
    return `${years} año${years !== 1 ? 's' : ''}`;
  };

  if (!show) return null;

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg">
          {/* HEADER */}
          <div 
            className="modal-header" 
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            <div className="text-white">
              <h4 className="modal-title mb-1 fw-bold">
                📜 Historial de Renovaciones
              </h4>
              <p className="mb-0 opacity-75">{agreementName}</p>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>

          {/* BODY */}
          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-3 text-muted">Cargando historial...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ fontSize: "4rem", opacity: 0.3 }}>📋</div>
                <h5 className="text-muted mt-3">No hay renovaciones registradas</h5>
                <p className="text-muted">Este convenio aún no ha sido renovado</p>
              </div>
            ) : (
              <>
                {/* RESUMEN */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div 
                      className="card border-0 h-100" 
                      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
                    >
                      <div className="card-body text-white text-center">
                        <h6 className="opacity-75 mb-2">Total de Renovaciones</h6>
                        <h2 className="mb-0 fw-bold">{history.length}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div 
                      className="card border-0 h-100" 
                      style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}
                    >
                      <div className="card-body text-white text-center">
                        <h6 className="opacity-75 mb-2">Última Renovación</h6>
                        <h5 className="mb-0 fw-bold">
                          {new Date(history[0]?.created_at).toLocaleDateString("es-PE")}
                        </h5>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div 
                      className="card border-0 h-100" 
                      style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}
                    >
                      <div className="card-body text-white text-center">
                        <h6 className="opacity-75 mb-2">Vencimiento Actual</h6>
                        <h5 className="mb-0 fw-bold">
                          {new Date(history[0]?.end_date).toLocaleDateString("es-PE")}
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABLA DE RENOVACIONES */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 p-4">
                    <h5 className="mb-0 fw-bold">
                      📅 Línea de Tiempo de Renovaciones
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            <th className="px-4 py-3 fw-semibold" style={{ width: "50px" }}>#</th>
                            <th className="px-4 py-3 fw-semibold">Año Renovación</th>
                            <th className="px-4 py-3 fw-semibold">Fecha Inicio</th>
                            <th className="px-4 py-3 fw-semibold">Fecha Fin</th>
                            <th className="px-4 py-3 fw-semibold">Duración</th>
                            <th className="px-4 py-3 fw-semibold">Fecha Registro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((renewal, index) => (
                            <tr 
                              key={renewal.id}
                              style={{ 
                                backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
                                borderLeft: index === 0 ? "4px solid #667eea" : "none"
                              }}
                            >
                              <td className="px-4 py-3 text-center">
                                <span 
                                  className="badge rounded-pill" 
                                  style={{ 
                                    backgroundColor: index === 0 ? "#667eea" : "#e9ecef",
                                    color: index === 0 ? "white" : "#6c757d",
                                    fontSize: "0.9rem",
                                    padding: "0.5rem 0.75rem"
                                  }}
                                >
                                  {history.length - index}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="badge bg-info-subtle text-info">
                                  Año {renewal.renewal_year}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="badge bg-success-subtle text-success">
                                  {new Date(renewal.start_date).toLocaleDateString("es-PE")}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="badge bg-danger-subtle text-danger">
                                  {new Date(renewal.end_date).toLocaleDateString("es-PE")}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="badge bg-primary-subtle text-primary">
                                  {calculateDuration(renewal.start_date, renewal.end_date)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <strong>{new Date(renewal.created_at).toLocaleDateString("es-PE")}</strong>
                                </div>
                                <small className="text-muted">
                                  {new Date(renewal.created_at).toLocaleTimeString("es-PE", { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* NOTA INFORMATIVA */}
                <div className="alert alert-light border mt-4 mb-0">
                  <small className="text-muted">
                    ℹ️ <strong>Nota:</strong> Las renovaciones están ordenadas de la más reciente a la más antigua. 
                    La renovación marcada con borde morado es la más actual.
                  </small>
                </div>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer bg-light border-0">
            <button className="btn btn-secondary px-4" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
