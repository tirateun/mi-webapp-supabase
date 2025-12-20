// src/AgreementDetailsModal.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementDetailsModalProps {
  show: boolean;
  onClose: () => void;
  agreementId: string;
}

export default function AgreementDetailsModal({
  show,
  onClose,
  agreementId,
}: AgreementDetailsModalProps) {
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [internals, setInternals] = useState<any[]>([]);
  const [external, setExternal] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    if (show && agreementId) {
      loadAgreementDetails();
    }
  }, [show, agreementId]);

  const loadAgreementDetails = async () => {
    setLoading(true);
    try {
      // Cargar convenio
      const { data: agreementData, error: agreementError } = await supabase
        .from("agreements")
        .select("*")
        .eq("id", agreementId)
        .single();

      if (agreementError) throw agreementError;
      setAgreement(agreementData);

      // Cargar responsables internos - MÉTODO SIMPLIFICADO
      const { data: internalsLinks, error: internalsError } = await supabase
        .from("agreement_internal_responsibles")
        .select("internal_responsible_id")
        .eq("agreement_id", agreementId);

      if (!internalsError && internalsLinks && internalsLinks.length > 0) {
        // Obtener IDs de responsables
        const internalIds = internalsLinks.map((link: any) => link.internal_responsible_id);
        
        // Cargar perfiles de esos responsables
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", internalIds);

        if (!profilesError && profilesData) {
          setInternals(profilesData);
        }
      } else {
        setInternals([]);
      }

      // Cargar responsable externo
      if (agreementData?.external_responsible) {
        const { data: externalData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", agreementData.external_responsible)
          .single();
        
        if (externalData) setExternal(externalData);
      }

      // Cargar áreas vinculadas - MÉTODO SIMPLIFICADO
      const { data: areasLinks } = await supabase
        .from("agreement_areas_vinculadas")
        .select("area_vinculada_id")
        .eq("agreement_id", agreementId);

      if (areasLinks && areasLinks.length > 0) {
        const areaIds = areasLinks.map((link: any) => link.area_vinculada_id);
        
        const { data: areasData } = await supabase
          .from("areas_vinculadas")
          .select("id, nombre")
          .in("id", areaIds);

        if (areasData) {
          setAreas(areasData);
        }
      } else {
        setAreas([]);
      }

    } catch (err) {
      console.error("Error cargando detalles del convenio:", err);
      alert("Error al cargar los detalles del convenio");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-PE");
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
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <div className="text-white">
              <h4 className="modal-title mb-1 fw-bold">
                📋 Detalles del Convenio
              </h4>
              <p className="mb-0 opacity-75">Información completa del convenio</p>
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
                <p className="mt-3 text-muted">Cargando detalles...</p>
              </div>
            ) : !agreement ? (
              <div className="text-center py-5">
                <div style={{ fontSize: "4rem", opacity: 0.3 }}>📄</div>
                <h5 className="text-muted mt-3">No se encontró el convenio</h5>
              </div>
            ) : (
              <>
                {/* INFORMACIÓN BÁSICA */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white border-0 p-4">
                    <h5 className="mb-0 fw-bold">📄 Información Básica</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      <div className="col-md-12">
                        <label className="fw-bold text-muted small">Nombre del Convenio</label>
                        <div className="fs-5">{agreement.name || "-"}</div>
                      </div>

                      <div className="col-md-6">
                        <label className="fw-bold text-muted small">Tipo de Convenio</label>
                        <div>
                          <span className="badge bg-primary">
                            {agreement.convenio || "-"}
                          </span>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="fw-bold text-muted small">Resolución Rectoral</label>
                        <div>{agreement["Resolución Rectoral"] || "-"}</div>
                      </div>

                      <div className="col-md-4">
                        <label className="fw-bold text-muted small">Fecha de Firma</label>
                        <div>{formatDate(agreement.signature_date)}</div>
                      </div>

                      <div className="col-md-4">
                        <label className="fw-bold text-muted small">Duración</label>
                        <div>{agreement.duration_years} {agreement.duration_years === 1 ? "año" : "años"}</div>
                      </div>

                      <div className="col-md-4">
                        <label className="fw-bold text-muted small">País</label>
                        <div>
                          <span className="badge bg-success-subtle text-success">
                            {agreement.pais || "No especificado"}
                          </span>
                        </div>
                      </div>

                      {agreement.tipo_convenio && agreement.tipo_convenio.length > 0 && (
                        <div className="col-md-12">
                          <label className="fw-bold text-muted small">Categorías</label>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {agreement.tipo_convenio.map((tipo: string, idx: number) => (
                              <span key={idx} className="badge bg-info-subtle text-info">
                                {tipo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {agreement.sub_tipo_docente && (
                        <div className="col-md-12">
                          <label className="fw-bold text-muted small">Subtipo Docente</label>
                          <div>{agreement.sub_tipo_docente}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ENLACE AL DOCUMENTO */}
                {agreement.document_url && (
                  <div className="card border-0 shadow-sm mb-4 border-start border-primary border-4">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="mb-1 fw-bold text-primary">
                            📎 Documento del Convenio
                          </h6>
                          <small className="text-muted">
                            Accede al documento original almacenado
                          </small>
                        </div>
                        <a
                          href={agreement.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          🔗 Abrir Documento
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESPONSABLES */}
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-header bg-white border-0 p-4">
                    <h5 className="mb-0 fw-bold">👥 Responsables</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="fw-bold text-muted small">Responsables Internos</label>
                        {internals.length > 0 ? (
                          <ul className="list-unstyled mt-2 mb-0">
                            {internals.map((person: any) => (
                              <li key={person.id} className="mb-2">
                                <span className="badge bg-secondary me-2">👤</span>
                                <strong>{person.full_name}</strong>
                                {person.email && (
                                  <div className="text-muted small ms-4">
                                    {person.email}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-muted">No asignados</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="fw-bold text-muted small">Responsable Externo</label>
                        {external ? (
                          <div className="mt-2">
                            <span className="badge bg-warning me-2">👤</span>
                            <strong>{external.full_name}</strong>
                            {external.email && (
                              <div className="text-muted small ms-4">
                                {external.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted">No asignado</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ÁREAS VINCULADAS */}
                {areas.length > 0 && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0 p-4">
                      <h5 className="mb-0 fw-bold">🏢 Áreas Vinculadas</h5>
                    </div>
                    <div className="card-body p-4">
                      <div className="d-flex flex-wrap gap-2">
                        {areas.map((area: any) => (
                          <span key={area.id} className="badge bg-light text-dark border px-3 py-2">
                            {area.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* OBJETIVOS */}
                {agreement.objetivos && (
                  <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0 p-4">
                      <h5 className="mb-0 fw-bold">🎯 Objetivos</h5>
                    </div>
                    <div className="card-body p-4">
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                        {agreement.objetivos}
                      </div>
                    </div>
                  </div>
                )}

                {/* INFORMACIÓN ADICIONAL */}
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 p-4">
                    <h5 className="mb-0 fw-bold">ℹ️ Información Adicional</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="fw-bold text-muted small">Estado</label>
                        <div>
                          <span className={`badge ${agreement.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}`}>
                            {agreement.estado || "No especificado"}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label className="fw-bold text-muted small">Versión</label>
                        <div>{agreement.version || 1}</div>
                      </div>
                      <div className="col-md-4">
                        <label className="fw-bold text-muted small">Última Actualización</label>
                        <div>
                          <small>{formatDate(agreement.updated_at)}</small>
                        </div>
                      </div>
                    </div>
                  </div>
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