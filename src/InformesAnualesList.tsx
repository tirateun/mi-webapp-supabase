// src/InformesAnualesList.tsx
// Sistema de informes ANUALES para convenios Docente Asistencial
// NUEVA ARQUITECTURA: 1 Informe = 1 Área (SIN semestre)

import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import InformeAnualForm from "./InformeAnualForm";

interface InformesAnualesListProps {
  convenioId: string;
  convenioNombre: string;
  esResponsable?: boolean;
  isAdmin?: boolean;
}

export default function InformesAnualesList({ 
  convenioId, 
  convenioNombre,
  esResponsable = false,
  isAdmin = false
}: InformesAnualesListProps) {
  const [loading, setLoading] = useState(false);
  const [informes, setInformes] = useState<any[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [informeAEditar, setInformeAEditar] = useState<any>(null);
  const [totalesDesglosados, setTotalesDesglosados] = useState<{
    internos: number;
    alumnos: number;
    cursos: number;
  }>({ internos: 0, alumnos: 0, cursos: 0 });
  
  useEffect(() => {
    cargarInformes();
  }, [convenioId]);
  
  const cargarInformes = async () => {
    setLoading(true);
    try {
      const { data: informesData, error } = await supabase
        .from("informes_anuales")
        .select(`
          *,
          agreement_subtypes(id, subtipo_nombre),
          areas_vinculadas(id, nombre)
        `)
        .eq("convenio_id", convenioId)
        .order("anio", { ascending: false });
      
      if (error) throw error;
      
      const informesConDetalle = (informesData || []).map((informe) => {
        const subtipoNombre = informe.agreement_subtypes?.subtipo_nombre || "";
        const esPregrado = subtipoNombre.toUpperCase().includes("PREGRADO");
        const areaNombre = informe.areas_vinculadas?.nombre || "Área sin nombre";
        
        return { 
          ...informe, 
          num_internos: informe.num_internos || 0,
          num_alumnos: informe.num_alumnos || 0,
          num_cursos: informe.num_cursos || 0,
          subtipo_nombre: subtipoNombre,
          area_nombre: areaNombre,
          es_pregrado: esPregrado
        };
      });
      
      setInformes(informesConDetalle);
      
      // Calcular totales desglosados
      const totales = informesConDetalle.reduce((acc, inf) => ({
        internos: acc.internos + inf.num_internos,
        alumnos: acc.alumnos + inf.num_alumnos,
        cursos: acc.cursos + inf.num_cursos
      }), { internos: 0, alumnos: 0, cursos: 0 });
      
      setTotalesDesglosados(totales);
      
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
      await supabase.from("informes_anuales").delete().eq("id", informeId);
      alert("✅ Informe eliminado");
      cargarInformes();
    } catch (error: any) {
      alert("❌ Error: " + error.message);
    }
  };
  
  // Agrupar informes por año
  const informesAgrupados = informes.reduce((acc: any, informe) => {
    const key = `${informe.anio}`;
    if (!acc[key]) {
      acc[key] = {
        anio: informe.anio,
        informes: []
      };
    }
    acc[key].informes.push(informe);
    return acc;
  }, {});
  
  const grupos = Object.values(informesAgrupados).sort((a: any, b: any) => b.anio - a.anio);
  
  if (mostrarForm) {
    return (
      <InformeAnualForm
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
              📊 Informes Anuales
            </h1>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "1rem" }}>
              {convenioNombre}
            </p>
          </div>
          <div style={{ 
            textAlign: "center",
            background: "rgba(255,255,255,0.15)",
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            minWidth: "320px"
          }}>
            <div style={{ fontSize: "0.9rem", opacity: 0.8, marginBottom: "0.5rem" }}>
              Total Histórico
            </div>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr 1fr", 
              gap: "1rem",
              marginBottom: "0.5rem"
            }}>
              <div>
                <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Internos</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalesDesglosados.internos}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Alumnos</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalesDesglosados.alumnos}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>Cursos</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalesDesglosados.cursos}</div>
              </div>
            </div>
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
            ➕ Nuevo Informe Anual por Área
          </button>
        </div>
      )}
      
      {/* Contenido */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : informes.length === 0 ? (
        <div style={{
          background: "white",
          padding: "3rem",
          borderRadius: "12px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h3 style={{ color: "#6C757D" }}>No hay informes registrados</h3>
          <p style={{ color: "#ADB5BD" }}>Crea el primer informe usando el botón de arriba</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {grupos.map((grupo: any) => (
            <div key={grupo.anio} style={{
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
              {/* Header del año */}
              <div style={{
                background: "linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)",
                color: "#3D1A4F",
                padding: "1.5rem",
                borderBottom: "2px solid #DEE2E6"
              }}>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>
                  📅 Año {grupo.anio}
                </h2>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#6C757D" }}>
                  {grupo.informes.length} informe{grupo.informes.length !== 1 ? 's' : ''} por área
                </p>
              </div>

              {/* Tabla de informes */}
              <div style={{ padding: "1.5rem" }}>
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-hover">
                    <thead style={{ background: "#F8F9FA" }}>
                      <tr>
                        <th>Subtipo</th>
                        <th>Área Vinculada</th>
                        <th className="text-center">👨‍⚕️ Internos</th>
                        <th className="text-center">👩‍🎓 Alumnos</th>
                        <th className="text-center">📚 Cursos</th>
                        <th>Medios Verificables</th>
                        {!isAdmin && <th style={{ width: "150px" }}>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.informes.map((inf: any) => (
                        <tr key={inf.id}>
                          <td>
                            <span style={{
                              background: inf.es_pregrado ? "#D4EDDA" : "#CCE5FF",
                              color: inf.es_pregrado ? "#155724" : "#004085",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                              fontWeight: 600
                            }}>
                              {inf.subtipo_nombre}
                            </span>
                          </td>
                          <td>{inf.area_nombre}</td>
                          <td className="text-center">
                            <strong style={{ fontSize: "1.1rem" }}>{inf.num_internos}</strong>
                          </td>
                          <td className="text-center">
                            <strong style={{ fontSize: "1.1rem" }}>{inf.num_alumnos}</strong>
                          </td>
                          <td className="text-center">
                            <strong style={{ fontSize: "1.1rem" }}>{inf.num_cursos}</strong>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {inf.medio_verificable_internos && (
                                <a 
                                  href={inf.medio_verificable_internos} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                  style={{ fontSize: "0.8rem" }}
                                >
                                  📄 Internos
                                </a>
                              )}
                              {inf.medio_verificable_alumnos && (
                                <a 
                                  href={inf.medio_verificable_alumnos} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="btn btn-sm btn-outline-success"
                                  style={{ fontSize: "0.8rem" }}
                                >
                                  📄 Alumnos
                                </a>
                              )}
                              {inf.medio_verificable_cursos && (
                                <a 
                                  href={inf.medio_verificable_cursos} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="btn btn-sm btn-outline-warning"
                                  style={{ fontSize: "0.8rem" }}
                                >
                                  📄 Cursos
                                </a>
                              )}
                            </div>
                          </td>
                          {!isAdmin && (
                            <td>
                              <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button 
                                  onClick={() => {
                                    setInformeAEditar(inf);
                                    setMostrarForm(true);
                                  }}
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  ✏️
                                </button>
                                <button 
                                  onClick={() => handleEliminarInforme(inf.id)}
                                  className="btn btn-sm btn-outline-danger"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Observaciones si existen */}
                {grupo.informes.some((inf: any) => inf.observaciones) && (
                  <div style={{ marginTop: "1rem" }}>
                    <h6 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#856404" }}>
                      📝 Observaciones:
                    </h6>
                    {grupo.informes
                      .filter((inf: any) => inf.observaciones)
                      .map((inf: any) => (
                        <div 
                          key={inf.id}
                          style={{
                            background: "#FFF3CD",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            marginTop: "0.5rem",
                            fontSize: "0.85rem",
                            color: "#856404"
                          }}
                        >
                          <strong>{inf.area_nombre}:</strong> {inf.observaciones}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}