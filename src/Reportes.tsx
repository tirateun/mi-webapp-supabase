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
  tipoCompleto?: string;
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

interface MovilidadStats {
  total: number;
  completadas: number;
  pendientes: number;
  enCurso: number;
  canceladas: number;
  estudiantes: number;
  docentes: number;
  entrantes: number;
  salientes: number;
}

interface MovilidadPorEscuela {
  escuela: string;
  cantidad: number;
}

interface MovilidadPorConvenio {
  convenio: string;
  cantidad: number;
}

interface MovilidadPorPais {
  pais: string;
  entrantes: number;
  salientes: number;
}

export default function Reportes() {
  // Estados de convenios
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [conveniosPorTipo, setConveniosPorTipo] = useState<ConvenioPorTipo[]>([]);
  const [conveniosPorPais, setConveniosPorPais] = useState<ConvenioPorPais[]>([]);
  const [ejecucionContraprestaciones, setEjecucionContraprestaciones] = useState<ReporteEjecucion[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros convenios
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [responsableSeleccionado, setResponsableSeleccionado] = useState<string>("");

  // KPIs convenios
  const [totalConvenios, setTotalConvenios] = useState(0);
  const [totalPaises, setTotalPaises] = useState(0);
  const [promedioAnios, setPromedioAnios] = useState(0);
  const [totalContraprestaciones, setTotalContraprestaciones] = useState(0);
  const [contraprestacionesCumplidas, setContraprestacionesCumplidas] = useState(0);
  const [porcentajeCumplimiento, setPorcentajeCumplimiento] = useState(0);

  // Estados movilidades
  const [movilidadStats, setMovilidadStats] = useState<MovilidadStats>({
    total: 0, completadas: 0, pendientes: 0, enCurso: 0, canceladas: 0,
    estudiantes: 0, docentes: 0, entrantes: 0, salientes: 0
  });
  const [movilidadesPorEscuela, setMovilidadesPorEscuela] = useState<MovilidadPorEscuela[]>([]);
  const [movilidadesPorConvenio, setMovilidadesPorConvenio] = useState<MovilidadPorConvenio[]>([]);
  const [movilidadesPorPais, setMovilidadesPorPais] = useState<MovilidadPorPais[]>([]);
  const [movilidadesDetalle, setMovilidadesDetalle] = useState<any[]>([]);

  // Filtros movilidades
  const [movilidadFechaInicio, setMovilidadFechaInicio] = useState<string>("");
  const [movilidadFechaFin, setMovilidadFechaFin] = useState<string>("");
  const [movilidadCategoria, setMovilidadCategoria] = useState<string>("all");
  const [movilidadDireccion, setMovilidadDireccion] = useState<string>("all");

  // Tab activo
  const [activeTab, setActiveTab] = useState<"convenios" | "movilidades">("convenios");

  useEffect(() => {
    cargarReportes();
    cargarResponsables();
  }, []);

  useEffect(() => {
    if (activeTab === "movilidades") {
      cargarReportesMovilidades();
    }
  }, [activeTab, movilidadFechaInicio, movilidadFechaFin, movilidadCategoria, movilidadDireccion]);

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
      setTotalConvenios(conveniosData?.length || 0);
      
      const paisesUnicos = new Set(conveniosData?.map(c => c.pais).filter(Boolean));
      setTotalPaises(paisesUnicos.size);
      
      const promedio = conveniosData?.reduce((acc, c) => acc + (c.duration_years || 0), 0) / (conveniosData?.length || 1);
      setPromedioAnios(Math.round(promedio * 10) / 10);

      // Por tipo
      const tiposOficiales = ["Docente Asistencial", "Cooperación Técnica", "Movilidad Académica", "Investigación", "Colaboración Académica", "Consultoría", "Cotutela"];
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
        .map((tipo) => ({ tipo: tipo.length > 20 ? tipo.substring(0, 20) + "..." : tipo, tipoCompleto: tipo, cantidad: conteoTipos[tipo] || 0 }))
        .filter(t => t.cantidad > 0);
      setConveniosPorTipo(tiposProcesados);

      // Por país
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

      // Contraprestaciones
      const { data: allYearsData } = await supabase.from("agreement_years").select("id, year_start, year_end");
      const hoy = new Date();
      const yearIdsValidos = (allYearsData || []).filter(year => new Date(year.year_start) <= hoy).map(year => year.id);

      if (yearIdsValidos.length > 0) {
        const { data: contraprestacionesProgramadas } = await supabase.from("contraprestaciones").select("id, unidades_comprometidas").in("agreement_year_id", yearIdsValidos);
        let totalProgramadas = 0;
        (contraprestacionesProgramadas || []).forEach((c: any) => { totalProgramadas += c.unidades_comprometidas || 1; });
        
        const contrapIds = (contraprestacionesProgramadas || []).map(c => c.id);
        let cumplidas = 0;
        if (contrapIds.length > 0) {
          const { data: seguimientos } = await supabase.from("contraprestaciones_seguimiento").select("estado").in("contraprestacion_id", contrapIds).eq("estado", "Cumplido");
          cumplidas = seguimientos?.length || 0;
        }
        
        setTotalContraprestaciones(totalProgramadas);
        setContraprestacionesCumplidas(cumplidas);
        setPorcentajeCumplimiento(totalProgramadas > 0 ? Math.round((cumplidas / totalProgramadas) * 100) : 0);
        setEjecucionContraprestaciones([
          { estado: "Cumplido", cantidad: cumplidas },
          { estado: "Pendiente", cantidad: totalProgramadas - cumplidas }
        ]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const cargarResponsables = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    setResponsables(data || []);
  };

  const cargarReportesMovilidades = async () => {
    setLoading(true);
    try {
      let query = supabase.from("movilidades").select("*, agreement:agreements(id, name, pais)");
      if (movilidadFechaInicio) query = query.gte("start_date", movilidadFechaInicio);
      if (movilidadFechaFin) query = query.lte("start_date", movilidadFechaFin);
      if (movilidadCategoria !== "all") query = query.or("categoria.ilike.%" + movilidadCategoria + "%");
      if (movilidadDireccion !== "all") query = query.ilike("direccion", "%" + movilidadDireccion + "%");

      const { data: movilidadesData, error } = await query;
      if (error) throw error;

      const movilidades = movilidadesData || [];
      setMovilidadesDetalle(movilidades);

      const stats: MovilidadStats = {
        total: movilidades.length,
        completadas: movilidades.filter(m => m.status?.toLowerCase().includes("complet") || m.informe_enviado).length,
        pendientes: movilidades.filter(m => m.status?.toLowerCase().includes("pendiente")).length,
        enCurso: movilidades.filter(m => m.status?.toLowerCase().includes("curso")).length,
        canceladas: movilidades.filter(m => m.status?.toLowerCase().includes("cancel")).length,
        estudiantes: movilidades.filter(m => m.categoria?.toLowerCase().includes("estudi")).length,
        docentes: movilidades.filter(m => m.categoria?.toLowerCase() === "docente").length,
        entrantes: movilidades.filter(m => m.direccion?.toLowerCase() === "entrante").length,
        salientes: movilidades.filter(m => m.direccion?.toLowerCase() === "saliente").length,
      };
      setMovilidadStats(stats);

      // Por escuela
      const conteoEscuelas: Record<string, number> = {};
      movilidades.forEach((m: any) => {
        const escuela = m.programa_especifico || m.escuela || "No especificado";
        conteoEscuelas[escuela] = (conteoEscuelas[escuela] || 0) + 1;
      });
      setMovilidadesPorEscuela(Object.entries(conteoEscuelas)
        .map(([escuela, cantidad]) => ({ escuela: escuela.length > 30 ? escuela.substring(0, 30) + "..." : escuela, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad).slice(0, 8));

      // Por convenio
      const conteoConvenios: Record<string, number> = {};
      movilidades.forEach((m: any) => {
        if (m.agreement?.name) conteoConvenios[m.agreement.name] = (conteoConvenios[m.agreement.name] || 0) + 1;
      });
      setMovilidadesPorConvenio(Object.entries(conteoConvenios)
        .map(([convenio, cantidad]) => ({ convenio: convenio.length > 35 ? convenio.substring(0, 35) + "..." : convenio, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad).slice(0, 10));

      // Por país
      const conteoPaises: Record<string, { entrantes: number; salientes: number }> = {};
      movilidades.forEach((m: any) => {
        let pais = m.direccion?.toLowerCase() === "entrante" 
          ? (m.pais_origen || m.agreement?.pais || "No especificado")
          : (m.pais_destino || m.destination_country || m.agreement?.pais || "No especificado");
        if (!conteoPaises[pais]) conteoPaises[pais] = { entrantes: 0, salientes: 0 };
        if (m.direccion?.toLowerCase() === "entrante") conteoPaises[pais].entrantes++;
        else conteoPaises[pais].salientes++;
      });
      setMovilidadesPorPais(Object.entries(conteoPaises)
        .map(([pais, data]) => ({ pais: pais.length > 20 ? pais.substring(0, 20) + "..." : pais, entrantes: data.entrantes, salientes: data.salientes }))
        .sort((a, b) => (b.entrantes + b.salientes) - (a.entrantes + a.salientes)).slice(0, 10));

    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportarConveniosExcel = () => {
    const data = convenios.map(c => ({
      "Nombre": c.name,
      "Tipo(s)": Array.isArray(c.tipo_convenio) ? c.tipo_convenio.join(", ") : "-",
      "País": c.pais || "-",
      "Responsable": responsables.find(r => r.id === c.internal_responsible)?.full_name || "-",
      "Duración (años)": c.duration_years || 0,
      "Fecha Firma": c.signature_date || "-"
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Convenios");
    XLSX.writeFile(wb, "reporte_convenios_" + new Date().toISOString().split('T')[0] + ".xlsx");
  };

  const exportarMovilidadesExcel = () => {
    const data = movilidadesDetalle.map((m: any) => ({
      "Participante": m.nombre_completo || "-",
      "Categoría": m.categoria || "-",
      "Dirección": m.direccion || "-",
      "Tipo Programa": m.tipo_programa || "-",
      "País": m.direccion?.toLowerCase() === "entrante" ? (m.pais_origen || m.agreement?.pais || "-") : (m.pais_destino || m.destination_country || "-"),
      "Institución": m.agreement?.name || m.institucion_origen || m.institucion_destino || "-",
      "Escuela/Programa": m.programa_especifico || m.escuela || "-",
      "Fecha Inicio": m.start_date || "-",
      "Fecha Fin": m.end_date || "-",
      "Estado": m.status || "-",
      "Informe Enviado": m.informe_enviado ? "Sí" : "No"
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Movilidades");
    XLSX.writeFile(wb, "reporte_movilidades_" + new Date().toISOString().split('T')[0] + ".xlsx");
  };

  const limpiarFiltrosMovilidades = () => {
    setMovilidadFechaInicio("");
    setMovilidadFechaFin("");
    setMovilidadCategoria("all");
    setMovilidadDireccion("all");
  };

  // Helpers para badges
  const getCategoriaBadgeClass = (categoria: string) => {
    return categoria?.toLowerCase().includes('estudi') ? 'bg-primary' : 'bg-info';
  };

  const getCategoriaLabel = (categoria: string) => {
    return categoria?.toLowerCase().includes('estudi') ? '🎓 Estudiante' : '👨‍🏫 Docente';
  };

  const getDireccionBadgeClass = (direccion: string) => {
    return direccion?.toLowerCase() === 'entrante' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning';
  };

  const getDireccionLabel = (direccion: string) => {
    return direccion?.toLowerCase() === 'entrante' ? '📥 Entrante' : '📤 Saliente';
  };

  const getEstadoBadgeClass = (m: any) => {
    if (m.informe_enviado || m.status?.toLowerCase().includes('complet')) return 'bg-success';
    if (m.status?.toLowerCase().includes('curso')) return 'bg-info';
    if (m.status?.toLowerCase().includes('cancel')) return 'bg-danger';
    return 'bg-warning text-dark';
  };

  const getEstadoLabel = (m: any) => {
    if (m.informe_enviado) return '✅ Completada';
    return m.status || 'Pendiente';
  };

  const getPaisMovilidad = (m: any) => {
    if (m.direccion?.toLowerCase() === 'entrante') {
      return m.pais_origen || '-';
    }
    return m.pais_destino || m.destination_country || '-';
  };

  const getPorcentajeCompletadasBadgeClass = () => {
    const porcentaje = movilidadStats.total > 0 ? (movilidadStats.completadas / movilidadStats.total) : 0;
    if (porcentaje >= 0.8) return 'bg-success';
    if (porcentaje >= 0.5) return 'bg-warning';
    return 'bg-danger';
  };

  const getPorcentajeCompletadas = () => {
    return movilidadStats.total > 0 ? Math.round((movilidadStats.completadas / movilidadStats.total) * 100) : 0;
  };

  return (
    <div style={{ padding: "2rem", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ color: "#1e293b" }}>📊 Reportes</h2>
          <p className="text-muted mb-0">Análisis y estadísticas del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={"nav-link " + (activeTab === "convenios" ? "active" : "")} 
            onClick={() => setActiveTab("convenios")} 
            style={activeTab === "convenios" ? { color: "#5B2C6F", borderColor: "#5B2C6F #5B2C6F #fff" } : {}}
          >
            📄 Convenios y Contraprestaciones
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={"nav-link " + (activeTab === "movilidades" ? "active" : "")} 
            onClick={() => setActiveTab("movilidades")} 
            style={activeTab === "movilidades" ? { color: "#5B2C6F", borderColor: "#5B2C6F #5B2C6F #fff" } : {}}
          >
            🌍 Movilidades Académicas
          </button>
        </li>
      </ul>

      {/* TAB CONVENIOS */}
      {activeTab === "convenios" && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Fecha Inicio</label>
                  <input type="date" className="form-control" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Fecha Fin</label>
                  <input type="date" className="form-control" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-semibold">Responsable</label>
                  <select className="form-select" value={responsableSeleccionado} onChange={(e) => setResponsableSeleccionado(e.target.value)}>
                    <option value="">Todos</option>
                    {responsables.map((r) => (<option key={r.id} value={r.id}>{r.full_name}</option>))}
                  </select>
                </div>
                <div className="col-md-3">
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary flex-fill" onClick={cargarReportes}>🔍 Filtrar</button>
                    <button className="btn btn-success" onClick={exportarConveniosExcel} title="Exportar a Excel">📥</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">Total Convenios</p>
                  <h2 className="mb-0 fw-bold">{totalConvenios}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">Países</p>
                  <h2 className="mb-0 fw-bold">{totalPaises}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">Promedio Duración</p>
                  <h2 className="mb-0 fw-bold">{promedioAnios} años</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">Cumplimiento</p>
                  <h2 className="mb-0 fw-bold">{porcentajeCumplimiento}%</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4 g-4">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 p-4"><h5 className="mb-0 fw-bold">📊 Convenios por Tipo</h5></div>
                <div className="card-body p-4">
                  {conveniosPorTipo.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={conveniosPorTipo}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="tipo" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center text-muted py-5">No hay datos</div>}
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 p-4"><h5 className="mb-0 fw-bold">🌍 Top 10 Países</h5></div>
                <div className="card-body p-4">
                  {conveniosPorPais.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={conveniosPorPais}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="pais" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="cantidad" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center text-muted py-5">No hay datos</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0 p-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">⚙️ Estado de Contraprestaciones</h5>
                {totalContraprestaciones > 0 && (
                  <span className={"badge " + (porcentajeCumplimiento >= 80 ? 'bg-success' : porcentajeCumplimiento >= 50 ? 'bg-warning' : 'bg-danger')}>
                    {porcentajeCumplimiento}% Cumplimiento
                  </span>
                )}
              </div>
              <p className="mb-0 mt-2 text-muted small">Total: {contraprestacionesCumplidas}/{totalContraprestaciones} cumplidas</p>
            </div>
            <div className="card-body p-4">
              {ejecucionContraprestaciones.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ejecucionContraprestaciones}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                      {ejecucionContraprestaciones.map((entry, index) => (
                        <Cell key={"cell-" + index} fill={entry.estado === 'Cumplido' ? '#10b981' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-center text-muted py-5">No hay datos</div>}
            </div>
          </div>
        </>
      )}

      {/* TAB MOVILIDADES */}
      {activeTab === "movilidades" && (
        <>
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">Fecha Inicio</label>
                  <input type="date" className="form-control" value={movilidadFechaInicio} onChange={(e) => setMovilidadFechaInicio(e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">Fecha Fin</label>
                  <input type="date" className="form-control" value={movilidadFechaFin} onChange={(e) => setMovilidadFechaFin(e.target.value)} />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">Categoría</label>
                  <select className="form-select" value={movilidadCategoria} onChange={(e) => setMovilidadCategoria(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="estudi">🎓 Estudiantes</option>
                    <option value="docente">👨‍🏫 Docentes</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold">Dirección</label>
                  <select className="form-select" value={movilidadDireccion} onChange={(e) => setMovilidadDireccion(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="entrante">📥 Entrantes</option>
                    <option value="saliente">📤 Salientes</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary" onClick={limpiarFiltrosMovilidades}>Limpiar</button>
                    <button className="btn btn-success" onClick={exportarMovilidadesExcel}>📥 Exportar Excel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs Movilidades - Primera fila */}
          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">Total Registradas</p>
                  <h2 className="mb-0 fw-bold">{movilidadStats.total}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">Completadas (con informe)</p>
                  <h2 className="mb-0 fw-bold">{movilidadStats.completadas}</h2>
                  <small className="opacity-75">{getPorcentajeCompletadas()}% del total</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">Pendientes</p>
                  <h2 className="mb-0 fw-bold">{movilidadStats.pendientes}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                <div className="card-body text-white">
                  <p className="mb-1 opacity-75">En Curso</p>
                  <h2 className="mb-0 fw-bold">{movilidadStats.enCurso}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs Movilidades - Segunda fila */}
          <div className="row mb-4 g-3">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div><p className="mb-1 text-muted small">🎓 Estudiantes</p><h3 className="mb-0 fw-bold text-primary">{movilidadStats.estudiantes}</h3></div>
                    <div className="bg-primary-subtle p-3 rounded-circle"><span style={{ fontSize: '1.5rem' }}>🎓</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div><p className="mb-1 text-muted small">👨‍🏫 Docentes</p><h3 className="mb-0 fw-bold text-info">{movilidadStats.docentes}</h3></div>
                    <div className="bg-info-subtle p-3 rounded-circle"><span style={{ fontSize: '1.5rem' }}>👨‍🏫</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div><p className="mb-1 text-muted small">📥 Entrantes</p><h3 className="mb-0 fw-bold text-success">{movilidadStats.entrantes}</h3></div>
                    <div className="bg-success-subtle p-3 rounded-circle"><span style={{ fontSize: '1.5rem' }}>📥</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div><p className="mb-1 text-muted small">📤 Salientes</p><h3 className="mb-0 fw-bold text-warning">{movilidadStats.salientes}</h3></div>
                    <div className="bg-warning-subtle p-3 rounded-circle"><span style={{ fontSize: '1.5rem' }}>📤</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos de Movilidades */}
          <div className="row mb-4 g-4">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 p-4"><h5 className="mb-0 fw-bold">🏫 Por Escuela/Programa</h5></div>
                <div className="card-body p-4">
                  {movilidadesPorEscuela.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={movilidadesPorEscuela} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="escuela" type="category" width={150} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center text-muted py-5">No hay datos</div>}
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-white border-0 p-4"><h5 className="mb-0 fw-bold">🌍 Por País (Entrantes vs Salientes)</h5></div>
                <div className="card-body p-4">
                  {movilidadesPorPais.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={movilidadesPorPais}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="pais" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="entrantes" name="📥 Entrantes" fill="#10b981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="salientes" name="📤 Salientes" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="text-center text-muted py-5">No hay datos</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Movilidades por Convenio */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0 p-4">
              <h5 className="mb-0 fw-bold">📄 Movilidades por Convenio (Top 10)</h5>
              <small className="text-muted">Solo movilidades de intercambio vinculadas a convenios</small>
            </div>
            <div className="card-body p-4">
              {movilidadesPorConvenio.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={movilidadesPorConvenio} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="convenio" type="category" width={250} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="text-center text-muted py-5">No hay movilidades vinculadas a convenios</div>}
            </div>
          </div>

          {/* Resumen Registradas vs Completadas */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-0 p-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">📊 Registradas vs Completadas</h5>
                {movilidadStats.total > 0 && (
                  <span className={"badge fs-6 " + getPorcentajeCompletadasBadgeClass()}>
                    {getPorcentajeCompletadas()}% Completadas
                  </span>
                )}
              </div>
            </div>
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Completadas', value: movilidadStats.completadas, color: '#10b981' },
                          { name: 'Pendientes', value: movilidadStats.pendientes, color: '#f59e0b' },
                          { name: 'En Curso', value: movilidadStats.enCurso, color: '#3b82f6' },
                          { name: 'Canceladas', value: movilidadStats.canceladas, color: '#ef4444' },
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                        label={({ name, percent }) => name + " (" + ((percent || 0) * 100).toFixed(0) + "%)"}
                      >
                        {[
                          { name: 'Completadas', value: movilidadStats.completadas, color: '#10b981' },
                          { name: 'Pendientes', value: movilidadStats.pendientes, color: '#f59e0b' },
                          { name: 'En Curso', value: movilidadStats.enCurso, color: '#3b82f6' },
                          { name: 'Canceladas', value: movilidadStats.canceladas, color: '#ef4444' },
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={"cell-" + index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="col-md-6">
                  <table className="table table-sm">
                    <tbody>
                      <tr><td><span className="badge" style={{ backgroundColor: '#10b981' }}>●</span> Completadas</td><td className="text-end fw-bold">{movilidadStats.completadas}</td></tr>
                      <tr><td><span className="badge" style={{ backgroundColor: '#f59e0b' }}>●</span> Pendientes</td><td className="text-end fw-bold">{movilidadStats.pendientes}</td></tr>
                      <tr><td><span className="badge" style={{ backgroundColor: '#3b82f6' }}>●</span> En Curso</td><td className="text-end fw-bold">{movilidadStats.enCurso}</td></tr>
                      <tr><td><span className="badge" style={{ backgroundColor: '#ef4444' }}>●</span> Canceladas</td><td className="text-end fw-bold">{movilidadStats.canceladas}</td></tr>
                      <tr className="table-secondary"><td><strong>Total</strong></td><td className="text-end fw-bold">{movilidadStats.total}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla detalle movilidades */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 p-4"><h5 className="mb-0 fw-bold">📋 Detalle de Movilidades</h5></div>
            <div className="card-body p-0">
              {movilidadesDetalle.length === 0 ? (
                <div className="text-center text-muted py-5">No se encontraron movilidades</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="px-4 py-3">Participante</th>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3">Dirección</th>
                        <th className="px-4 py-3">País</th>
                        <th className="px-4 py-3">Escuela/Programa</th>
                        <th className="px-4 py-3">Periodo</th>
                        <th className="px-4 py-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movilidadesDetalle.slice(0, 20).map((m: any, idx: number) => (
                        <tr key={m.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                          <td className="px-4 py-3"><strong>{m.nombre_completo}</strong></td>
                          <td className="px-4 py-3">
                            <span className={"badge " + getCategoriaBadgeClass(m.categoria)}>
                              {getCategoriaLabel(m.categoria)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={"badge " + getDireccionBadgeClass(m.direccion)}>
                              {getDireccionLabel(m.direccion)}
                            </span>
                          </td>
                          <td className="px-4 py-3"><small>{getPaisMovilidad(m)}</small></td>
                          <td className="px-4 py-3"><small>{m.programa_especifico || m.escuela || '-'}</small></td>
                          <td className="px-4 py-3"><small>{m.start_date ? new Date(m.start_date).toLocaleDateString('es-PE') : '-'} - {m.end_date ? new Date(m.end_date).toLocaleDateString('es-PE') : '-'}</small></td>
                          <td className="px-4 py-3 text-center">
                            <span className={"badge " + getEstadoBadgeClass(m)}>
                              {getEstadoLabel(m)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {movilidadesDetalle.length > 0 && (
              <div className="card-footer bg-white border-0 p-3">
                <small className="text-muted">Mostrando {Math.min(20, movilidadesDetalle.length)} de {movilidadesDetalle.length} movilidades</small>
              </div>
            )}
          </div>
        </>
      )}

      {loading && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 9999 }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted">Cargando datos...</p>
          </div>
        </div>
      )}
    </div>
  );
}