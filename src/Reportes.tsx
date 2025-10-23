import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/**
 * Componente de Reportes del sistema
 * Muestra tres reportes con datos resumidos:
 * 1️⃣ Convenios por tipo
 * 2️⃣ Contraprestaciones cumplidas por año
 * 3️⃣ Instituciones con más convenios
 */

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

export default function Reportes() {
  const [conveniosPorTipo, setConveniosPorTipo] = useState<ConvenioPorTipo[]>([]);
  const [contraprestacionesPorAnio, setContraprestacionesPorAnio] = useState<
    ContraprestacionesPorAnio[]
  >([]);
  const [institucionesActivas, setInstitucionesActivas] = useState<
    InstitucionesActivas[]
  >([]);
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
        if (c.estado === "cumplido" || c.estado === "completado") {
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

  if (loading) return <p>Cargando reportes...</p>;

  return (
    <div className="container mt-4" style={{ maxWidth: "1000px" }}>
      <div className="card shadow border-0 p-4" style={{ borderRadius: "16px" }}>
        <h3 className="fw-bold text-primary mb-4">📊 Reportes del Sistema</h3>

        {/* 🔹 Reporte 1: Convenios por tipo */}
        <section className="mb-5">
          <h5 className="fw-semibold text-secondary">1️⃣ Convenios por tipo</h5>
          {conveniosPorTipo.length === 0 ? (
            <p className="text-muted">No hay datos disponibles.</p>
          ) : (
            <table className="table table-hover mt-2">
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
          )}
        </section>

        {/* 🔹 Reporte 2: Contraprestaciones cumplidas */}
        <section className="mb-5">
          <h5 className="fw-semibold text-secondary">
            2️⃣ Contraprestaciones cumplidas por año
          </h5>
          {contraprestacionesPorAnio.length === 0 ? (
            <p className="text-muted">No hay datos disponibles.</p>
          ) : (
            <table className="table table-hover mt-2">
              <thead className="table-light">
                <tr>
                  <th>Año</th>
                  <th>Cumplidas</th>
                </tr>
              </thead>
              <tbody>
                {contraprestacionesPorAnio.map((a) => (
                  <tr key={a.año}>
                    <td>{a.año}° año</td>
                    <td>{a.cumplidas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 🔹 Reporte 3: Instituciones activas */}
        <section>
          <h5 className="fw-semibold text-secondary">
            3️⃣ Instituciones con más convenios
          </h5>
          {institucionesActivas.length === 0 ? (
            <p className="text-muted">No hay datos disponibles.</p>
          ) : (
            <table className="table table-hover mt-2">
              <thead className="table-light">
                <tr>
                  <th>Institución</th>
                  <th>Total de convenios</th>
                </tr>
              </thead>
              <tbody>
                {institucionesActivas.map((i) => (
                  <tr key={i.nombre}>
                    <td>{i.nombre}</td>
                    <td>{i.total_convenios}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
