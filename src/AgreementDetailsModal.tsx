// src/AgreementDetailsModal.tsx
// ✅ VERSIÓN ADAPTADA CON SISTEMA HÍBRIDO DE INFORMES
import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import InformesRouter from "./InformesRouter";

interface AgreementDetailsModalProps {
  show: boolean;
  onClose: () => void;
  agreementId: string;
}

interface Subtype {
  id: string;
  subtipo_nombre: string;
  responsables: any[];
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
  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  
  // 🆕 Estado para tabs
  const [activeTab, setActiveTab] = useState<"detalles" | "informes">("detalles");

  useEffect(() => {
    if (show && agreementId) {
      loadAgreementDetails();
      setActiveTab("detalles"); // Reset tab cuando se abre
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

      // 🆕 Cargar institución asociada para obtener email del contacto
      let institucionData = null;
      if (agreementData?.institucion_id) {
        const { data: inst } = await supabase
          .from("instituciones")
          .select("contacto, email")
          .eq("id", agreementData.institucion_id)
          .single();
        
        if (inst) {
          institucionData = inst;
          console.log("🏢 Institución cargada:", inst);
        }
      }

      // Verificar si tiene subtipos
      const { data: subtypesData, error: subtypesError } = await supabase
        .from("agreement_subtypes")
        .select("id, subtipo_nombre")
        .eq("agreement_id", agreementId);

      const hasSubtypes = subtypesData && subtypesData.length > 0;

      if (hasSubtypes) {
        // Cargar responsables POR SUBTIPO
        const subtypesWithResponsibles: Subtype[] = [];

        for (const subtype of subtypesData) {
          // Cargar responsables de este subtipo
          const { data: responsiblesLinks } = await supabase
            .from("subtype_internal_responsibles")
            .select("internal_responsible_id")
            .eq("subtype_id", subtype.id);

          if (responsiblesLinks && responsiblesLinks.length > 0) {
            const responsibleIds = responsiblesLinks.map((r: any) => r.internal_responsible_id);

            // Obtener perfiles
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, full_name, email")
              .in("id", responsibleIds);

            subtypesWithResponsibles.push({
              id: subtype.id,
              subtipo_nombre: subtype.subtipo_nombre,
              responsables: profilesData || [],
            });
          } else {
            subtypesWithResponsibles.push({
              id: subtype.id,
              subtipo_nombre: subtype.subtipo_nombre,
              responsables: [],
            });
          }
        }

        setSubtypes(subtypesWithResponsibles);
        setInternals([]); // No hay responsables generales
      } else {
        // Cargar responsables internos GENERALES (método anterior)
        const { data: internalsLinks, error: internalsError } = await supabase
          .from("agreement_internal_responsibles")
          .select("internal_responsible_id")
          .eq("agreement_id", agreementId);

        if (!internalsError && internalsLinks && internalsLinks.length > 0) {
          const internalIds = internalsLinks.map((link: any) => link.internal_responsible_id);

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
        setSubtypes([]);
      }

      // Cargar responsable externo (ahora "contacto de la institución")
      if (agreementData?.external_responsible) {
        const responsableValue = agreementData.external_responsible;
        const emailContacto = institucionData?.email || null; // 🆕 Email desde institución
        
        console.log("📋 Cargando contacto:", responsableValue, "Email:", emailContacto);
        
        // Verificar si es UUID (legacy) o texto
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(responsableValue)) {
          console.log("🔍 Es UUID, buscando en profiles...");
          // Es UUID legacy, buscar en profiles
          const { data: externalData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", responsableValue)
            .single();

          if (externalData) {
            console.log("✅ Perfil encontrado:", externalData.full_name);
            setExternal(externalData);
          } else {
            console.log("⚠️ UUID no encontrado, mostrando como texto");
            // UUID no encontrado, mostrar como texto con email de institución
            setExternal({ id: '', full_name: responsableValue, email: emailContacto });
          }
        } else {
          console.log("✅ Es texto, mostrando directamente:", responsableValue);
          // Es texto (nuevo formato desde institución) con email
          setExternal({ id: '', full_name: responsableValue, email: emailContacto });
        }
      } else {
        console.log("ℹ️ No hay contacto asignado");
        setExternal(null);
      }

      // Cargar áreas vinculadas
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

  // ✅ Función para formatear fechas sin problemas de zona horaria
  const formatDate = (dateString: string) => {
    if (!dateString) return "No especificada";
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ background: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* HEADER */}
          <div className="modal-header bg-primary text-white py-3">
            <div>
              <h4 className="modal-title mb-1 fw-bold">
                📋 Detalles del Convenio
              </h4>
              {agreement && (
                <small className="opacity-75">{agreement.name}</small>
              )}
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          {/* 🆕 TABS NAVIGATION */}
          <div className="modal-header bg-light border-0 py-2">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn ${activeTab === "detalles" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("detalles")}
              >
                <i className="bi bi-info-circle me-2"></i>
                Información General
              </button>
              <button
                type="button"
                className={`btn ${activeTab === "informes" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("informes")}
              >
                <i className="bi bi-file-text me-2"></i>
                Informes
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted mt-3">Cargando información...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: DETALLES (contenido original) */}
                {activeTab === "detalles" && agreement && (
                  <>
                    {/* INFORMACIÓN BÁSICA */}
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-white border-0 p-4">
                        <h5 className="mb-0 fw-bold">📄 Información Básica</h5>
                      </div>
                      <div className="card-body p-4">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="fw-bold text-muted small">Nombre del Convenio</label>
                            <div className="mt-1">{agreement.name}</div>
                          </div>
                          <div className="col-md-3">
                            <label className="fw-bold text-muted small">Tipo</label>
                            <div className="mt-1">
                              {agreement.tipo_convenio && agreement.tipo_convenio.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {agreement.tipo_convenio.map((tipo: string, idx: number) => (
                                    <span key={idx} className="badge bg-primary">{tipo}</span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted">No especificado</span>
                              )}
                            </div>
                          </div>
                          <div className="col-md-3">
                            <label className="fw-bold text-muted small">Categoría</label>
                            <div className="mt-1">
                              <span className="badge bg-secondary">
                                {agreement.convenio || "No especificado"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="row g-3 mt-2">
                          <div className="col-md-4">
                            <label className="fw-bold text-muted small">Fecha de Firma</label>
                            <div className="mt-1">
                              <i className="bi bi-calendar-check text-primary me-2"></i>
                              {formatDate(agreement.signature_date)}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="fw-bold text-muted small">Duración</label>
                            <div className="mt-1">
                              <i className="bi bi-hourglass-split text-warning me-2"></i>
                              {agreement.duration_years} años
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="fw-bold text-muted small">Fecha de Expiración</label>
                            <div className="mt-1">
                              <i className="bi bi-calendar-x text-danger me-2"></i>
                              {formatDate(agreement.expiration_date)}
                            </div>
                          </div>
                        </div>

                        {agreement["Resolución Rectoral"] && (
                          <div className="row g-3 mt-2">
                            <div className="col-md-12">
                              <label className="fw-bold text-muted small">Resolución Rectoral</label>
                              <div className="mt-1">
                                <span className="badge bg-info text-dark">
                                  {agreement["Resolución Rectoral"]}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DOCUMENTO */}
                    {agreement.document_url && (
                      <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-0 p-4">
                          <h5 className="mb-0 fw-bold">📎 Documento</h5>
                        </div>
                        <div className="card-body p-4">
                          <div className="d-flex align-items-center gap-3 p-3 bg-light rounded">
                            <i className="bi bi-file-pdf text-danger" style={{ fontSize: "2rem" }}></i>
                            <div className="flex-grow-1">
                              <strong>Documento del Convenio</strong>
                              <small className="d-block text-muted">
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

                    {/* RESPONSABLES - CON SUBTIPOS */}
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-white border-0 p-4">
                        <h5 className="mb-0 fw-bold">👥 Responsables</h5>
                      </div>
                      <div className="card-body p-4">
                        {subtypes.length > 0 ? (
                          // Mostrar responsables POR SUBTIPO
                          <>
                            <div className="alert alert-info mb-3">
                              <strong>ℹ️ Convenio con subtipos:</strong> Los responsables están asignados por subtipo específico
                            </div>

                            {subtypes.map((subtype) => (
                              <div key={subtype.id} className="card mb-3 border-primary">
                                <div className="card-header bg-primary bg-opacity-10">
                                  <h6 className="mb-0 fw-bold text-primary">
                                    📚 {subtype.subtipo_nombre}
                                  </h6>
                                </div>
                                <div className="card-body">
                                  <label className="fw-bold text-muted small">Responsables Internos:</label>
                                  {subtype.responsables.length > 0 ? (
                                    <ul className="list-unstyled mt-2 mb-0">
                                      {subtype.responsables.map((person: any) => (
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
                                    <div className="text-muted mt-2">No asignados</div>
                                  )}
                                </div>
                              </div>
                            ))}

                            <div className="row g-3 mt-3">
                              <div className="col-md-12">
                                <label className="fw-bold text-muted small">Contacto de la Institución</label>
                                {external ? (
                                  <div className="mt-2">
                                    <span className="badge bg-warning me-2">👤</span>
                                    <strong>{external.full_name}</strong>
                                    {external.email && (
                                      <div className="text-muted small ms-4">
                                        📧 {external.email}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-muted">No asignado</div>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          // Mostrar responsables GENERALES (sin subtipos)
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
                              <label className="fw-bold text-muted small">Contacto de la Institución</label>
                              {external ? (
                                <div className="mt-2">
                                  <span className="badge bg-warning me-2">👤</span>
                                  <strong>{external.full_name}</strong>
                                  {external.email && (
                                    <div className="text-muted small ms-4">
                                      📧 {external.email}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-muted">No asignado</div>
                              )}
                            </div>
                          </div>
                        )}
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

                {/* TAB 2: INFORMES - SISTEMA HÍBRIDO 🆕 */}
                {activeTab === "informes" && agreement && (
                  <InformesRouter
                    convenioId={agreementId}
                    convenioNombre={agreement.name}
                  />
                )}
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