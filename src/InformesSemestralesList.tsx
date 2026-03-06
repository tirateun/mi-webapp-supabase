// src/InformesSemestralesList.tsx
// NUEVA ARQUITECTURA: 1 Informe = 1 Área

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
        .select(`
          *,
          agreement_subtypes(id, subtipo_nombre),
          areas_vinculadas(id, nombre)
        `)
        .eq("convenio_id", convenioId)
        .order("anio", { ascending: false })
        .order("semestre", { ascending: false });
      
      if (error) throw error;
      
      const informesConDetalle = await Promise.all(
        (informesData || []).map(async (informe) => {
          const { data: detalle } = await supabase
            .from("informes_semestrales_detalle")
            .select("*")
            .eq("informe_id", informe.id)
            .single();
          
          const subtipoNombre = informe.agreement_subtypes?.subtipo_nombre || "";
          const esPregrado = subtipoNombre.toUpperCase().includes("PREGRADO");
          const areaNombre = informe.areas_vinculadas?.nombre || "Área sin nombre";
          
          return { 
            ...informe, 
            detalle: detalle || {},
            total_alumnos: detalle?.total_alumnos || 0,
            subtipo_nombre: subtipoNombre,
            area_nombre: areaNombre,
            es_pregrado: esPregrado
          };
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
  
  // Agrupar informes por año y semestre
  const informesAgrupados = informes.reduce((acc: any, informe) => {
    const key = `${informe.anio}-${informe.semestre}`;
    if (!acc[key]) {
      acc[key] = {
        anio: informe.anio,
        semestre: informe.semestre,
        informes: []
      };
    }
    acc[key].informes.push(informe);
    return acc;
  }, {});
  
  const grupos = Object.values(informesAgrupados).sort((a: any, b: any) => {
    if (a.anio !== b.anio) return b.anio - a.anio;
    return b.semestre - a.semestre;
  });
  
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
      
      {/* Botón Nuevo */}
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
            ➕ Nuevo Informe por Área
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
              : "Crea el primer informe por área para este convenio"
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
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {grupos.map((grupo: any) => (
            <div key={`${grupo.anio}-${grupo.semestre}`}>
              {/* Header del grupo */}
              <div style={{
                background: "#F8F9FA",
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                border: "2px solid #DEE2E6"
              }}>
                <h2 style={{ margin: 0, color: "#3D1A4F", fontSize: "1.5rem" }}>
                  📅 {grupo.anio} - Semestre {grupo.semestre === 1 ? "I" : "II"}
                </h2>
                <p style={{ margin: "0.5rem 0 0 0", color: "#6C757D" }}>
                  {grupo.informes.length} informe{grupo.informes.length !== 1 ? 's' : ''} registrado{grupo.informes.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Informes del grupo */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
                {grupo.informes.map((informe: any) => {
                  const labelTipo1 = informe.es_pregrado ? "Internos" : "Residentes";
                  const labelTipo2 = informe.es_pregrado ? "Alumnos no internos" : "Rotaciones";
                  
                  return (
                    <div 
                      key={informe.id} 
                      style={{ 
                        background: "white", 
                        borderRadius: "12px", 
                        padding: "1.5rem", 
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        border: "2px solid #E9ECEF"
                      }}
                    >
                      {/* Subtipo y Área */}
                      <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "2px solid #F8F9FA" }}>
                        <div style={{ 
                          color: "#5B2C6F", 
                          fontWeight: 700, 
                          fontSize: "0.9rem",
                          marginBottom: "0.5rem"
                        }}>
                          📋 {informe.subtipo_nombre}
                        </div>
                        <div style={{ 
                          color: "#3D1A4F", 
                          fontWeight: 600, 
                          fontSize: "1.2rem"
                        }}>
                          📚 {informe.area_nombre}
                        </div>
                        {informe.sede_convenio && (
                          <div style={{ 
                            color: "#6C757D", 
                            fontSize: "0.9rem",
                            marginTop: "0.5rem"
                          }}>
                            🏥 {informe.sede_convenio}
                          </div>
                        )}
                      </div>
                      
                      {/* Datos */}
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "1fr 1fr", 
                          gap: "0.75rem",
                          marginBottom: "0.75rem"
                        }}>
                          <div style={{ 
                            background: "#F8F9FA", 
                            padding: "0.75rem", 
                            borderRadius: "8px",
                            textAlign: "center"
                          }}>
                            <div style={{ fontSize: "0.8rem", color: "#6C757D" }}>👨‍🎓 {labelTipo1}</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3D1A4F" }}>
                              {informe.detalle.alumnos_internos || 0}
                            </div>
                          </div>
                          <div style={{ 
                            background: "#F8F9FA", 
                            padding: "0.75rem", 
                            borderRadius: "8px",
                            textAlign: "center"
                          }}>
                            <div style={{ fontSize: "0.8rem", color: "#6C757D" }}>📚 {labelTipo2}</div>
                            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#3D1A4F" }}>
                              {informe.detalle.alumnos_cursos || 0}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ 
                          background: "#5B2C6F", 
                          color: "white", 
                          padding: "0.75rem", 
                          borderRadius: "8px",
                          textAlign: "center"
                        }}>
                          <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Total</div>
                          <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                            {informe.total_alumnos}
                          </div>
                        </div>
                      </div>
                      
                      {/* Documento */}
                      {informe.detalle.documento_verificacion_url && (
                        <div style={{ marginBottom: "1rem" }}>
                          <a 
                            href={informe.detalle.documento_verificacion_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              display: "inline-block",
                              color: "#007BFF", 
                              fontSize: "0.9rem",
                              textDecoration: "none"
                            }}
                          >
                            📎 Ver documento de verificación
                          </a>
                        </div>
                      )}
                      
                      {/* Observaciones */}
                      {informe.observaciones && (
                        <div style={{ 
                          background: "#FFF3CD", 
                          padding: "0.75rem", 
                          borderRadius: "8px",
                          marginBottom: "1rem",
                          border: "1px solid #FFC107",
                          fontSize: "0.9rem"
                        }}>
                          <strong style={{ color: "#856404" }}>📝 Observaciones:</strong>
                          <div style={{ marginTop: "0.25rem", color: "#856404" }}>
                            {informe.observaciones}
                          </div>
                        </div>
                      )}
                      
                      {/* Botones de Acción */}
                      {!isAdmin && (
                        <div style={{ 
                          display: "flex", 
                          gap: "0.5rem", 
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
                              padding: "0.5rem 1rem", 
                              borderRadius: "6px", 
                              cursor: "pointer", 
                              fontWeight: 600,
                              fontSize: "0.9rem"
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
                              padding: "0.5rem 1rem", 
                              borderRadius: "6px", 
                              cursor: "pointer", 
                              fontWeight: 600,
                              fontSize: "0.9rem"
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}