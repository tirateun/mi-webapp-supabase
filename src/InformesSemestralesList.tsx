// src/InformesSemestralesList.tsx
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import InformeSemestralForm from "./InformeSemestralForm";

interface InformesSemestralesListProps {
  convenioId: string;
  convenioNombre: string;
  esResponsable?: boolean;
  isAdmin?: boolean;
}

export default function InformesSemestralesList({ 
  convenioId, 
  convenioNombre,
  esResponsable = false,
  isAdmin = false
}: InformesSemestralesListProps) {
  const [loading, setLoading] = useState(false);
  const [informes, setInformes] = useState<any[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [informeAEditar, setInformeAEditar] = useState<any>(null);
  const [totalHistorico, setTotalHistorico] = useState(0);
  
  useEffect(() => {
    cargarInformes();
  }, [convenioId]);
  
  const cargarInformes = async () => {
    setLoading(true);
    try {
      const { data: informesData, error } = await supabase
        .from("informes_semestrales")
        .select("*")
        .eq("convenio_id", convenioId)
        .order("anio", { ascending: false })
        .order("semestre", { ascending: false });
      
      if (error) throw error;
      
      const informesConDetalle = await Promise.all(
        (informesData || []).map(async (informe) => {
          const { data: detalles } = await supabase
            .from("informes_semestrales_detalle")
            .select("*, areas_vinculadas(id, nombre)")
            .eq("informe_id", informe.id);
          
          const totalAlumnos = (detalles || []).reduce((sum: number, d: any) => sum + d.total_alumnos, 0);
          return { ...informe, detalles: detalles || [], total_alumnos: totalAlumnos };
        })
      );
      
      setInformes(informesConDetalle);
      setTotalHistorico(informesConDetalle.reduce((sum, inf) => sum + inf.total_alumnos, 0));
    } catch (error) {
      console.error("Error:", error);
      alert("Error cargando informes");
    } finally {
      setLoading(false);
    }
  };
  
  const handleEliminarInforme = async (informeId: string) => {
    if (!confirm("¿Seguro que deseas eliminar este informe?")) return;
    try {
      await supabase.from("informes_semestrales").delete().eq("id", informeId);
      alert("✅ Informe eliminado");
      cargarInformes();
    } catch (error: any) {
      alert("❌ Error: " + error.message);
    }
  };
  
  if (mostrarForm) {
    return (
      <InformeSemestralForm
        convenioId={convenioId}
        convenioNombre={convenioNombre}
        onClose={() => { 
          setMostrarForm(false); 
          setInformeAEditar(null); 
        }}
        onSaved={() => { 
          setMostrarForm(false); 
          setInformeAEditar(null); 
          cargarInformes(); 
        }}
        informeExistente={informeAEditar}
      />
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
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700 }}>
              📊 Informes Semestrales
            </h1>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "1rem" }}>
              {convenioNombre}
            </p>
          </div>
          <div style={{ 
            textAlign: "right",
            background: "rgba(255,255,255,0.15)",
            padding: "1rem 1.5rem",
            borderRadius: "12px"
          }}>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>Total Histórico</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>{totalHistorico}</div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>alumnos</div>
          </div>
        </div>
      </div>
      
      {/* Botón Nuevo - Solo para usuarios NO admin */}
      {!isAdmin && (
        <div style={{ marginBottom: "2rem" }}>
          <button 
            onClick={() => { 
              setInformeAEditar(null); 
              setMostrarForm(true); 
            }} 
            style={{ 
              background: "#FDB913", 
              color: "#3D1A4F", 
              border: "none", 
              padding: "1rem 2rem", 
              borderRadius: "8px", 
              cursor: "pointer", 
              fontWeight: 600, 
              fontSize: "1.1rem",
              boxShadow: "0 2px 8px rgba(253,185,19,0.3)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            ➕ Nuevo Informe Semestral
          </button>
        </div>
      )}
      
      {/* Contenido */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p style={{ marginTop: "1rem", color: "#6C757D" }}>Cargando informes...</p>
        </div>
      ) : informes.length === 0 ? (
        <div style={{ 
          background: "white", 
          borderRadius: "12px", 
          padding: "3rem", 
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ADB5BD" }}></i>
          <h3 style={{ marginTop: "1rem", color: "#3D1A4F" }}>No hay informes registrados</h3>
          <p style={{ color: "#6C757D", marginBottom: "1.5rem" }}>
            {isAdmin 
              ? "No hay informes disponibles para visualizar" 
              : "Crea el primer informe semestral para este convenio"
            }
          </p>
          {!isAdmin && (
            <button 
              onClick={() => setMostrarForm(true)} 
              style={{ 
                background: "#5B2C6F", 
                color: "white", 
                border: "none", 
                padding: "0.75rem 1.5rem", 
                borderRadius: "8px", 
                cursor: "pointer", 
                fontWeight: 600,
                fontSize: "1rem"
              }}
            >
              ➕ Crear Primer Informe
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {informes.map((informe) => (
            <div 
              key={informe.id} 
              style={{ 
                background: "white", 
                borderRadius: "12px", 
                padding: "1.5rem", 
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                border: "1px solid #E9ECEF"
              }}
            >
              {/* Header del Informe */}
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "1rem", 
                paddingBottom: "1rem", 
                borderBottom: "2px solid #E9ECEF",
                flexWrap: "wrap",
                gap: "1rem"
              }}>
                <div>
                  <h3 style={{ margin: 0, color: "#3D1A4F", fontSize: "1.5rem", fontWeight: 700 }}>
                    📅 {informe.anio} - Semestre {informe.semestre === 1 ? "I" : "II"}
                  </h3>
                  {informe.sede_convenio && (
                    <p style={{ margin: "0.5rem 0 0 0", color: "#6C757D" }}>
                      🏥 {informe.sede_convenio}
                    </p>
                  )}
                </div>
                <div style={{ 
                  background: "#5B2C6F", 
                  color: "white", 
                  padding: "1rem 1.5rem", 
                  borderRadius: "8px", 
                  textAlign: "center",
                  minWidth: "120px"
                }}>
                  <div style={{ fontSize: "2rem", fontWeight: 700 }}>{informe.total_alumnos}</div>
                  <div style={{ fontSize: "0.9rem" }}>alumnos</div>
                </div>
              </div>
              
              {/* Detalles por Área */}
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ 
                  margin: "0 0 1rem 0", 
                  color: "#3D1A4F", 
                  fontSize: "1.1rem",
                  fontWeight: 600 
                }}>
                  📚 Desglose por Área:
                </h4>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                  gap: "1rem" 
                }}>
                  {informe.detalles.map((d: any) => (
                    <div 
                      key={d.id} 
                      style={{ 
                        background: "#F8F9FA", 
                        padding: "1rem", 
                        borderRadius: "8px",
                        border: "1px solid #DEE2E6"
                      }}
                    >
                      <div style={{ 
                        fontWeight: 600, 
                        color: "#3D1A4F", 
                        marginBottom: "0.5rem",
                        fontSize: "1rem"
                      }}>
                        {d.areas_vinculadas?.nombre || "Área sin nombre"}
                      </div>
                      <div style={{ fontSize: "0.9rem", color: "#6C757D", marginBottom: "0.5rem" }}>
                        👨‍🎓 Internos: {d.alumnos_internos} | 📚 Cursos: {d.alumnos_cursos}
                      </div>
                      <div style={{ 
                        fontSize: "1.1rem", 
                        fontWeight: 600, 
                        color: "#5B2C6F", 
                        marginTop: "0.5rem",
                        paddingTop: "0.5rem",
                        borderTop: "1px solid #DEE2E6"
                      }}>
                        Total: {d.total_alumnos} alumnos
                      </div>
                      {d.documento_verificacion_url && (
                        <a 
                          href={d.documento_verificacion_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            display: "inline-block", 
                            marginTop: "0.5rem", 
                            color: "#007BFF", 
                            fontSize: "0.9rem",
                            textDecoration: "none"
                          }}
                        >
                          📎 Ver documento de verificación
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Observaciones */}
              {informe.observaciones_generales && (
                <div style={{ 
                  background: "#FFF3CD", 
                  padding: "1rem", 
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  border: "1px solid #FFC107"
                }}>
                  <strong style={{ color: "#856404" }}>📝 Observaciones:</strong>
                  <div style={{ marginTop: "0.5rem", color: "#856404" }}>
                    {informe.observaciones_generales}
                  </div>
                </div>
              )}
              
              {/* Botones de Acción - Solo para usuarios NO admin */}
              {!isAdmin && (
                <div style={{ 
                  display: "flex", 
                  gap: "1rem", 
                  justifyContent: "flex-end",
                  paddingTop: "1rem",
                  borderTop: "1px solid #E9ECEF"
                }}>
                  <button 
                    onClick={() => { 
                      setInformeAEditar(informe); 
                      setMostrarForm(true); 
                    }} 
                    style={{ 
                      background: "#007BFF", 
                      color: "white", 
                      border: "none", 
                      padding: "0.75rem 1.5rem", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontWeight: 600,
                      fontSize: "0.95rem"
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={() => handleEliminarInforme(informe.id)} 
                    style={{ 
                      background: "#DC3545", 
                      color: "white", 
                      border: "none", 
                      padding: "0.75rem 1.5rem", 
                      borderRadius: "8px", 
                      cursor: "pointer", 
                      fontWeight: 600,
                      fontSize: "0.95rem"
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}