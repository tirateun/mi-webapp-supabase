import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState<number>(1); // 🔹 duración del convenio en años
  const [periodosDisponibles, setPeriodosDisponibles] = useState<string[]>([]);

  // 🔹 Cargar duración del convenio
  useEffect(() => {
    const fetchConvenio = async () => {
      if (!convenioId) return;

      const { data, error } = await supabase
        .from("agreements")
        .select("duration_years")
        .eq("id", convenioId)
        .single();

      if (error) {
        console.error("Error al obtener la duración del convenio:", error);
      } else {
        const años = data?.duration_years || 1;
        setDuracion(años);

        // Generar lista de periodos dinámicamente según los años
        const periodos: string[] = [];
        for (let i = 1; i <= años; i++) {
          periodos.push(`Enero-Junio ${i}° año`);
          periodos.push(`Julio-Diciembre ${i}° año`);
        }
        setPeriodosDisponibles(periodos);
      }
    };

    fetchConvenio();
  }, [convenioId]);

  // 🔹 Guardar el informe
  const handleGuardar = async () => {
    if (!convenioId) {
      alert("❌ No se encontró el ID del convenio.");
      return;
    }

    const { error } = await supabase.from("informes_semestrales").insert([
      {
        convenio_id: convenioId,
        periodo,
        resumen,
        actividades,
        logros,
        dificultades,
        descripcion,
        created_at: new Date(),
      },
    ]);

    if (error) {
      alert("❌ Error al guardar el informe: " + error.message);
    } else {
      alert("✅ Informe guardado correctamente");
      navigate("/"); // 🔙 Regresa a la página principal
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow p-4 border-0" style={{ borderRadius: "12px" }}>
        <h3 className="text-primary fw-bold mb-4">📝 Informe Semestral</h3>

        {/* 🔹 Selector de periodo */}
        <div className="mb-3">
          <label>Periodo del informe</label>
          <select
            className="form-select"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="">Seleccione un periodo</option>
            {periodosDisponibles.map((p, i) => (
              <option key={i} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label>Resumen de actividades realizadas</label>
          <textarea
            className="form-control"
            rows={3}
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Actividades principales</label>
          <textarea
            className="form-control"
            rows={3}
            value={actividades}
            onChange={(e) => setActividades(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Logros obtenidos</label>
          <textarea
            className="form-control"
            rows={3}
            value={logros}
            onChange={(e) => setLogros(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Dificultades encontradas</label>
          <textarea
            className="form-control"
            rows={3}
            value={dificultades}
            onChange={(e) => setDificultades(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label>Descripción general</label>
          <textarea
            className="form-control"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button className="btn btn-secondary me-3" onClick={() => navigate("/")}>
            🔙 Volver
          </button>
          <button className="btn btn-primary" onClick={handleGuardar}>
            💾 Guardar Informe
          </button>
        </div>
      </div>
    </div>
  );
}




