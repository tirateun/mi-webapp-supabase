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
  institucion?: {
    id: string;
    nombre: string;
  };
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

// Interfaces para Contraprestaciones
interface ContraprestacionDashboard {
  total_contraprestaciones: number;
  total_convenios_con_contraprestaciones: number;
  total_instituciones: number;
  total_unidades_comprometidas: number;
  cumplidas: number;
  pendientes: number;
  parcialmente_cumplidas: number;
  sin_seguimiento: number;
  porcentaje_cumplimiento_global: number;
  tipos_contraprestaciones_distintos: number;
}

interface TopTipoContraprestacion {
  catalogo_id: number;
  tipo_contraprestacion: string;
  unidad: string;
  total_contraprestaciones: number;
  total_unidades_comprometidas: number;
  porcentaje: number;
}

interface ContraprestacionPorInstitucion {
  institucion_id: string;
  institucion: string;
  pais: string;
  tipo_institucion: string;
  total_contraprestaciones: number;
  total_convenios: number;
  total_unidades_comprometidas: number;
  cumplidas: number;
  pendientes: number;
  parcialmente_cumplidas: number;
  sin_seguimiento: number;
  porcentaje_cumplimiento: number;
}

interface ContraprestacionPorArea {
  area_id: string;
  area_vinculada: string;
  total_contraprestaciones: number;
  total_convenios: number;
  total_unidades_comprometidas: number;
  cumplidas: number;
  pendientes: number;
}


// ============================================
// COMPONENTES AUXILIARES PARA TAB INFORMES
// ============================================

function TablaReporteInformesConvenios({ datos }: { datos: any[] }) {
  const totalGeneral = datos.reduce((sum, r) => sum + r.total_alumnos, 0);
  const totalInternos = datos.reduce((sum, r) => sum + r.total_internos, 0);
  const totalCursos = datos.reduce((sum, r) => sum + r.total_cursos, 0);

  return (
    <div className="card">
      <div className="card-header bg-light">
        <div className="row text-center">
          <div className="col">
            <div className="text-muted small">Total Convenios</div>
            <div className="h3 mb-0">{datos.length}</div>
          </div>
          <div className="col">
            <div className="text-muted small">Total Internos</div>
            <div className="h3 mb-0 text-primary">{totalInternos}</div>
          </div>
          <div className="col">
            <div className="text-muted small">Total Cursos</div>
            <div className="h3 mb-0 text-success">{totalCursos}</div>
          </div>
          <div className="col">
            <div className="text-muted small">Total Alumnos</div>
            <div className="h3 mb-0 text-warning">{totalGeneral}</div>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-dark">
              <tr>
                <th>Convenio</th>
                <th>Institución</th>
                <th className="text-end">Internos</th>
                <th className="text-end">Cursos</th>
                <th className="text-end">Total</th>
                <th className="text-end">Informes</th>
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    No hay datos disponibles con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                datos.map((row, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{row.convenio_nombre}</td>
                    <td>{row.institucion_nombre}</td>
                    <td className="text-end">{row.total_internos}</td>
                    <td className="text-end">{row.total_cursos}</td>
                    <td className="text-end fw-bold text-primary">{row.total_alumnos}</td>
                    <td className="text-end">
                      <span className="badge bg-secondary">{row.cantidad_informes}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TablaReporteInformesInstituciones({ datos }: { datos: any[] }) {
  const totalConvenios = datos.reduce((sum, r) => sum + r.total_convenios, 0);
  const totalInternos = datos.reduce((sum, r) => sum + r.total_internos, 0);
  const totalCursos = datos.reduce((sum, r) => sum + r.total_cursos, 0);
  const totalAlumnos = datos.reduce((sum, r) => sum + r.total_alumnos, 0);

  return (
    <div className="card">
      <div className="card-header bg-light">
        <div className="row text-center">
          <div className="col">
            <div className="text-muted small">Instituciones</div>
            <div className="h3 mb-0">{datos.length}</div>
          </div>
          <div className="col">
            <div className="text-muted small">Total Convenios</div>
            <div className="h3 mb-0 text-info">{totalConvenios}</div>
          </div>
          <div className="col">
            <div className="text-muted small">Total Internos</div>
            <div className="h3 mb-0 text-primary">{totalInternos}</div>
          </div>
          <div className="col">
            <div className="text-muted small">Total Cursos</div>
            <div className="h3 mb-0 text-success">{totalCursos}</div>
          </div>
          <div className="col">
            <div className="text-muted small">Total Alumnos</div>
            <div className="h3 mb-0 text-warning">{totalAlumnos}</div>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-dark">
              <tr>
                <th>Institución</th>
                <th className="text-end">Convenios</th>
                <th className="text-end">Internos</th>
                <th className="text-end">Cursos</th>
                <th className="text-end">Total</th>
                <th className="text-end">Informes</th>
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    No hay datos disponibles con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                datos.map((row, idx) => (
                  <tr key={idx}>
                    <td className="fw-bold">{row.institucion_nombre}</td>
                    <td className="text-end">
                      <span className="badge bg-info">{row.total_convenios}</span>
                    </td>
                    <td className="text-end">{row.total_internos}</td>
                    <td className="text-end">{row.total_cursos}</td>
                    <td className="text-end fw-bold text-primary">{row.total_alumnos}</td>
                    <td className="text-end">
                      <span className="badge bg-secondary">{row.cantidad_informes}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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
  const [mostrarTodasMovilidades, setMostrarTodasMovilidades] = useState(false);

  // Filtros movilidades
  const [movilidadFechaInicio, setMovilidadFechaInicio] = useState<string>("");
  const [movilidadFechaFin, setMovilidadFechaFin] = useState<string>("");
  const [movilidadCategoria, setMovilidadCategoria] = useState<string>("all");
  const [movilidadDireccion, setMovilidadDireccion] = useState<string>("all");

  // Tab activo
  const [activeTab, setActiveTab] = useState<"convenios" | "movilidades" | "informes" | "contraprestaciones">("convenios");

  // Estados para tab de Informes
  const [vistaInformes, setVistaInformes] = useState<"convenios" | "instituciones">("convenios");
  const [reporteInformesConvenios, setReporteInformesConvenios] = useState<any[]>([]);
  const [reporteInformesInstituciones, setReporteInformesInstituciones] = useState<any[]>([]);
  const [informesLoading, setInformesLoading] = useState(false);
  const [informesAnioFiltro, setInformesAnioFiltro] = useState<number | null>(null);
  const [informesSemestreFiltro, setInformesSemestreFiltro] = useState<number | null>(null);
  const [informesAreaFiltro, setInformesAreaFiltro] = useState<string>("");
  const [informesInstitucionFiltro, setInformesInstitucionFiltro] = useState<string>("");
  const [informesAniosDisponibles, setInformesAniosDisponibles] = useState<number[]>([]);
  const [informesAreasDisponibles, setInformesAreasDisponibles] = useState<any[]>([]);
  const [informesInstitucionesDisponibles, setInformesInstitucionesDisponibles] = useState<any[]>([]);

  // Estados para Contraprestaciones
  const [vistaContraprestaciones, setVistaContraprestaciones] = useState<"tipos" | "instituciones" | "areas">("tipos");
  const [dashboardContra, setDashboardContra] = useState<ContraprestacionDashboard | null>(null);
  const [topTipos, setTopTipos] = useState<TopTipoContraprestacion[]>([]);
  const [contraPorInstitucion, setContraPorInstitucion] = useState<ContraprestacionPorInstitucion[]>([]);
  const [contraPorArea, setContraPorArea] = useState<ContraprestacionPorArea[]>([]);
  const [contraLoading, setContraLoading] = useState(false);


  useEffect(() => {
    cargarReportes();
    cargarResponsables();
  }, []);

  useEffect(() => {
    if (activeTab === 'contraprestaciones') {
      cargarDatosContraprestaciones();
    }
  }, [activeTab]);


  useEffect(() => {
    if (activeTab === "movilidades") {
      cargarReportesMovilidades();
    } else if (activeTab === "informes") {
      cargarCatalogosInformes();
    }
  }, [activeTab, movilidadFechaInicio, movilidadFechaFin, movilidadCategoria, movilidadDireccion]);

  // useEffect para recargar cuando cambian filtros de informes
  useEffect(() => {
    if (activeTab === "informes") {
      if (vistaInformes === "convenios") {
        cargarReporteInformesConvenios();
      } else {
        cargarReporteInformesInstituciones();
      }
    }
  }, [activeTab, vistaInformes, informesAnioFiltro, informesSemestreFiltro, informesAreaFiltro, informesInstitucionFiltro]);

  const cargarReportes = async () => {
    setLoading(true);
    try {
      let query = supabase
  .from("agreements")
  .select(`
    *,
    institucion:instituciones(id, nombre)
  `);
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

      // Contraprestaciones - SOLO convenios con contraprestaciones programadas
      const { data: allYearsData } = await supabase.from("agreement_years").select("id, agreement_id, year_start, year_end");
      const hoy = new Date();
      const yearIdsValidos = (allYearsData || []).filter(year => new Date(year.year_start) <= hoy).map(year => year.id);

      if (yearIdsValidos.length > 0) {
        // Obtener contraprestaciones programadas (solo las que existen)
        const { data: contraprestacionesProgramadas } = await supabase
          .from("contraprestaciones")
          .select("id, agreement_year_id, unidades_comprometidas")
          .in("agreement_year_id", yearIdsValidos);
        
        const contraprestaciones = contraprestacionesProgramadas || [];
        
        // Total de contraprestaciones programadas (cada registro cuenta como 1)
        const totalProgramadas = contraprestaciones.length;
        
        // Contar convenios únicos que tienen contraprestaciones
        const agreementYearIds = contraprestaciones.map(c => c.agreement_year_id);
        const yearsConContrap = (allYearsData || []).filter(y => agreementYearIds.includes(y.id));
        const conveniosConContrap = new Set(yearsConContrap.map(y => y.agreement_id)).size;
        
        // Obtener cumplidas (contraprestaciones con al menos un seguimiento "Cumplido")
        const contrapIds = contraprestaciones.map(c => c.id);
        let cumplidas = 0;
        
        if (contrapIds.length > 0) {
          const { data: seguimientos } = await supabase
            .from("contraprestaciones_seguimiento")
            .select("contraprestacion_id, estado")
            .in("contraprestacion_id", contrapIds)
            .eq("estado", "Cumplido");
          
          // Contar contraprestaciones únicas que tienen al menos un cumplido
          const contrapCumplidas = new Set((seguimientos || []).map(s => s.contraprestacion_id));
          cumplidas = contrapCumplidas.size;
        }
        
        setTotalContraprestaciones(totalProgramadas);
        setContraprestacionesCumplidas(cumplidas);
        setPorcentajeCumplimiento(totalProgramadas > 0 ? Math.round((cumplidas / totalProgramadas) * 100) : 0);
        setEjecucionContraprestaciones([
          { estado: "Cumplido", cantidad: cumplidas },
          { estado: "Pendiente", cantidad: totalProgramadas - cumplidas }
        ]);
        
        // Log para verificar
        console.log("📊 Reporte Contraprestaciones:", {
          conveniosTotales: conveniosData?.length,
          conveniosConContraprestaciones: conveniosConContrap,
          contraprestacionesProgramadas: totalProgramadas,
          contraprestacionesCumplidas: cumplidas,
          porcentaje: totalProgramadas > 0 ? Math.round((cumplidas / totalProgramadas) * 100) : 0
        });
      } else {
        setTotalContraprestaciones(0);
        setContraprestacionesCumplidas(0);
        setPorcentajeCumplimiento(0);
        setEjecucionContraprestaciones([]);
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
      let query = supabase
  .from("movilidades")
  .select(`
    *,
    agreement:agreements!movilidades_agreement_id_fkey(
      id,
      name,
      pais,
      institucion_id,
      instituciones!agreements_institucion_id_fkey(id, nombre)
    )
  `);
      if (movilidadFechaInicio) query = query.gte("start_date", movilidadFechaInicio);
      if (movilidadFechaFin) query = query.lte("start_date", movilidadFechaFin);
      if (movilidadCategoria !== "all") query = query.or("categoria.ilike.%" + movilidadCategoria + "%");
      if (movilidadDireccion !== "all") query = query.ilike("direccion", "%" + movilidadDireccion + "%");

      const { data: movilidadesData, error } = await query;
      if (error) throw error;

      const movilidades = movilidadesData || [];
      setMovilidadesDetalle(movilidades);
      setMostrarTodasMovilidades(false); // Resetear a vista limitada

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
      // Por institución (de convenios)
const conteoInstituciones: Record<string, number> = {};
movilidades.forEach((m: any) => {
  // Debug
  if (m.agreement) {
    console.log("Agreement:", m.agreement.name);
    console.log("Institución:", m.agreement.instituciones);
  }
  
  const institucion = m.agreement?.instituciones?.[0]?.nombre || m.agreement?.instituciones?.nombre;
  if (institucion) {
    conteoInstituciones[institucion] = (conteoInstituciones[institucion] || 0) + 1;
  }
});
setMovilidadesPorConvenio(Object.entries(conteoInstituciones)
  .map(([convenio, cantidad]) => ({ convenio, cantidad }))
  .sort((a, b) => b.cantidad - a.cantidad)
  .slice(0, 10));
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
        if (m.agreement?.institucion?.nombre) conteoConvenios[m.agreement.name] = (conteoConvenios[m.agreement.name] || 0) + 1;
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
      "Institución": c.institucion?.nombre || "-",
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
      "Institución": m.agreement?.institucion?.nombre || m.institucion_origen || m.institucion_destino || "-",
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

  // ============================================
  // FUNCIONES PARA TAB DE INFORMES
  // ============================================

  const cargarCatalogosInformes = async () => {
    try {
      const { data: informes } = await supabase
        .from("informes_semestrales")
        .select("anio")
        .order("anio", { ascending: false });
      
      const anios = [...new Set((informes || []).map((i: any) => i.anio))];
      setInformesAniosDisponibles(anios);

      const { data: areas } = await supabase
        .from("areas_vinculadas")
        .select("id, nombre")
        .order("nombre");
      
      setInformesAreasDisponibles(areas || []);

      const { data: instituciones } = await supabase
        .from("instituciones")
        .select("id, nombre")
        .order("nombre");
      
      setInformesInstitucionesDisponibles(instituciones || []);
    } catch (error) {
      console.error("Error cargando catálogos de informes:", error);
    }
  };

  const cargarReporteInformesConvenios = async () => {
    setInformesLoading(true);
    try {
      let query = supabase
        .from("informes_semestrales")
        .select(`
          id,
          convenio_id,
          anio,
          semestre,
          agreements!inner (
            id,
            name,
            institucion_id,
            instituciones (
              nombre
            )
          )
        `);

      if (informesAnioFiltro) query = query.eq("anio", informesAnioFiltro);
      if (informesSemestreFiltro) query = query.eq("semestre", informesSemestreFiltro);
      if (informesInstitucionFiltro) {
        query = query.eq("agreements.institucion_id", informesInstitucionFiltro);
      }

      const { data: informes, error: informesError } = await query;
      if (informesError) throw informesError;

      const reporteMap: Record<string, any> = {};

      for (const informe of informes || []) {
        let queryDetalle = supabase
          .from("informes_semestrales_detalle")
          .select("alumnos_internos, alumnos_cursos, total_alumnos, area_vinculada_id")
          .eq("informe_id", informe.id);

        if (informesAreaFiltro) {
          queryDetalle = queryDetalle.eq("area_vinculada_id", informesAreaFiltro);
        }

        const { data: detalles } = await queryDetalle;

        const totalInternos = (detalles || []).reduce((sum: number, d: any) => sum + d.alumnos_internos, 0);
        const totalCursos = (detalles || []).reduce((sum: number, d: any) => sum + d.alumnos_cursos, 0);
        const totalAlumnos = (detalles || []).reduce((sum: number, d: any) => sum + d.total_alumnos, 0);

        const convenioId = informe.convenio_id;
        const agreement = (informe as any).agreements;
        if (!reporteMap[convenioId]) {
          reporteMap[convenioId] = {
            convenio_id: convenioId,
            convenio_nombre: agreement?.name || "Sin nombre",
            institucion_nombre: agreement?.instituciones?.nombre || "Sin institución",
            total_internos: 0,
            total_cursos: 0,
            total_alumnos: 0,
            cantidad_informes: 0
          };
        }

        reporteMap[convenioId].total_internos += totalInternos;
        reporteMap[convenioId].total_cursos += totalCursos;
        reporteMap[convenioId].total_alumnos += totalAlumnos;
        reporteMap[convenioId].cantidad_informes += 1;
      }

      const reporte = Object.values(reporteMap).sort((a: any, b: any) => 
        b.total_alumnos - a.total_alumnos
      );

      setReporteInformesConvenios(reporte);
    } catch (error) {
      console.error("Error cargando reporte de convenios:", error);
    } finally {
      setInformesLoading(false);
    }
  };

  const cargarReporteInformesInstituciones = async () => {
    setInformesLoading(true);
    try {
      let query = supabase
        .from("informes_semestrales")
        .select(`
          id,
          convenio_id,
          anio,
          semestre,
          agreements!inner (
            id,
            name,
            institucion_id,
            instituciones (
              id,
              nombre
            )
          )
        `);

      if (informesAnioFiltro) query = query.eq("anio", informesAnioFiltro);
      if (informesSemestreFiltro) query = query.eq("semestre", informesSemestreFiltro);
      if (informesInstitucionFiltro) {
        query = query.eq("agreements.institucion_id", informesInstitucionFiltro);
      }

      const { data: informes, error: informesError } = await query;
      if (informesError) throw informesError;

      const reporteMap: Record<string, any> = {};

      for (const informe of informes || []) {
        let queryDetalle = supabase
          .from("informes_semestrales_detalle")
          .select("alumnos_internos, alumnos_cursos, total_alumnos, area_vinculada_id")
          .eq("informe_id", informe.id);

        if (informesAreaFiltro) {
          queryDetalle = queryDetalle.eq("area_vinculada_id", informesAreaFiltro);
        }

        const { data: detalles } = await queryDetalle;

        const totalInternos = (detalles || []).reduce((sum: number, d: any) => sum + d.alumnos_internos, 0);
        const totalCursos = (detalles || []).reduce((sum: number, d: any) => sum + d.alumnos_cursos, 0);
        const totalAlumnos = (detalles || []).reduce((sum: number, d: any) => sum + d.total_alumnos, 0);

        const agreement = (informe as any).agreements;
        const institucionNombre = agreement?.instituciones?.nombre || "Sin institución";
        
        if (!reporteMap[institucionNombre]) {
          reporteMap[institucionNombre] = {
            institucion_nombre: institucionNombre,
            convenios_set: new Set(),
            total_internos: 0,
            total_cursos: 0,
            total_alumnos: 0,
            cantidad_informes: 0
          };
        }

        reporteMap[institucionNombre].convenios_set.add(informe.convenio_id);
        reporteMap[institucionNombre].total_internos += totalInternos;
        reporteMap[institucionNombre].total_cursos += totalCursos;
        reporteMap[institucionNombre].total_alumnos += totalAlumnos;
        reporteMap[institucionNombre].cantidad_informes += 1;
      }

      const reporte = Object.values(reporteMap).map((r: any) => ({
        institucion_nombre: r.institucion_nombre,
        total_convenios: r.convenios_set.size,
        total_internos: r.total_internos,
        total_cursos: r.total_cursos,
        total_alumnos: r.total_alumnos,
        cantidad_informes: r.cantidad_informes
      })).sort((a: any, b: any) => b.total_alumnos - a.total_alumnos);

      setReporteInformesInstituciones(reporte);
    } catch (error) {
      console.error("Error cargando reporte de instituciones:", error);
    } finally {
      setInformesLoading(false);
    }
  };

  const limpiarFiltrosInformes = () => {
    setInformesAnioFiltro(null);
    setInformesSemestreFiltro(null);
    setInformesAreaFiltro("");
    setInformesInstitucionFiltro("");
  };

  const cargarDatosContraprestaciones = async () => {
    setContraLoading(true);
    try {
      const { data: dashboard } = await supabase
        .from('vista_dashboard_contraprestaciones')
        .select('*')
        .single();
      
      setDashboardContra(dashboard);

      const { data: tipos } = await supabase
        .from('vista_top_tipos_contraprestaciones')
        .select('*');
      
      setTopTipos(tipos || []);

      const { data: instituciones } = await supabase
        .from('vista_contraprestaciones_por_institucion')
        .select('*');
      
      setContraPorInstitucion(instituciones || []);

      const { data: areas } = await supabase
        .from('vista_contraprestaciones_por_area')
        .select('*');
      
      setContraPorArea(areas || []);

    } catch (error) {
      console.error('Error cargando contraprestaciones:', error);
    } finally {
      setContraLoading(false);
    }
  };

  const exportarContraprestacionesExcel = () => {
    let datos: any[] = [];
    let nombreHoja = '';

    if (vistaContraprestaciones === 'tipos') {
      datos = topTipos.map((t: TopTipoContraprestacion) => ({
        'Tipo de Contraprestación': t.tipo_contraprestacion,
        'Unidad': t.unidad,
        'Total': t.total_contraprestaciones,
        'Unidades Comprometidas': t.total_unidades_comprometidas,
        'Porcentaje': `${t.porcentaje}%`
      }));
      nombreHoja = 'Top de Tipos';
    } else if (vistaContraprestaciones === 'instituciones') {
      datos = contraPorInstitucion.map((i: ContraprestacionPorInstitucion) => ({
        'Institución': i.institucion,
        'País': i.pais,
        'Tipo': i.tipo_institucion,
        'Total Contraprestaciones': i.total_contraprestaciones,
        'Convenios': i.total_convenios,
        'Cumplidas': i.cumplidas,
        'Pendientes': i.pendientes,
        '% Cumplimiento': `${i.porcentaje_cumplimiento}%`
      }));
      nombreHoja = 'Por Institución';
    } else {
      datos = contraPorArea.map((a: ContraprestacionPorArea) => ({
        'Área Vinculada': a.area_vinculada,
        'Total Contraprestaciones': a.total_contraprestaciones,
        'Convenios': a.total_convenios,
        'Cumplidas': a.cumplidas,
        'Pendientes': a.pendientes
      }));
      nombreHoja = 'Por Área';
    }

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
    XLSX.writeFile(wb, `Contraprestaciones_${nombreHoja.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  const exportarInformesCSV = () => {
    const datos = vistaInformes === "convenios" ? reporteInformesConvenios : reporteInformesInstituciones;
    
    if (datos.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    let csv = "";
    if (vistaInformes === "convenios") {
      csv = "Convenio,Institución,Alumnos Internos,Alumnos Cursos,Total Alumnos,Cantidad Informes\n";
      datos.forEach((r: any) => {
        csv += `"${r.convenio_nombre}","${r.institucion_nombre}",${r.total_internos},${r.total_cursos},${r.total_alumnos},${r.cantidad_informes}\n`;
      });
    } else {
      csv = "Institución,Total Convenios,Alumnos Internos,Alumnos Cursos,Total Alumnos,Cantidad Informes\n";
      datos.forEach((r: any) => {
        csv += `"${r.institucion_nombre}",${r.total_convenios},${r.total_internos},${r.total_cursos},${r.total_alumnos},${r.cantidad_informes}\n`;
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_informes_${vistaInformes}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <li className="nav-item">
          <button 
            className={"nav-link " + (activeTab === "informes" ? "active" : "")} 
            onClick={() => setActiveTab("informes")} 
            style={activeTab === "informes" ? { color: "#5B2C6F", borderColor: "#5B2C6F #5B2C6F #fff" } : {}}
          >
            📈 Informes Semestrales
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={"nav-link " + (activeTab === "contraprestaciones" ? "active" : "")} 
            onClick={() => setActiveTab("contraprestaciones")}
            style={activeTab === "contraprestaciones" ? { color: "#5B2C6F", borderColor: "#5B2C6F #5B2C6F #fff" } : {}}
          >
            <i className="bi bi-clipboard-check me-2"></i>
            Contraprestaciones
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
              <p className="mb-0 mt-2 text-muted small">
                📊 Solo convenios con contraprestaciones programadas • {contraprestacionesCumplidas} cumplidas de {totalContraprestaciones} programadas
              </p>
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
              ) : <div className="text-center text-muted py-5">No hay convenios con contraprestaciones programadas</div>}
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
              <h5 className="mb-0 fw-bold">📄 Movilidades por Institución (Top 10)</h5>
              <small className="text-muted">Solo movilidades de intercambio vinculadas a convenios</small>
            </div>
            <div className="card-body p-4">
              {movilidadesPorConvenio.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={movilidadesPorConvenio} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="convenio" type="category" width={350} tick={{ fontSize: 11 }} />
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
                      {(mostrarTodasMovilidades 
                        ? movilidadesDetalle 
                        : movilidadesDetalle.slice(0, 20)
                      ).map((m: any, idx: number) => (
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
              <div className="card-footer bg-white border-0 p-3 d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Mostrando {mostrarTodasMovilidades ? movilidadesDetalle.length : Math.min(20, movilidadesDetalle.length)} de {movilidadesDetalle.length} movilidades
                </small>
                {movilidadesDetalle.length > 20 && (
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setMostrarTodasMovilidades(!mostrarTodasMovilidades)}
                  >
                    {mostrarTodasMovilidades ? '📄 Ver menos' : '📋 Ver todas'}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB INFORMES SEMESTRALES */}
      {activeTab === "informes" && (
        <div>
          {/* Sub-tabs: Por Convenio / Por Institución */}
          <div className="btn-group mb-4" role="group">
            <button
              type="button"
              className={`btn ${vistaInformes === "convenios" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setVistaInformes("convenios")}
            >
              <i className="bi bi-file-text me-2"></i>
              Por Convenio
            </button>
            <button
              type="button"
              className={`btn ${vistaInformes === "instituciones" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setVistaInformes("instituciones")}
            >
              <i className="bi bi-building me-2"></i>
              Por Institución
            </button>
          </div>

          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">🔍 Filtros</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold">Año</label>
                  <select
                    className="form-select"
                    value={informesAnioFiltro || ""}
                    onChange={(e) => setInformesAnioFiltro(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Todos</option>
                    {informesAniosDisponibles.map(anio => (
                      <option key={anio} value={anio}>{anio}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Semestre</label>
                  <select
                    className="form-select"
                    value={informesSemestreFiltro || ""}
                    onChange={(e) => setInformesSemestreFiltro(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Todos</option>
                    <option value="1">Semestre I</option>
                    <option value="2">Semestre II</option>
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-bold">Área Vinculada</label>
                  <select
                    className="form-select"
                    value={informesAreaFiltro}
                    onChange={(e) => setInformesAreaFiltro(e.target.value)}
                  >
                    <option value="">Todas</option>
                    {informesAreasDisponibles.map(area => (
                      <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                  </select>
                </div>

                {vistaInformes === "convenios" && (
                  <div className="col-md-3">
                    <label className="form-label fw-bold">Institución</label>
                    <select
                      className="form-select"
                      value={informesInstitucionFiltro}
                      onChange={(e) => setInformesInstitucionFiltro(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {informesInstitucionesDisponibles.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-3">
                <button className="btn btn-secondary me-2" onClick={limpiarFiltrosInformes}>
                  🔄 Limpiar Filtros
                </button>
                <button className="btn btn-success" onClick={exportarInformesCSV}>
                  📥 Exportar CSV
                </button>
              </div>
            </div>
          </div>

          {/* Contenido */}
          {informesLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : vistaInformes === "convenios" ? (
            <TablaReporteInformesConvenios datos={reporteInformesConvenios} />
          ) : (
            <TablaReporteInformesInstituciones datos={reporteInformesInstituciones} />
          )}
        </div>
      )}


      {/* TAB CONTRAPRESTACIONES */}
      {activeTab === "contraprestaciones" && (
        <div>
          {/* Dashboard de KPIs */}
          {dashboardContra && (
            <div className="row g-4 mb-4">
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <div className="text-muted small mb-2">Total Contraprestaciones</div>
                    <div className="h2 mb-0 text-primary fw-bold">{dashboardContra?.total_contraprestaciones}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <div className="text-muted small mb-2">Convenios con Contraprestaciones</div>
                    <div className="h2 mb-0 text-info fw-bold">{dashboardContra?.total_convenios_con_contraprestaciones}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <div className="text-muted small mb-2">Cumplidas</div>
                    <div className="h2 mb-0 text-success fw-bold">{dashboardContra?.cumplidas}</div>
                    <small className="text-muted">{dashboardContra?.porcentaje_cumplimiento_global}% del total</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center">
                    <div className="text-muted small mb-2">Instituciones</div>
                    <div className="h2 mb-0 text-warning fw-bold">{dashboardContra?.total_instituciones}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tabs */}
          <div className="btn-group mb-4" role="group">
            <button
              type="button"
              className={`btn ${vistaContraprestaciones === "tipos" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setVistaContraprestaciones("tipos")}
            >
              <i className="bi bi-bar-chart me-2"></i>
              Top de Tipos
            </button>
            <button
              type="button"
              className={`btn ${vistaContraprestaciones === "instituciones" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setVistaContraprestaciones("instituciones")}
            >
              <i className="bi bi-building me-2"></i>
              Por Institución
            </button>
            <button
              type="button"
              className={`btn ${vistaContraprestaciones === "areas" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setVistaContraprestaciones("areas")}
            >
              <i className="bi bi-diagram-3 me-2"></i>
              Por Área Vinculada
            </button>
          </div>

          {/* Botón exportar */}
          <div className="mb-4">
            <button className="btn btn-success" onClick={exportarContraprestacionesExcel}>
              📥 Exportar a Excel
            </button>
          </div>

          {contraLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Vista: Top de Tipos */}
              {vistaContraprestaciones === "tipos" && (
                <div className="row g-4">
                  {/* Gráfico de barras */}
                  <div className="col-md-8">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0 p-4">
                        <h5 className="mb-0 fw-bold">📊 Top de Tipos de Contraprestaciones</h5>
                      </div>
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={topTipos}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="tipo_contraprestacion" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total_contraprestaciones" fill="#3b82f6" name="Total" />
                            <Bar dataKey="total_unidades_comprometidas" fill="#10b981" name="Unidades" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de pie */}
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0 p-4">
                        <h5 className="mb-0 fw-bold">📈 Distribución %</h5>
                      </div>
                      <div className="card-body">
                        <ResponsiveContainer width="100%" height={400}>
                          <PieChart>
                            <Pie
                              data={topTipos as any[]}
                              dataKey="total_contraprestaciones"
                              nameKey="tipo_contraprestacion"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(entry: any) => `${entry.porcentaje}%`}
                            >
                              {topTipos.map((_: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Tabla detalle */}
                  <div className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-header bg-white border-0 p-4">
                        <h5 className="mb-0 fw-bold">📋 Detalle por Tipo</h5>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f8f9fa' }}>
                              <tr>
                                <th className="px-4 py-3">Tipo de Contraprestación</th>
                                <th className="px-4 py-3">Unidad</th>
                                <th className="px-4 py-3 text-end">Total</th>
                                <th className="px-4 py-3 text-end">Unidades Comprometidas</th>
                                <th className="px-4 py-3 text-end">Porcentaje</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topTipos.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="text-center py-5 text-muted">
                                    No hay datos disponibles
                                  </td>
                                </tr>
                              ) : (
                                topTipos.map((tipo: TopTipoContraprestacion) => (
                                  <tr key={tipo.catalogo_id}>
                                    <td className="px-4 py-3 fw-bold">{tipo.tipo_contraprestacion}</td>
                                    <td className="px-4 py-3">
                                      <span className="badge bg-secondary">{tipo.unidad}</span>
                                    </td>
                                    <td className="px-4 py-3 text-end">
                                      <span className="badge bg-primary">{tipo.total_contraprestaciones}</span>
                                    </td>
                                    <td className="px-4 py-3 text-end">{tipo.total_unidades_comprometidas}</td>
                                    <td className="px-4 py-3 text-end">
                                      <strong className="text-primary">{tipo.porcentaje}%</strong>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista: Por Institución */}
              {vistaContraprestaciones === "instituciones" && (
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 p-4">
                    <h5 className="mb-0 fw-bold">🏛️ Contraprestaciones por Institución</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th className="px-4 py-3">Institución</th>
                            <th className="px-4 py-3">País</th>
                            <th className="px-4 py-3">Tipo</th>
                            <th className="px-4 py-3 text-end">Total</th>
                            <th className="px-4 py-3 text-end">Convenios</th>
                            <th className="px-4 py-3 text-end">Cumplidas</th>
                            <th className="px-4 py-3 text-end">Pendientes</th>
                            <th className="px-4 py-3 text-end">% Cumplimiento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contraPorInstitucion.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-5 text-muted">
                                No hay datos disponibles
                              </td>
                            </tr>
                          ) : (
                            contraPorInstitucion.map((inst: ContraprestacionPorInstitucion) => (
                              <tr key={inst.institucion_id}>
                                <td className="px-4 py-3 fw-bold">{inst.institucion}</td>
                                <td className="px-4 py-3">
                                  <span className="badge bg-info">{inst.pais}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <small className="text-muted">{inst.tipo_institucion}</small>
                                </td>
                                <td className="px-4 py-3 text-end">
                                  <span className="badge bg-primary">{inst.total_contraprestaciones}</span>
                                </td>
                                <td className="px-4 py-3 text-end">{inst.total_convenios}</td>
                                <td className="px-4 py-3 text-end">
                                  <span className="badge bg-success">{inst.cumplidas}</span>
                                </td>
                                <td className="px-4 py-3 text-end">
                                  {inst.pendientes > 0 ? (
                                    <span className="badge bg-warning">{inst.pendientes}</span>
                                  ) : (
                                    <span className="text-muted">0</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-end">
                                  <div className="d-flex align-items-center justify-content-end">
                                    <div className="progress" style={{ width: '80px', height: '8px' }}>
                                      <div 
                                        className={`progress-bar ${inst.porcentaje_cumplimiento === 100 ? 'bg-success' : inst.porcentaje_cumplimiento >= 50 ? 'bg-warning' : 'bg-danger'}`}
                                        style={{ width: `${inst.porcentaje_cumplimiento}%` }}
                                      ></div>
                                    </div>
                                    <strong className="ms-2 text-primary">{inst.porcentaje_cumplimiento}%</strong>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista: Por Área Vinculada */}
              {vistaContraprestaciones === "areas" && (
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-0 p-4">
                    <h5 className="mb-0 fw-bold">🎓 Contraprestaciones por Área Vinculada</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th className="px-4 py-3">Escuela Profesional</th>
                            <th className="px-4 py-3 text-end">Total</th>
                            <th className="px-4 py-3 text-end">Convenios</th>
                            <th className="px-4 py-3 text-end">Unidades</th>
                            <th className="px-4 py-3 text-end">Cumplidas</th>
                            <th className="px-4 py-3 text-end">Pendientes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contraPorArea.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-5 text-muted">
                                No hay datos disponibles
                              </td>
                            </tr>
                          ) : (
                            contraPorArea.map((area: ContraprestacionPorArea) => (
                              <tr key={area.area_id}>
                                <td className="px-4 py-3 fw-bold">{area.area_vinculada}</td>
                                <td className="px-4 py-3 text-end">
                                  <span className="badge bg-primary">{area.total_contraprestaciones}</span>
                                </td>
                                <td className="px-4 py-3 text-end">{area.total_convenios}</td>
                                <td className="px-4 py-3 text-end">{area.total_unidades_comprometidas}</td>
                                <td className="px-4 py-3 text-end">
                                  <span className="badge bg-success">{area.cumplidas}</span>
                                </td>
                                <td className="px-4 py-3 text-end">
                                  {area.pendientes > 0 ? (
                                    <span className="badge bg-warning">{area.pendientes}</span>
                                  ) : (
                                    <span className="text-muted">0</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
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