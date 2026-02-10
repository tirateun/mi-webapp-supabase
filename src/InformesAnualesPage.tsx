// src/InformesAnualesPage.tsx
// Sistema de informes anuales para convenios NO Docente Asistencial
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import InformesAnualesModal from "./InformesAnualesModal";

interface AgreementYear {
  id: string;
  agreement_id: string;
  year_number: number;
  year_start: string;
  year_end: string;
}

interface InformeAnual {
  id: string;
  convenio_id: string;
  year_id: string;
  contenido: string;
  dificultades: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  convenioId: string;
  onClose?: () => void;
  esResponsable?: boolean;
  isAdmin?: boolean;
}

export default function InformesAnualesPage({ 
  convenioId, 
  onClose,
  esResponsable = false,
  isAdmin = false
}: Props) {
  const [loading, setLoading] = useState(true);
  const [agreementYears, setAgreementYears] = useState<AgreementYear[]>([]);
  const [informes, setInformes] = useState<InformeAnual[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AgreementYear | null>(null);
  const [editingInforme, setEditingInforme] = useState<InformeAnual | null>(null);
  const [convenioNombre, setConvenioNombre] = useState("");

  useEffect(() => {
    cargarDatos();
  }, [convenioId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar nombre del convenio
      const { data: convenio } = await supabase
        .from("agreements")
        .select("name")
        .eq("id", convenioId)
        .single();

      if (convenio) setConvenioNombre(convenio.name);

      // Cargar años del convenio
      const { data: years, error: yearsError } = await supabase
        .from("agreement_years")
        .select("*")
        .eq("agreement_id", convenioId)
        .order("year_number");

      if (yearsError) throw yearsError;
      setAgreementYears(years || []);

      // Cargar informes existentes
      const { data: informesData, error: informesError } = await supabase
        .from("informes_anuales")
        .select("*")
        .eq("convenio_id", convenioId);

      if (informesError) throw informesError;
      setInformes(informesData || []);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = (year: AgreementYear) => {
    setSelectedYear(year);
    setEditingInforme(null);
    setShowModal(true);
  };

  const abrirModalEditar = (informe: InformeAnual, year: AgreementYear) => {
    setSelectedYear(year);
    setEditingInforme(informe);
    setShowModal(true);
  };

  const eliminarInforme = async (informeId: string) => {
    if (!confirm("¿Estás seguro de eliminar este informe? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("informes_anuales")
        .delete()
        .eq("id", informeId);

      if (error) throw error;

      alert("✅ Informe eliminado correctamente");
      cargarDatos();
    } catch (error: any) {
      console.error("Error eliminando informe:", error);
      alert("❌ Error al eliminar: " + error.message);
    }
  };

  const getInformeParaYear = (yearId: string) => {
    return informes.find(i => i.year_id === yearId);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
        color: "white",
        padding: "2rem",
        borderRadius: "12px",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
              📋 Informes Anuales
            </h2>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9 }}>
              {convenioNombre}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: 600
              }}
            >
              <i className="bi bi-x-circle"></i> Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div style={{
        background: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#5B2C6F" }}>
              {agreementYears.length}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#6C757D", marginTop: "0.25rem" }}>
              Años del Convenio
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#28A745" }}>
              {informes.length}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#6C757D", marginTop: "0.25rem" }}>
              Informes Creados
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#FDB913" }}>
              {agreementYears.length - informes.length}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#6C757D", marginTop: "0.25rem" }}>
              Informes Pendientes
            </div>
          </div>
        </div>
      </div>

      {/* Lista de años */}
      {agreementYears.length === 0 ? (
        <div style={{
          background: "white",
          padding: "3rem",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ADB5BD" }}></i>
          <p style={{ marginTop: "1rem", color: "#6C757D", fontSize: "1.1rem" }}>
            No hay años configurados para este convenio
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {agreementYears.map((year) => {
            const informe = getInformeParaYear(year.id);
            const tieneInforme = !!informe;

            return (
              <div
                key={year.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  border: tieneInforme ? "2px solid #28A745" : "2px solid #E9ECEF"
                }}
              >
                {/* Header del año */}
                <div style={{
                  background: tieneInforme 
                    ? "linear-gradient(135deg, #28A745 0%, #218838 100%)"
                    : "linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)",
                  color: tieneInforme ? "white" : "#3D1A4F",
                  padding: "1.5rem",
                  borderBottom: "2px solid #DEE2E6"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                        {tieneInforme ? "✅" : "📋"} Año {year.year_number}
                      </h3>
                      <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.95rem", opacity: 0.9 }}>
                        {formatFecha(year.year_start)} - {formatFecha(year.year_end)}
                      </p>
                    </div>
                    {/* Botones - Solo para usuarios NO admin */}
                    {!isAdmin && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {tieneInforme ? (
                          <>
                            <button
                              onClick={() => abrirModalEditar(informe, year)}
                              style={{
                                background: "#FDB913",
                                color: "#3D1A4F",
                                border: "none",
                                padding: "0.75rem 1.5rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.95rem",
                                fontWeight: 600
                              }}
                            >
                              <i className="bi bi-pencil"></i> Editar
                            </button>
                            <button
                              onClick={() => eliminarInforme(informe.id)}
                              style={{
                                background: "#DC3545",
                                color: "white",
                                border: "none",
                                padding: "0.75rem 1.5rem",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.95rem",
                                fontWeight: 600
                              }}
                            >
                              <i className="bi bi-trash"></i> Eliminar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => abrirModalNuevo(year)}
                            style={{
                              background: "#5B2C6F",
                              color: "white",
                              border: "none",
                              padding: "0.75rem 1.5rem",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "0.95rem",
                              fontWeight: 600
                            }}
                          >
                            <i className="bi bi-plus-circle"></i> Crear Informe
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido del informe (si existe) */}
                {tieneInforme && (
                  <div style={{ padding: "1.5rem" }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#3D1A4F", marginBottom: "0.5rem" }}>
                        Contenido del Informe:
                      </h4>
                      <div style={{
                        background: "#F8F9FA",
                        padding: "1rem",
                        borderRadius: "8px",
                        whiteSpace: "pre-wrap",
                        fontSize: "0.95rem",
                        lineHeight: "1.6",
                        color: "#495057"
                      }}>
                        {informe.contenido}
                      </div>
                    </div>

                    {informe.dificultades && (
                      <div>
                        <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#856404", marginBottom: "0.5rem" }}>
                          Dificultades y Observaciones:
                        </h4>
                        <div style={{
                          background: "#FFF3CD",
                          padding: "1rem",
                          borderRadius: "8px",
                          whiteSpace: "pre-wrap",
                          fontSize: "0.95rem",
                          lineHeight: "1.6",
                          color: "#856404"
                        }}>
                          {informe.dificultades}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#6C757D" }}>
                      <i className="bi bi-clock"></i> Última actualización: {new Date(informe.updated_at).toLocaleString('es-PE')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedYear && (
        <InformesAnualesModal
          show={showModal}
          onClose={() => setShowModal(false)}
          convenioId={convenioId}
          year={selectedYear}
          onSaved={() => {
            setShowModal(false);
            cargarDatos();
          }}
          editing={editingInforme}
        />
      )}
    </div>
  );
}