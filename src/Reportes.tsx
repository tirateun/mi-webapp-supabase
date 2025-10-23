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

export default function Reportes() {
  const [conveniosPorTipo, setConveniosPorTipo] = useState<ConvenioPorTipo[]>([]);
  const [conveniosPorPais, setConveniosPorPais] = useState<ConvenioPorPais[]>([]);
  const [ejecucionContraprestaciones, setEjecucionContraprestaciones] = useState<ReporteEjecucion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    setLoading(true);
    try {
      // 📊 1️⃣ Convenios por tipo (marco / específico)
      const { data: conveniosTipo } = await supabase
        .from("agreements")
        .select("convenio");

      if (conveniosTipo) {
        const conteoTipo: Record<string, number> = {};
        conveniosTipo.forEach((c) => {
          const tipo = c.convenio || "Sin tipo";
          conteoTipo[tipo] = (conteoTipo[tipo] || 0) + 1;
        });
        setConveniosPorTipo(
          Object.entries(conteoTipo).map(([tipo, cantidad]) => ({ tipo, cantidad }))
        );
      }

      // 🌎 2️⃣ Convenios por país
      const { data: conveniosPais } = await supabase
        .from("agreements")
        .select("pais");

      if (conveniosPais) {
        const conteoPais: Record<string, number> = {};
        conveniosPais.forEach((c) => {
          const pais = c.pais || "No especificado";
          conteoPais[pais] = (conteoPais[pais] || 0) + 1;
        });
        setConveniosPorPais(
          Object.entries(conteoPais).map(([pais, cantidad]) => ({ pais, cantidad }))
        );
      }

      // ⚙️ 3️⃣ Estado de contraprestaciones
      const { data: contraprestaciones } = await supabase
        .from("contraprestaciones_seguimiento")
        .select("estado");

      if (contraprestaciones) {
        const conteoEstados: Record<string, number> = {};
        contraprestaciones.forEach((c) => {
          const estado = c.estado || "Pendiente";
          conteoEstados[estado] = (conteoEstados[estado] || 0) + 1;
        });
        setEjecucionContraprestaciones(
          Object.entries(conteoEstados).map(([estado, cantidad]) => ({
            estado,
            cantidad,
          }))
        );
      }
    } catch (err) {
      console.error("Error cargando reportes:", err);
      alert("❌ Error al cargar reportes. Revisa consola.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-4">Cargando reportes...</p>;
  }

  return (
    <div className="container mt-4" style={{ maxWidth: "1100px" }}>
      <h3 className="fw-bold text-primary mb-4">📊 Panel de Reportes</h3>

      {/* 1️⃣ Reporte: Convenios por tipo */}
      <div className="card shadow-sm mb-4 p-3 border-0">
        <h5 className="text-secondary fw-bold mb-3">Tipos de Convenio</h5>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={conveniosPorTipo as any} // ✅ Fix de tipos
              dataKey="cantidad"
              nameKey="tipo"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#3b82f6"
              label
            />
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 2️⃣ Reporte: Convenios por país */}
      <div className="card shadow-sm mb-4 p-3 border-0">
        <h5 className="text-secondary fw-bold mb-3">Convenios por País</h5>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={conveniosPorPais.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="pais" angle={-20} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-muted small mt-2">
          * Solo se muestran los 10 países con más convenios registrados.
        </p>
      </div>

      {/* 3️⃣ Reporte: Cumplimiento de contraprestaciones */}
      <div className="card shadow-sm mb-4 p-3 border-0">
        <h5 className="text-secondary fw-bold mb-3">
          Estado de Cumplimiento de Contraprestaciones
        </h5>
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

      <div className="text-center mt-4 mb-4">
        <button
          className="btn btn-outline-primary"
          onClick={cargarReportes}
        >
          🔄 Actualizar Datos
        </button>
      </div>
    </div>
  );
}

