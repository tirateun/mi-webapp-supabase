// RenewalHistory.tsx - VERSIÓN CORREGIDA CON ESTRUCTURA REAL
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Renewal {
  id: string;
  agreement_id: string;
  old_expiration_date: string;
  new_expiration_date: string;
  changed_at: string;
  changed_by?: string;
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
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (show && agreementId) {
      fetchRenewals();
    }
  }, [show, agreementId]);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      
      // Cargar renovaciones
      const { data, error } = await supabase
        .from("agreement_renewals")
        .select("*")
        .eq("agreement_id", agreementId)
        .order("changed_at", { ascending: false }); // Más recientes primero

      if (error) throw error;
      setHistory(data || []);

      // Cargar perfiles de usuarios que hicieron las renovaciones
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.changed_by).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", userIds);

          if (profilesData) {
            const profilesMap: Record<string, string> = {};
            profilesData.forEach((p: any) => {
              profilesMap[p.user_id] = p.full_name || "Usuario";
            });
            setProfiles(profilesMap);
          }
        }
      }
    } catch (err) {
      console.error("Error cargando historial de renovaciones:", err);
      alert("Error al cargar historial de renovaciones.");
    } finally {
      setLoading(false);
    }
  };

  const calculateExtension = (oldDate: string, newDate: string) => {
    if (!oldDate || !newDate) return "-";
    const old = new Date(oldDate);
    const newD = new Date(newDate);
    const diffTime = newD.getTime() - old.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Sin extensión";
    if (diffDays < 30) return `+${diffDays} días`;
    if (diffDays < 365) return `+${Math.round(diffDays / 30)} meses`;
    const years = Math.round(diffDays / 365);
    return `+${years} año${years !== 1 ? 's' : ''}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-PE");
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("es-PE");
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
                          {formatDate(history[0]?.changed_at)}
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
                          {formatDate(history[0]?.new_expiration_date)}
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
                            <th className="px-4 py-3 fw-semibold">Fecha de Renovación</th>
                            <th className="px-4 py-3 fw-semibold">Vencimiento Anterior</th>
                            <th className="px-4 py-3 fw-semibold">Nuevo Vencimiento</th>
                            <th className="px-4 py-3 fw-semibold">Extensión</th>
                            <th className="px-4 py-3 fw-semibold">Renovado por</th>
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
                                <div>
                                  <strong>{formatDate(renewal.changed_at)}</strong>
                                </div>
                                <small className="text-muted">
                                  {new Date(renewal.changed_at).toLocaleTimeString("es-PE", {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </small>
                              </td>
                              <td className="px-4 py-3">
                                <span className="badge bg-danger-subtle text-danger">
                                  {formatDate(renewal.old_expiration_date)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="badge bg-success-subtle text-success">
                                  {formatDate(renewal.new_expiration_date)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="badge bg-primary-subtle text-primary">
                                  {calculateExtension(renewal.old_expiration_date, renewal.new_expiration_date)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <small className="text-muted">
                                  {renewal.changed_by 
                                    ? (profiles[renewal.changed_by] || "Usuario desconocido")
                                    : "Sistema"
                                  }
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
