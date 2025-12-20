import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Convenio {
  id: string;
  name: string;
  convenio: string;
  pais: string;
  internal_responsible: string;
  duration_years: number;
  signature_date: string;
  tipo_convenio: string[];
}

interface ConvenioPorTipo {
  tipo: string;
  cantidad: number;
}

interface ConvenioPorPais {
  pais: string;
  cantidad: number;
}

interface ReporteEjecucion {
  estado: string;
  cantidad: number;
}

interface Responsable {
  id: string;
  full_name: string;
}

// Colores para gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Reportes() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [conveniosPorTipo, setConveniosPorTipo] = useState<ConvenioPorTipo[]>([]);
  const [conveniosPorPais, setConveniosPorPais] = useState<ConvenioPorPais[]>([]);
  const [ejecucionContraprestaciones, setEjecucionContraprestaciones] = useState<ReporteEjecucion[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [responsableSeleccionado, setResponsableSeleccionado] = useState<string>("");

  // KPIs
  const [totalConvenios, setTotalConvenios] = useState(0);
  const [totalPaises, setTotalPaises] = useState(0);
  const [promedioAnios, setPromedioAnios] = useState(0);

  useEffect(() => {
    cargarReportes();
    cargarResponsables();
  }, []);

  const cargarReportes = async () => {
    setLoading(true);
    try {
      let query = supabase.from("agreements").select("*");

      if (fechaInicio) query = query.gte("signature_date", fechaInicio);
      if (fechaFin) query = query.lte("signature_date", fechaFin);
      if (responsableSeleccionado) query = query.eq("internal_responsible", responsableSeleccionado);

      const { data: conveniosData, error } = await query;
      if (error) throw error;

      setConvenios(conveniosData || []);

      // Calcular KPIs
      setTotalConvenios(conveniosData?.length || 0);
      const paisesUnicos = new Set(conveniosData?.map(c => c.pais).filter(Boolean));
      setTotalPaises(paisesUnicos.size);
      const promedio = conveniosData?.reduce((acc, c) => acc + (c.duration_years || 0), 0) / (conveniosData?.length || 1);
      setPromedioAnios(Math.round(promedio * 10) / 10);

      // Agrupar por tipo
      const tiposOficiales = [
        "Docente Asistencial",
        "Cooperación Técnica",
        "Movilidad Académica",
        "Investigación",
        "Colaboración Académica",
        "Consultoría",
        "Cotutela",
      ];

      const conteoTipos: Record<string, number> = {};
      tiposOficiales.forEach((t) => (conteoTipos[t] = 0));

      conveniosData?.forEach((c: any) => {
        if (Array.isArray(c.tipo_convenio)) {
          c.tipo_convenio.forEach((t: string) => {
            if (conteoTipos[t] !== undefined) conteoTipos[t]++;
          });
        }
      });

      const tiposProcesados = tiposOficiales
        .map((tipo) => ({
          tipo: tipo.length > 20 ? tipo.substring(0, 20) + "..." : tipo,
          tipoCompleto: tipo,
          cantidad: conteoTipos[tipo] || 0,
        }))
        .filter(t => t.cantidad > 0);
      
      setConveniosPorTipo(tiposProcesados);

      // Agrupar por país (top 10)
      const conteoPais: Record<string, number> = {};
      conveniosData?.forEach((c) => {
        const pais = c.pais || "No especificado";
        conteoPais[pais] = (conteoPais[pais] || 0) + 1;
      });
      
      const paisesProcesados = Object.entries(conteoPais)
        .map(([pais, cantidad]) => ({ pais, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10);
      
      setConveniosPorPais(paisesProcesados);

      // Estado de contraprestaciones
      const { data: contraprestaciones } = await supabase
        .from("contraprestaciones_seguimiento")
        .select("estado");

      const conteoEstados: Record<string, number> = {};
      contraprestaciones?.forEach((c) => {
        const estado = c.estado || "Pendiente";
        conteoEstados[estado] = (conteoEstados[estado] || 0) + 1;
      });
      setEjecucionContraprestaciones(
        Object.entries(conteoEstados).map(([estado, cantidad]) => ({ estado, cantidad }))
      );
    } catch (err) {
      console.error("Error cargando reportes:", err);
      alert("❌ Error al cargar reportes. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  const cargarResponsables = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["internal", "interno"])
      .order("full_name", { ascending: true });
    setResponsables(data || []);
  };

  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setResponsableSeleccionado("");
  };

  // Función para exportar a Excel
  const exportarAExcel = () => {
    try {
      // Preparar datos para exportar
      const datosParaExportar = convenios.map((convenio: any, index: number) => ({
        'N°': index + 1,
        'Nombre': convenio.name || '-',
        'Tipo(s)': Array.isArray(convenio.tipo_convenio) 
          ? convenio.tipo_convenio.join(', ') 
          : convenio.convenio || '-',
        'País': convenio.pais || '-',
        'Responsable Interno': responsables.find((r: any) => r.id === convenio.internal_responsible)?.full_name || '-',
        'Duración (años)': convenio.duration_years || '-',
        'Fecha de Firma': convenio.signature_date 
          ? new Date(convenio.signature_date).toLocaleDateString('es-PE')
          : '-',
        'Resolución Rectoral': convenio['Resolución Rectoral'] || '-',
        'Objetivos': convenio.objetivos || '-',
        'Estado': convenio.estado || 'ACTIVO',
      }));

      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosParaExportar);

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 5 },   // N°
        { wch: 40 },  // Nombre
        { wch: 30 },  // Tipo(s)
        { wch: 15 },  // País
        { wch: 30 },  // Responsable
        { wch: 12 },  // Duración
        { wch: 15 },  // Fecha Firma
        { wch: 20 },  // Resolución
        { wch: 50 },  // Objetivos
        { wch: 10 },  // Estado
      ];
      ws['!cols'] = columnWidths;

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Convenios');

      // Generar nombre de archivo con fecha
      const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
      const nombreArchivo = `Convenios_${fecha}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo);

      alert(`✅ Archivo exportado exitosamente: ${nombreArchivo}`);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('❌ Error al exportar a Excel. Revisa la consola.');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1400px", backgroundColor: '#f8f9fa' }}>
      {/* HEADER */}
      <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-white">
              <h2 className="mb-1 fw-bold">📊 Panel de Reportes y Análisis</h2>
              <p className="mb-0 opacity-75">Visualización de datos y estadísticas de convenios</p>
            </div>
            <button 
              className="btn btn-light shadow-sm px-4" 
              onClick={exportarAExcel}
              disabled={convenios.length === 0}
            >
              <i className="bi bi-file-earmark-excel me-2"></i>
              📥 Exportar a Excel
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 opacity-75">Total Convenios</h6>
                  <h2 className="mb-0 fw-bold">{totalConvenios}</h2>
                </div>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>📋</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 opacity-75">Países Alcanzados</h6>
                  <h2 className="mb-0 fw-bold">{totalPaises}</h2>
                </div>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>🌍</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 opacity-75">Duración Promedio</h6>
                  <h2 className="mb-0 fw-bold">{promedioAnios} años</h2>
                </div>
                <div style={{ fontSize: '3rem', opacity: 0.3 }}>⏱️</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 p-4">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">🔍 Filtros de Búsqueda</h5>
            {(fechaInicio || fechaFin || responsableSeleccionado) && (
              <button className="btn btn-sm btn-outline-secondary" onClick={limpiarFiltros}>
                ✕ Limpiar filtros
              </button>
            )}
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Fecha inicio</label>
              <input
                type="date"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Fecha fin</label>
              <input
                type="date"
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Responsable Interno</label>
              <select
                className="form-select"
                value={responsableSeleccionado}
                onChange={(e) => setResponsableSeleccionado(e.target.value)}
              >
                <option value="">Todos los responsables</option>
                {responsables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-primary w-100" onClick={cargarReportes}>
                🔄 Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="row g-4 mb-4">
        {/* Distribución por Tipo */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="mb-0 fw-bold">📈 Distribución por Tipo de Convenio</h5>
            </div>
            <div className="card-body p-4">
              {conveniosPorTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={conveniosPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="tipo" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      labelFormatter={(value, payload) => {
                        const item = payload[0]?.payload;
                        return item?.tipoCompleto || value;
                      }}
                    />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <div style={{ fontSize: '3rem', opacity: 0.3 }}>📊</div>
                  <p className="mt-2">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Convenios por País */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="mb-0 fw-bold">🌍 Top 10 Países con Convenios</h5>
            </div>
            <div className="card-body p-4">
              {conveniosPorPais.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={conveniosPorPais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="pais" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="cantidad" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <div style={{ fontSize: '3rem', opacity: 0.3 }}>🌎</div>
                  <p className="mt-2">No hay datos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estado de Contraprestaciones */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-0 p-4">
          <h5 className="mb-0 fw-bold">⚙️ Estado de Contraprestaciones</h5>
        </div>
        <div className="card-body p-4">
          {ejecucionContraprestaciones.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ejecucionContraprestaciones}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="cantidad" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted py-5">
              <div style={{ fontSize: '3rem', opacity: 0.3 }}>⚙️</div>
              <p className="mt-2">No hay datos de contraprestaciones</p>
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE CONVENIOS */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 p-4">
          <h5 className="mb-0 fw-bold">📋 Detalle de Convenios</h5>
        </div>
        <div className="card-body p-0">
          {convenios.length === 0 ? (
            <div className="text-center text-muted py-5">
              <div style={{ fontSize: '4rem', opacity: 0.3 }}>📄</div>
              <p className="mt-3 mb-0">No se encontraron convenios con los filtros seleccionados</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold">Nombre</th>
                    <th className="px-4 py-3 fw-semibold">Tipo(s)</th>
                    <th className="px-4 py-3 fw-semibold">País</th>
                    <th className="px-4 py-3 fw-semibold">Responsable</th>
                    <th className="px-4 py-3 fw-semibold text-center">Duración</th>
                    <th className="px-4 py-3 fw-semibold">Fecha Firma</th>
                  </tr>
                </thead>
                <tbody>
                  {convenios.map((c, idx) => (
                    <tr key={c.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                      <td className="px-4 py-3">
                        <strong>{c.name}</strong>
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ maxWidth: '250px' }}>
                          {Array.isArray(c.tipo_convenio) ? (
                            <div className="d-flex flex-wrap gap-1">
                              {c.tipo_convenio.map((tipo, i) => (
                                <span key={i} className="badge bg-primary-subtle text-primary">
                                  {tipo}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-success-subtle text-success">
                          {c.pais || "No especificado"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <small className="text-muted">
                          {responsables.find((r) => r.id === c.internal_responsible)?.full_name || "-"}
                        </small>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge bg-info-subtle text-info">
                          {c.duration_years} año{c.duration_years !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <small>
                          {c.signature_date
                            ? new Date(c.signature_date).toLocaleDateString("es-PE")
                            : "-"}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {convenios.length > 0 && (
          <div className="card-footer bg-white border-0 p-3">
            <small className="text-muted">
              Mostrando {convenios.length} convenio{convenios.length !== 1 ? 's' : ''}
            </small>
          </div>
        )}
      </div>
    </div>
  );
}


