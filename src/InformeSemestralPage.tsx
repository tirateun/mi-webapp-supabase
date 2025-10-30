import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

/**
 * Esta versión conserva tu lógica exacta (incluye `descripcion`)
 * y mejora la compatibilidad con el flujo de navegación SPA.
 */
export default function InformeSemestralPage(props?: {
  convenioId?: string;
  onBack?: () => void;
}) {
  const params = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  // 🔹 Usa el convenioId de props o de la URL
  const convenioId = props?.convenioId || params.convenioId || "";
  const onBack = props?.onBack;

  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    if (!convenioId) {
      alert("❌ No se encontró el ID del convenio.");
      return;
    }

    setGuardando(true);

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

    setGuardando(false);

    if (error) {
      console.error(error);
      alert("❌ Error al guardar el informe: " + error.message);
    } else {
      alert("✅ Informe guardado correctamente");

      // 🔙 Si hay callback de regreso lo usamos, si no, volvemos a la lista
      if (typeof onBack === "function") {
        onBack();
      } else {
        navigate("/"); // página principal
      }
    }
  };

  const handleVolver = () => {
    if (typeof onBack === "function") onBack();
    else navigate(-1);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow p-4 border-0" style={{ borderRadius: "12px" }}>
        <h3 className="text-primary fw-bold mb-4">📝 Informe Semestral</h3>

        <div className="mb-3">
          <label>Periodo del informe</label>
          <select
            className="form-select"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="">Seleccione un periodo</option>
            <option value="Enero-Junio">Enero - Junio</option>
            <option value="Julio-Diciembre">Julio - Diciembre</option>
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
          <button
            className="btn btn-secondary me-3"
            onClick={handleVolver}
            disabled={guardando}
          >
            🔙 Volver
          </button>
          <button
            className="btn btn-primary"
            onClick={handleGuardar}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "💾 Guardar Informe"}
          </button>
        </div>
      </div>
    </div>
  );
}



