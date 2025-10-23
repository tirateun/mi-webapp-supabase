import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Convenio {
  id: string;
  name: string;
  convenio: string;
  pais: string;
  internal_responsible: string;
  duration_years: number;
  signature_date: string;
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

export default function Reportes() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [conveniosPorTipo, setConveniosPorTipo] = useState<ConvenioPorTipo[]>([]);
  const [conveniosPorPais, setConveniosPorPais] = useState<ConvenioPorPais[]>([]);
  const [ejecucionContraprestaciones, setEjecucionContraprestaciones] = useState<ReporteEjecucion[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Filtros
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [responsableSeleccionado, setResponsableSeleccionado] = useState<string>("");

  useEffect(() => {
    cargarReportes();
    cargarResponsables();
  }, []);

  // 📦 Cargar datos principales
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

      // 📊 1️⃣ Agrupar por tipo
      const conteoTipo: Record<string, number> = {};
      conveniosData?.forEach((c) => {
        const tipo = c.convenio || "Sin tipo";
        conteoTipo[tipo] = (conteoTipo[tipo] || 0) + 1;
      });
      setConveniosPorTipo(Object.entries(conteoTipo).map(([tipo, cantidad]) => ({ tipo, cantidad })));

      // 🌎 2️⃣ Agrupar por país
      const conteoPais: Record<string, number> = {};
      conveniosData?.forEach((c) => {
        const pais = c.pais || "No especificado";
        conteoPais[pais] = (conteoPais[pais] || 0) + 1;
      });
      setConveniosPorPais(Object.entries(conteoPais).map(([pais, cantidad]) => ({ pais, cantidad })));

      // ⚙️ 3️⃣ Estado de contraprestaciones
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

  // 📋 Cargar responsables internos
  const cargarResponsables = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("role", ["internal", "interno"])
      .order("full_name", { ascending: true });
    setResponsables(data || []);
  };

  if (loading) return <p className="text-center mt-4">Cargando reportes...</p>;

  return (
    <div className="container mt-4" style={{ maxWidth: "1100px" }}>
      <h3 className="fw-bold text-primary mb-4">📊 Panel de Reportes</h3>

      {/* 🔍 FILTROS */}
      <div className="card shadow-sm p-3 mb-4 border-0">
        <h5 className="fw-semibold text-secondary mb-3">Filtros</h5>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label>Desde</label>
            <input
              type="date"
              className="form-control"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-3">
            <label>Hasta</label>
            <input
              type="date"
              className="form-control"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-3">
            <label>Responsable Interno</label>
            <select
              className="form-select"
              value={responsableSeleccionado}
              onChange={(e) => setResponsableSeleccionado(e.target.value)}
            >
              <option value="">Todos</option>
              {responsables.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-end">
          <button className="btn btn-primary" onClick={cargarReportes}>
            🔄 Aplicar Filtros
          </button>
        </div>
      </div>

      {/* 📈 GRÁFICOS */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 border-0">
            <h5 className="text-secondary fw-bold mb-3">Tipos de Convenio</h5>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={conveniosPorTipo as any}
                  dataKey="cantidad"
                  nameKey="tipo"
                  outerRadius={100}
                  fill="#3b82f6"
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow-sm p-3 border-0">
            <h5 className="text-secondary fw-bold mb-3">Convenios por País</h5>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={conveniosPorPais.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pais" angle={-20} textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card shadow-sm mb-4 p-3 border-0">
        <h5 className="text-secondary fw-bold mb-3">Estado de Contraprestaciones</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ejecucionContraprestaciones}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="estado" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 📋 TABLA DE RESULTADOS */}
      <div className="card shadow-sm p-3 border-0 mt-4">
        <h5 className="fw-bold text-secondary mb-3">📄 Detalle de Convenios</h5>
        {convenios.length === 0 ? (
          <p className="text-muted">No se encontraron convenios con los filtros seleccionados.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>País</th>
                  <th>Responsable Interno</th>
                  <th>Duración (años)</th>
                  <th>Fecha Firma</th>
                </tr>
              </thead>
              <tbody>
                {convenios.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.convenio || "-"}</td>
                    <td>{c.pais || "-"}</td>
                    <td>{responsables.find((r) => r.id === c.internal_responsible)?.full_name || "-"}</td>
                    <td>{c.duration_years}</td>
                    <td>
                      {c.signature_date
                        ? new Date(c.signature_date).toLocaleDateString("es-PE")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


