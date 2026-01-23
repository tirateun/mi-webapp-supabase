// src/ConsultaConvenios.tsx

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// ✅ Función para formatear fechas sin problemas de zona horaria
const formatDateLocal = (dateString: string | null | undefined, formato: "corto" | "largo" = "corto"): string => {
  if (!dateString) return "Sin fecha";
  
  // Parsear manualmente para evitar conversión UTC
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return "Sin fecha";
  
  if (formato === "largo") {
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    return `${day.toString().padStart(2, "0")} de ${meses[month - 1]} de ${year}`;
  }
  
  // Formato corto: dd/mm/yyyy (formato Perú)
  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
};

interface Convenio {
  id: string;
  name: string;
  agreement_type: string;
  pais: string;
  signature_date: string;
  expiration_date: string;
  duration_years: number;
  estado: string;
  institucion_nombre?: string;
  areas_vinculadas?: string[];
  // 🆕 Nuevos campos:
  objetivos?: string;
  convenio?: string; // marco o específico
  resolucion_rectoral?: string;
  sub_tipo_docente?: string;
  version?: number;
  estado_db?: string; // activo/inactivo
  document_url?: string;
  external_responsible?: string;
  internal_responsible_name?: string;
  convenio_maestro_id?: string;
  created_at?: string;
  updated_at?: string;
  // 🆕 NUEVOS CAMPOS:
  institucion_email?: string;
  institucion_contacto?: string;
  institucion_telefono?: string;
  internal_responsible_email?: string;
  internal_responsible_cargo?: string;
  renovaciones_count?: number;
  ultimo_cambio?: string;
}

interface ConsultaConveniosProps {
  userId: string;
  role: string;
}

export default function ConsultaConvenios({ userId, role }: ConsultaConveniosProps) {
  
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
  const [convenioSeleccionado, setConvenioSeleccionado] = useState<Convenio | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

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
          duration_years,
          institucion_id,
          objetivos,
          convenio,
          "Resolución Rectoral",
          sub_tipo_docente,
          version,
          estado,
          document_url,
          external_responsible,
          internal_responsible,
          convenio_maestro_id,
          created_at,
          updated_at
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
        .select("id, nombre, email, contacto, telefono");

      const institucionesMap = new Map(
        (institucionesData || []).map(i => [i.id, {
          nombre: i.nombre,
          email: i.email,
          contacto: i.contacto,
          telefono: i.telefono
        }])
      );
      // 2b. Cargar perfiles (responsables internos)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email, cargo");

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.id, {
          full_name: p.full_name,
          email: p.email,
          cargo: p.cargo
        }])
      );
      // 3. Procesar datos
      const conveniosConDatos = await Promise.all(
        (data || []).map(async (conv: any) => {
          // Obtener áreas vinculadas
          const { data: areasVinc, error: areasError } = await supabase
            .from("agreement_areas_vinculadas")
            .select(`
              area_vinculada_id,
              areas_vinculadas!agreement_areas_vinculadas_area_vinculada_id_fkey(nombre)
            `)
            .eq("agreement_id", conv.id);

          const areasNombres = (areasVinc || [])
            .map((a: any) => a.areas_vinculadas?.nombre)
            .filter(Boolean);

            const { data: historial } = await supabase
            .from("agreements_history")
            .select("action, changed_at")
            .eq("agreement_id", conv.id)
            .in("action", ["RENOVACIÓN", "RENOVACION", "renovación", "renovacion"])
            .order("changed_at", { ascending: false });
          
          const renovacionesCount = historial?.length || 0;
          const ultimoCambio = historial?.[0]?.changed_at;

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
  
          const institucionData = institucionesMap.get(conv.institucion_id);
          const responsableData = profilesMap.get(conv.internal_responsible);

          return {
            id: conv.id,
            name: conv.name,
            agreement_type: tipoConvenio,
            pais: conv.pais || "No especificado",
            signature_date: conv.signature_date,
            expiration_date: conv.expiration_date,
            duration_years: conv.duration_years,
            estado,
            areas_vinculadas: areasNombres,
            // Datos de institución:
            institucion_nombre: institucionData?.nombre || "Sin institución",
            institucion_email: institucionData?.email,
            institucion_contacto: institucionData?.contacto,
            institucion_telefono: institucionData?.telefono,
            // Datos del convenio:
            objetivos: conv.objetivos,
            convenio: conv.convenio,
            resolucion_rectoral: conv["Resolución Rectoral"],
            sub_tipo_docente: conv.sub_tipo_docente,
            version: conv.version,
            estado_db: conv.estado,
            document_url: conv.document_url,
            external_responsible: conv.external_responsible,
            convenio_maestro_id: conv.convenio_maestro_id,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            // Datos de responsable interno:
            internal_responsible_name: responsableData?.full_name,
            internal_responsible_email: responsableData?.email,
            internal_responsible_cargo: responsableData?.cargo,
            // Renovaciones:
            renovaciones_count: renovacionesCount,
            ultimo_cambio: ultimoCambio,
          };
        })  // ← Cierra el .map
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
    let resultado = [...convenios];
    
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
// 🆕 AGREGAR AQUÍ:
const verDetalleConvenio = (convenio: Convenio) => {
  setConvenioSeleccionado(convenio);
  setMostrarModal(true);
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
                  <th style={{ padding: "1rem", textAlign: "center", fontWeight: 600, color: "#3D1A4F", borderBottom: "2px solid #E9ECEF" }}>
                    Acciones
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
          {formatDateLocal(conv.expiration_date)}
        </td>
        {/* 🆕 NUEVA COLUMNA: ACCIONES */}
        <td style={{ padding: "1rem", borderBottom: "1px solid #E9ECEF", textAlign: "center" }}>
          <button
            onClick={() => verDetalleConvenio(conv)}
            style={{
              background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 4px rgba(91, 44, 111, 0.3)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(91, 44, 111, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(91, 44, 111, 0.3)";
            }}
          >
            <i className="bi bi-eye"></i>
            Ver
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle del Convenio - VERSIÓN COMPLETA */}
{mostrarModal && convenioSeleccionado && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "2rem"
    }}
    onClick={() => setMostrarModal(false)}
  >
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "16px",
        maxWidth: "1100px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header del Modal */}
      <div
        style={{
          background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
          color: "white",
          padding: "1.5rem 2rem",
          borderRadius: "16px 16px 0 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600 }}>
          <i className="bi bi-file-text"></i> Información Completa del Convenio
        </h2>
        <button
          onClick={() => setMostrarModal(false)}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "white",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.2)";
          }}
        >
          ×
        </button>
      </div>

      {/* Contenido del Modal */}
      <div style={{ padding: "2rem" }}>
        {/* Nombre del Convenio */}
        <div style={{ marginBottom: "2rem" }}>
          <h3
            style={{
              color: "#3D1A4F",
              fontSize: "1.75rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              lineHeight: 1.3
            }}
          >
            {convenioSeleccionado.name}
          </h3>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <span
              style={{
                background: getBadgeColor(convenioSeleccionado.estado).bg,
                color: getBadgeColor(convenioSeleccionado.estado).color,
                border: `1px solid ${getBadgeColor(convenioSeleccionado.estado).border}`,
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.9rem",
                fontWeight: 600
              }}
            >
              {convenioSeleccionado.estado}
            </span>
            <span
              style={{
                background: "rgba(91, 44, 111, 0.1)",
                color: "#5B2C6F",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                fontSize: "0.9rem",
                fontWeight: 500
              }}
            >
              {convenioSeleccionado.agreement_type}
            </span>
            {convenioSeleccionado.convenio && (
              <span
                style={{
                  background: "#FFF3CD",
                  color: "#856404",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  textTransform: "capitalize"
                }}
              >
                {convenioSeleccionado.convenio}
              </span>
            )}
            {convenioSeleccionado.version && convenioSeleccionado.version > 1 && (
              <span
                style={{
                  background: "#D1ECF1",
                  color: "#0C5460",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: 500
                }}
              >
                Versión {convenioSeleccionado.version}
              </span>
            )}
          </div>
        </div>

        {/* Grid de Información Principal */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}
        >
          {/* Institución */}
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <i className="bi bi-building" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "0.9rem" }}>Institución</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "1rem" }}>
              {convenioSeleccionado.institucion_nombre}
            </p>
          </div>

          {/* País */}
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <i className="bi bi-globe" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "0.9rem" }}>País</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "1rem" }}>
              {convenioSeleccionado.pais}
            </p>
          </div>

          {/* Duración */}
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <i className="bi bi-hourglass-split" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "0.9rem" }}>Duración</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "1rem" }}>
              {convenioSeleccionado.duration_years} {convenioSeleccionado.duration_years === 1 ? 'año' : 'años'}
            </p>
          </div>
        </div>

        {/* Fechas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}
        >
          {/* Fecha de Firma */}
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <i className="bi bi-calendar-check" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "0.9rem" }}>Fecha de Firma</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "1rem" }}>
              {formatDateLocal(convenioSeleccionado.signature_date, "largo") || "No especificada"}
            </p>
          </div>

          {/* Fecha de Vencimiento */}
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.25rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <i className="bi bi-calendar-x" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "0.9rem" }}>Fecha de Vencimiento</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "1rem" }}>
              {formatDateLocal(convenioSeleccionado.expiration_date, "largo")}
            </p>
          </div>
        </div>

         {/* Duración y Renovaciones */}
        <div
          style={{
            background: "#F8F9FA",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #E9ECEF",
            marginBottom: "2rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <i className="bi bi-arrow-repeat" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
            <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Duración y Renovaciones</strong>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {/* Duración Original */}
            <div
              style={{
                background: "white",
                padding: "1.25rem",
                borderRadius: "10px",
                border: "2px solid #FFF3CD"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <i className="bi bi-hourglass-split" style={{ color: "#856404", fontSize: "1.1rem" }}></i>
                <strong style={{ color: "#856404", fontSize: "0.85rem" }}>Duración Original</strong>
              </div>
              <p style={{ margin: 0, fontSize: "1.5rem", color: "#2C3E50", fontWeight: 700 }}>
                {convenioSeleccionado.duration_years}
                <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#6C757D", marginLeft: "0.25rem" }}>
                  {convenioSeleccionado.duration_years === 1 ? 'año' : 'años'}
                </span>
              </p>
            </div>

            {/* Número de Renovaciones */}
            <div
              style={{
                background: "white",
                padding: "1.25rem",
                borderRadius: "10px",
                border: "2px solid #D1ECF1"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <i className="bi bi-arrow-clockwise" style={{ color: "#0C5460", fontSize: "1.1rem" }}></i>
                <strong style={{ color: "#0C5460", fontSize: "0.85rem" }}>Renovaciones</strong>
              </div>
              <p style={{ margin: 0, fontSize: "1.5rem", color: "#2C3E50", fontWeight: 700 }}>
                {convenioSeleccionado.renovaciones_count || 0}
                <span style={{ fontSize: "0.9rem", fontWeight: 400, color: "#6C757D", marginLeft: "0.25rem" }}>
                  {convenioSeleccionado.renovaciones_count === 1 ? 'vez' : 'veces'}
                </span>
              </p>
            </div>

            {/* Última Renovación */}
            {convenioSeleccionado.ultimo_cambio && (
              <div
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "10px",
                  border: "2px solid #D4EDDA"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <i className="bi bi-calendar-event" style={{ color: "#155724", fontSize: "1.1rem" }}></i>
                  <strong style={{ color: "#155724", fontSize: "0.85rem" }}>Última Renovación</strong>
                </div>
                <p style={{ margin: 0, fontSize: "0.95rem", color: "#2C3E50", fontWeight: 600 }}>
                  {new Date(convenioSeleccionado.ultimo_cambio).toLocaleDateString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </p>
              </div>
            )}
          </div>
        </div>            
        {/* Responsables */}
        <div
          style={{
            background: "#F8F9FA",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #E9ECEF",
            marginBottom: "2rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <i className="bi bi-people" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
            <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Responsables del Convenio</strong>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {/* Responsable Interno UNMSM */}
            {convenioSeleccionado.internal_responsible_name && (
              <div
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "10px",
                  border: "2px solid #E3F2FD"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <i className="bi bi-person-badge" style={{ color: "#1976D2", fontSize: "1.1rem" }}></i>
                  <strong style={{ color: "#1976D2", fontSize: "0.9rem" }}>Responsable UNMSM</strong>
                </div>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#2C3E50", fontWeight: 600 }}>
                  {convenioSeleccionado.internal_responsible_name}
                </p>
                {convenioSeleccionado.internal_responsible_cargo && (
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#6C757D", fontStyle: "italic" }}>
                    {convenioSeleccionado.internal_responsible_cargo}
                  </p>
                )}
                {convenioSeleccionado.internal_responsible_email && (
                  <a 
                    href={`mailto:${convenioSeleccionado.internal_responsible_email}`}
                    style={{ 
                      fontSize: "0.9rem", 
                      color: "#5B2C6F",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <i className="bi bi-envelope"></i>
                    {convenioSeleccionado.internal_responsible_email}
                  </a>
                )}
              </div>
            )}

            {/* Responsable Externo */}
            {convenioSeleccionado.external_responsible && (
              <div
                style={{
                  background: "white",
                  padding: "1.25rem",
                  borderRadius: "10px",
                  border: "2px solid #E8F5E9"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <i className="bi bi-person" style={{ color: "#388E3C", fontSize: "1.1rem" }}></i>
                  <strong style={{ color: "#388E3C", fontSize: "0.9rem" }}>Responsable Externo</strong>
                </div>
                <p style={{ margin: 0, fontSize: "1rem", color: "#2C3E50", fontWeight: 600 }}>
                  {convenioSeleccionado.external_responsible}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Contacto de la Institución */}
        {(convenioSeleccionado.institucion_email || convenioSeleccionado.institucion_telefono) && (
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF",
              marginBottom: "2rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <i className="bi bi-envelope" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Contacto de la Institución</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              {convenioSeleccionado.institucion_contacto && (
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#6C757D" }}>Nombre</p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem", color: "#495057" }}>
                    {convenioSeleccionado.institucion_contacto}
                  </p>
                </div>
              )}
              {convenioSeleccionado.institucion_email && (
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#6C757D" }}>Email</p>
                  <a 
                    href={`mailto:${convenioSeleccionado.institucion_email}`}
                    style={{ 
                      margin: "0.25rem 0 0 0", 
                      fontSize: "0.95rem", 
                      color: "#5B2C6F",
                      textDecoration: "none",
                      display: "block"
                    }}
                  >
                    {convenioSeleccionado.institucion_email}
                  </a>
                </div>
              )}
              {convenioSeleccionado.institucion_telefono && (
                <div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#6C757D" }}>Teléfono</p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.95rem", color: "#495057" }}>
                    {convenioSeleccionado.institucion_telefono}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Resolución Rectoral */}
        {convenioSeleccionado.resolucion_rectoral && (
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF",
              marginBottom: "2rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <i className="bi bi-file-earmark-text" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Resolución Rectoral</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "0.95rem" }}>
              {convenioSeleccionado.resolucion_rectoral}
            </p>
          </div>
        )}

        {/* Sub Tipo Docente */}
        {convenioSeleccionado.sub_tipo_docente && (
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF",
              marginBottom: "2rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <i className="bi bi-tags" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Sub Tipo</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "0.95rem" }}>
              {convenioSeleccionado.sub_tipo_docente}
            </p>
          </div>
        )}

        {/* Áreas Vinculadas */}
        <div
          style={{
            background: "#F8F9FA",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #E9ECEF",
            marginBottom: "2rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <i className="bi bi-diagram-3" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
            <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Áreas Vinculadas</strong>
          </div>
          {convenioSeleccionado.areas_vinculadas && convenioSeleccionado.areas_vinculadas.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {convenioSeleccionado.areas_vinculadas.map((area, i) => (
                <span
                  key={i}
                  style={{
                    background: "#E3F2FD",
                    color: "#1976D2",
                    padding: "0.5rem 1rem",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    border: "1px solid #90CAF9"
                  }}
                >
                  {area}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#6C757D", fontStyle: "italic" }}>
              No hay áreas vinculadas registradas
            </p>
          )}
        </div>

        {/* Objetivos */}
        {convenioSeleccionado.objetivos && (
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF",
              marginBottom: "2rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <i className="bi bi-bullseye" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Objetivos</strong>
            </div>
            <p style={{ margin: 0, color: "#495057", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {convenioSeleccionado.objetivos}
            </p>
          </div>
        )}

        {/* Documento */}
        {convenioSeleccionado.document_url && (
          <div
            style={{
              background: "#F8F9FA",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid #E9ECEF",
              marginBottom: "2rem"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <i className="bi bi-file-pdf" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
              <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Documento</strong>
            </div>
            <a
              href={convenioSeleccionado.document_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "linear-gradient(135deg, #5B2C6F 0%, #3D1A4F 100%)",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontSize: "0.95rem",
                fontWeight: 500,
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(91, 44, 111, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <i className="bi bi-download"></i>
              Descargar Documento
            </a>
          </div>
        )}

        {/* Información del Sistema */}
        <div
          style={{
            background: "#F8F9FA",
            padding: "1.5rem",
            borderRadius: "12px",
            border: "1px solid #E9ECEF",
            marginBottom: "2rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <i className="bi bi-info-circle" style={{ color: "#5B2C6F", fontSize: "1.25rem" }}></i>
            <strong style={{ color: "#3D1A4F", fontSize: "1rem" }}>Información del Sistema</strong>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#6C757D" }}>ID del Convenio</p>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#495057", fontFamily: "monospace" }}>
                {convenioSeleccionado.id.substring(0, 8)}...
              </p>
            </div>
            {convenioSeleccionado.created_at && (
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6C757D" }}>Creado el</p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#495057" }}>
                  {new Date(convenioSeleccionado.created_at).toLocaleDateString("es-PE")}
                </p>
              </div>
            )}
            {convenioSeleccionado.updated_at && (
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6C757D" }}>Última actualización</p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#495057" }}>
                  {new Date(convenioSeleccionado.updated_at).toLocaleDateString("es-PE")}
                </p>
              </div>
            )}
            {convenioSeleccionado.estado_db && (
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6C757D" }}>Estado en Base de Datos</p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "#495057", textTransform: "capitalize" }}>
                  {convenioSeleccionado.estado_db}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button
            onClick={() => setMostrarModal(false)}
            style={{
              background: "#6C757D",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 500,
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#5A6268";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#6C757D";
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}