import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface ConvenioPorTipo {
  tipo_convenio: string;
  total: number;
}

interface ContraprestacionesPorAnio {
  año: number;
  cumplidas: number;
}

interface InstitucionesActivas {
  nombre: string;
  total_convenios: number;
}

const COLORS = ["#1d4ed8", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#0ea5e9", "#a855f7"];

export default function Reportes() {
  const [conveniosPorTipo, setConveniosPorTipo] = useState<ConvenioPorTipo[]>([]);
  const [contraprestacionesPorAnio, setContraprestacionesPorAnio] = useState<
    ContraprestacionesPorAnio[]
  >([]);
  const [institucionesActivas, setInstitucionesActivas] = useState<InstitucionesActivas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportes();
  }, []);

  const fetchReportes = async () => {
    setLoading(true);

    try {
      // 🧩 1️⃣ Convenios agrupados por tipo
      const { data: convenios, error: err1 } = await supabase
        .from("agreements")
        .select("tipo_convenio");

      if (err1) throw err1;

      const conteoPorTipo: Record<string, number> = {};
      convenios?.forEach((c: any) => {
        if (Array.isArray(c.tipo_convenio)) {
          c.tipo_convenio.forEach((t: string) => {
            conteoPorTipo[t] = (conteoPorTipo[t] || 0) + 1;
          });
        } else if (c.tipo_convenio) {
          conteoPorTipo[c.tipo_convenio] = (conteoPorTipo[c.tipo_convenio] || 0) + 1;
        }
      });

      setConveniosPorTipo(
        Object.entries(conteoPorTipo).map(([tipo, total]) => ({
          tipo_convenio: tipo,
          total,
        }))
      );

      // 🧩 2️⃣ Contraprestaciones cumplidas por año
      const { data: contraprestaciones, error: err2 } = await supabase
        .from("contraprestaciones_seguimiento")
        .select("año, estado");

      if (err2) throw err2;

      const porAnio: Record<number, number> = {};
      contraprestaciones?.forEach((c: any) => {
        if (["Cumplido", "cumplido", "Completado", "completado"].includes(c.estado)) {
          porAnio[c.año] = (porAnio[c.año] || 0) + 1;
        }
      });

      setContraprestacionesPorAnio(
        Object.entries(porAnio).map(([año, cumplidas]) => ({
          año: Number(año),
          cumplidas,
        }))
      );

      // 🧩 3️⃣ Instituciones con más convenios
      const { data: instituciones, error: err3 } = await supabase
        .from("agreements")
        .select("institucion_id");

      if (err3) throw err3;

      const conteoInstituciones: Record<string, number> = {};
      instituciones?.forEach((a: any) => {
        if (a.institucion_id) {
          conteoInstituciones[a.institucion_id] =
            (conteoInstituciones[a.institucion_id] || 0) + 1;
        }
      });

      const ids = Object.keys(conteoInstituciones);
      if (ids.length > 0) {
        const { data: institucionesNombres } = await supabase
          .from("instituciones")
          .select("id, nombre")
          .in("id", ids);

        const mapNombres: Record<string, string> = {};
        institucionesNombres?.forEach((i) => (mapNombres[i.id] = i.nombre));

        const listaFinal = ids.map((id) => ({
          nombre: mapNombres[id] || "Sin nombre",
          total_convenios: conteoInstituciones[id],
        }));

        listaFinal.sort((a, b) => b.total_convenios - a.total_convenios);
        setInstitucionesActivas(listaFinal.slice(0, 10)); // top 10
      }
    } catch (error: any) {
      console.error("Error cargando reportes:", error);
      alert("❌ Error al cargar reportes: " + error.message);
    }

    setLoading(false);
  };

  if (loading) return <p className="text-center mt-4">Cargando reportes...</p>;

  return (
    <div className="container mt-4" style={{ maxWidth: "1100px" }}>
      <div className="card shadow border-0 p-4" style={{ borderRadius: "16px" }}>
        <h3 className="fw-bold text-primary mb-4">📊 Reportes del Sistema</h3>

        {/* 1️⃣ Convenios por tipo */}
        <section className="mb-5">
          <h5 className="fw-semibold text-secondary mb-3">Convenios por tipo</h5>
          {conveniosPorTipo.length === 0 ? (
            <p className="text-muted">No hay datos disponibles.</p>
          ) : (
            <div className="row">
              <div className="col-md-6">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Tipo de convenio</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conveniosPorTipo.map((c) => (
                      <tr key={c.tipo_convenio}>
                        <td>{c.tipo_convenio}</td>
                        <td>{c.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={conveniosPorTipo}
                      dataKey="total"
                      nameKey="tipo_convenio"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {conveniosPorTipo.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        {/* 2️⃣ Contraprestaciones cumplidas */}
        <section className="mb-5">
          <h5 className="fw-semibold text-secondary mb-3">
            Contraprestaciones cumplidas por año
          </h5>
          {contraprestacionesPorAnio.length === 0 ? (
            <p className="text-muted">No hay datos disponibles.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contraprestacionesPorAnio}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="año" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cumplidas" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* 3️⃣ Instituciones con más convenios */}
        <section>
          <h5 className="fw-semibold text-secondary mb-3">
            Instituciones con más convenios
          </h5>
          {institucionesActivas.length === 0 ? (
            <p className="text-muted">No hay datos disponibles.</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={institucionesActivas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nombre" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_convenios" fill="#1d4ed8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </div>
  );
}

