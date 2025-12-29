// src/ConsultaConvenios.tsx

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Convenio {
  id: string;
  name: string;
  agreement_type: string;
  pais: string;
  signature_date: string;
  expiration_date: string;
  estado: string;
  institucion_nombre?: string;
  areas_vinculadas?: string[];
}

interface ConsultaConveniosProps {
  userId: string;
  role: string;
}

export default function ConsultaConvenios({ userId, role }: ConsultaConveniosProps) {
  console.log("🔍 ConsultaConvenios montado", { userId, role }); // 🆕 AGREGAR

  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [conveniosFiltrados, setConveniosFiltrados] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroArea, setFiltroArea] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroPais, setFiltroPais] = useState<string>("");
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>("");
  const [busquedaTexto, setBusquedaTexto] = useState<string>("");

  // Catálogos para dropdowns
  const [areas, setAreas] = useState<any[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [paises, setPaises] = useState<string[]>([]);
  const [instituciones, setInstituciones] = useState<any[]>([]);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    cargarCatalogos();
  }, []);

  // Cargar convenios
  useEffect(() => {
    cargarConvenios();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    aplicarFiltros();
  }, [convenios, filtroEstado, filtroArea, filtroTipo, filtroPais, filtroInstitucion, busquedaTexto]);

  const cargarCatalogos = async () => {
    // Cargar áreas vinculadas
    const { data: areasData } = await supabase
      .from("areas_vinculadas")
      .select("id, nombre")
      .order("nombre");
    setAreas(areasData || []);

    // Cargar instituciones
    const { data: instData } = await supabase
      .from("instituciones")
      .select("id, nombre")
      .order("nombre");
    setInstituciones(instData || []);
  };

  const cargarConvenios = async () => {
    console.log("📊 Iniciando carga de convenios...");
    setLoading(true);
    try {
      // Query corregida con nombres de columnas reales
      const { data, error } = await supabase
        .from("agreements")
        .select(`
          id,
          name,
          tipo_convenio,
          pais,
          signature_date,
          expiration_date,
          institucion_id
        `)
        .order("name");
  
      console.log("📊 Convenios cargados:", data?.length, data);
      
      if (error) {
        console.error("❌ Error:", error);
        throw error;
      }
  
      // 2. Cargar instituciones por separado
      const { data: institucionesData } = await supabase
        .from("instituciones")
        .select("id, nombre");
  
      const institucionesMap = new Map(
        (institucionesData || []).map(i => [i.id, i.nombre])
      );
  
      // 3. Procesar datos
      const conveniosConDatos = await Promise.all(
        (data || []).map(async (conv: any) => {
          // Obtener áreas vinculadas
          const { data: areasVinc } = await supabase
            .from("agreement_areas")
            .select("area_vinculada_id, areas_vinculadas(nombre)")
            .eq("agreement_id", conv.id);
  
          const areasNombres = (areasVinc || [])
            .map((a: any) => a.areas_vinculadas?.nombre)
            .filter(Boolean);
  
          // Calcular estado
          const hoy = new Date();
          const expiracion = conv.expiration_date ? new Date(conv.expiration_date) : null;
          let estado = "Sin fecha";
          
          if (expiracion) {
            const diasRestantes = Math.ceil((expiracion.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            if (diasRestantes < 0) {
              estado = "Vencido";
            } else if (diasRestantes <= 30) {
              estado = "Por Vencer";
            } else {
              estado = "Vigente";
            }
          }
  
          // tipo_convenio es un array, tomar el primero o unirlos
          const tipoConvenio = Array.isArray(conv.tipo_convenio) 
            ? conv.tipo_convenio.join(", ") || "Sin especificar"
            : conv.tipo_convenio || "Sin especificar";
  
          return {
            id: conv.id,
            name: conv.name,
            agreement_type: tipoConvenio, // Mantener este nombre para compatibilidad
            pais: conv.pais || "No especificado",
            signature_date: conv.signature_date,
            expiration_date: conv.expiration_date,
            estado,
            institucion_nombre: institucionesMap.get(conv.institucion_id) || "Sin institución",
            areas_vinculadas: areasNombres,
          };
        })
      );
  
      setConvenios(conveniosConDatos);
  
      // Extraer tipos únicos
      const tiposUnicos = [...new Set(conveniosConDatos.map(c => c.agreement_type))].filter(Boolean);
      setTipos(tiposUnicos);
  
      // Extraer países únicos
      const paisesUnicos = [...new Set(conveniosConDatos.map(c => c.pais))].filter(Boolean);
      setPaises(paisesUnicos);
  
    } catch (error) {
      console.error("Error cargando convenios:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    console.log("🔧 Aplicando filtros..."); // 🆕 AGREGAR
    let resultado = [...convenios];
    console.log("Total convenios:", resultado.length); // 🆕 AGREGAR

    // Filtro por estado
    if (filtroEstado !== "todos") {
      if (filtroEstado === "vigentes") {
        resultado = resultado.filter(c => c.estado === "Vigente");
      } else if (filtroEstado === "por_vencer") {
        resultado = resultado.filter(c => c.estado === "Por Vencer");
      } else if (filtroEstado === "vencidos") {
        resultado = resultado.filter(c => c.estado === "Vencido");
      }
    }

    // Filtro por área vinculada
    if (filtroArea) {
      const areaNombre = areas.find(a => a.id === filtroArea)?.nombre;
      resultado = resultado.filter(c => 
        c.areas_vinculadas?.includes(areaNombre)
      );
    }

    // Filtro por tipo
    if (filtroTipo) {
      resultado = resultado.filter(c => c.agreement_type === filtroTipo);
    }

    // Filtro por país
    if (filtroPais) {
      resultado = resultado.filter(c => c.pais === filtroPais);
    }

    // Filtro por institución
    if (filtroInstitucion) {
        resultado = resultado.filter(c => (c.institucion_nombre || "").toLowerCase().includes(filtroInstitucion.toLowerCase()));
    }

    // Búsqueda por texto (nombre del convenio)
    if (busquedaTexto) {
      resultado = resultado.filter(c => 
        c.name.toLowerCase().includes(busquedaTexto.toLowerCase())
      );
    }
    console.log("Convenios filtrados:", resultado.length); // 🆕 AGREGAR
    setConveniosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroEstado("todos");
    setFiltroArea("");
    setFiltroTipo("");
    setFiltroPais("");
    setFiltroInstitucion("");
    setBusquedaTexto("");
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "Vigente":
        return { bg: "#d4edda", color: "#155724", border: "#c3e6cb" };
      case "Por Vencer":
        return { bg: "#fff3cd", color: "#856404", border: "#ffeaa7" };
      case "Vencido":
        return { bg: "#f8d7da", color: "#721c24", border: "#f5c6cb" };
      default:
        return { bg: "#e9ecef", color: "#6c757d", border: "#dee2e6" };
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ 
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h2 style={{ 
            color: "#3D1A4F",
            fontSize: "1.75rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem"
          }}>
            <i className="bi bi-search"></i>
            Consultar Convenios
          </h2>
          <p style={{ color: "#6C757D", fontSize: "0.95rem" }}>
            Explora todos los convenios institucionales con filtros avanzados
          </p>
        </div>

        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          style={{
            background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            boxShadow: "0 2px 8px rgba(91, 44, 111, 0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(91, 44, 111, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(91, 44, 111, 0.3)";
          }}
        >
          <i className="bi bi-funnel"></i>
          {mostrarFiltros ? "Ocultar Filtros" : "Mostrar Filtros"}
        </button>
      </div>

      {/* Panel de Filtros Avanzados */}
      {mostrarFiltros && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #E9ECEF"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem"
          }}>
            <h3 style={{
              color: "#3D1A4F",
              fontSize: "1.1rem",
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <i className="bi bi-sliders"></i>
              Filtros Avanzados
            </h3>
            <span style={{ fontSize: "0.9rem", color: "#6C757D" }}>
              Los filtros se aplican automáticamente
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {/* Búsqueda por nombre */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                color: "#3D1A4F", 
                fontWeight: 600, 
                fontSize: "0.9rem" 
              }}>
                <i className="bi bi-search"></i> Buscar por nombre
              </label>
              <input
                type="text"
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                placeholder="Nombre del convenio..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #E9ECEF",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  transition: "all 0.3s ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#5B2C6F";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(91, 44, 111, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E9ECEF";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Filtro Rápido por Estado */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                color: "#3D1A4F", 
                fontWeight: 600, 
                fontSize: "0.9rem" 
              }}>
                <i className="bi bi-check-circle"></i> Estado
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["todos", "vigentes", "por_vencer", "vencidos"].map((estado) => (
                  <button
                    key={estado}
                    onClick={() => setFiltroEstado(estado)}
                    style={{
                      padding: "0.5rem 1rem",
                      border: filtroEstado === estado ? "2px solid #5B2C6F" : "2px solid #E9ECEF",
                      background: filtroEstado === estado ? "#5B2C6F" : "white",
                      color: filtroEstado === estado ? "white" : "#6C757D",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      transition: "all 0.3s ease"
                    }}
                  >
                    {estado === "todos" && "Todos"}
                    {estado === "vigentes" && "✅ Vigentes"}
                    {estado === "por_vencer" && "⚠️ Por Vencer"}
                    {estado === "vencidos" && "❌ Vencidos"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Área Vinculada */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                color: "#3D1A4F", 
                fontWeight: 600, 
                fontSize: "0.9rem" 
              }}>
                <i className="bi bi-diagram-3"></i> Área Vinculada
              </label>
              <select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #E9ECEF",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  cursor: "pointer"
                }}
              >
                <option value="">Todas las áreas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Tipo de Convenio */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                color: "#3D1A4F", 
                fontWeight: 600, 
                fontSize: "0.9rem" 
              }}>
                <i className="bi bi-file-text"></i> Tipo de Convenio
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #E9ECEF",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  cursor: "pointer"
                }}
              >
                <option value="">Todos los tipos</option>
                {tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por País */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                color: "#3D1A4F", 
                fontWeight: 600, 
                fontSize: "0.9rem" 
              }}>
                <i className="bi bi-globe"></i> País
              </label>
              <select
                value={filtroPais}
                onChange={(e) => setFiltroPais(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #E9ECEF",
                  borderRadius: "8px",
                  fontSize: "0.95rem",
                  cursor: "pointer"
                }}
              >
                <option value="">Todos los países</option>
                {paises.map((pais) => (
                  <option key={pais} value={pais}>
                    {pais}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Institución */}
            <div>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                color: "#3D1A4F", 
                fontWeight: 600, 
                fontSize: "0.9rem" 
              }}>
                <i className="bi bi-building"></i> Institución
              </label>
              <input
                type="text"
                value={filtroInstitucion}
                onChange={(e) => setFiltroInstitucion(e.target.value)}
                placeholder="Buscar institución..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #E9ECEF",
                  borderRadius: "8px",
                  fontSize: "0.95rem"
                }}
              />
            </div>
          </div>

          {/* Botón Limpiar Filtros */}
          <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
            <button
              onClick={limpiarFiltros}
              style={{
                background: "#FDB913",
                color: "#3D1A4F",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 2px 8px rgba(253, 185, 19, 0.3)"
              }}
            >
              <i className="bi bi-x-circle"></i>
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Resultados */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        <div style={{
          background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
          color: "white",
          padding: "1rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
            📊 Resultados
          </h3>
          <span style={{ 
            background: "#FDB913", 
            color: "#3D1A4F", 
            padding: "0.25rem 0.75rem", 
            borderRadius: "20px",
            fontSize: "0.9rem",
            fontWeight: 600
          }}>
            {conveniosFiltrados.length} convenio{conveniosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p style={{ marginTop: "1rem", color: "#6C757D" }}>Cargando convenios...</p>
          </div>
        ) : conveniosFiltrados.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ADB5BD" }}></i>
            <p style={{ marginTop: "1rem", color: "#6C757D", fontSize: "1.1rem" }}>
              No se encontraron convenios con los filtros seleccionados
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#F8F9FA" }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    Convenio
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    Institución
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    Tipo
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    País
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    Áreas Vinculadas
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    Estado
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    Vencimiento
                  </th>
                </tr>
              </thead>
              <tbody>
                {conveniosFiltrados.map((conv, idx) => {
                  const badgeStyle = getBadgeColor(conv.estado);
                  return (
                    <tr 
                      key={conv.id}
                      style={{ 
                        background: idx % 2 === 0 ? "white" : "#F8F9FA",
                        transition: "background 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(91, 44, 111, 0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#F8F9FA";
                      }}
                    >
                      <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF" }}>
                        <strong style={{ color: "#3D1A4F" }}>{conv.name}</strong>
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF", color: "#6C757D" }}>
                        {conv.institucion_nombre}
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF" }}>
                        <span style={{
                          background: "rgba(91, 44, 111, 0.1)",
                          color: "#5B2C6F",
                          padding: "0.25rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          fontWeight: 500
                        }}>
                          {conv.agreement_type}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF", color: "#6C757D" }}>
                        {conv.pais}
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {conv.areas_vinculadas && conv.areas_vinculadas.length > 0 ? (
                            conv.areas_vinculadas.map((area, i) => (
                              <span
                                key={i}
                                style={{
                                  background: "#E3F2FD",
                                  color: "#1976D2",
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: "8px",
                                  fontSize: "0.75rem",
                                  fontWeight: 500
                                }}
                              >
                                {area}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "#ADB5BD", fontSize: "0.85rem" }}>Sin áreas</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF" }}>
                        <span style={{
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`,
                          padding: "0.35rem 0.75rem",
                          borderRadius: "12px",
                          fontSize: "0.85rem",
                          fontWeight: 600
                        }}>
                          {conv.estado}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF", color: "#6C757D", fontSize: "0.9rem" }}>
                        {conv.expiration_date 
                          ? new Date(conv.expiration_date).toLocaleDateString("es-PE")
                          : "Sin fecha"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}