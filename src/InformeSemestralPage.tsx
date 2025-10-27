import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function InformeSemestralPage() {
  const { convenioId } = useParams();
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodo || !descripcion) {
      alert("Completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        alert("No se encontró el usuario autenticado.");
        return;
      }

      const { error } = await supabase.from("informes_semestrales").insert([
        {
          convenio_id: convenioId,
          user_id: userId,
          periodo,
          descripcion,
          actividades,
          logros,
          dificultades,
        },
      ]);

      if (error) throw error;
      alert("✅ Informe guardado correctamente");
      navigate(-1); // 🔙 Vuelve a la lista de convenios
    } catch (err: any) {
      alert("❌ Error al guardar informe: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: "800px" }}>
      <h2 className="text-primary fw-bold mb-4 text-center">
        📝 Nuevo Informe Semestral
      </h2>
      <form onSubmit={handleSubmit} className="card shadow p-4 border-0">
        <div className="mb-3">
          <label className="form-label fw-semibold">Periodo *</label>
          <select
            className="form-select"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            required
          >
            <option value="">Seleccione un periodo</option>
            <option value="Primer semestre">Primer semestre (Ene-Jun)</option>
            <option value="Segundo semestre">Segundo semestre (Jul-Dic)</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Resumen de actividades realizadas *
          </label>
          <textarea
            className="form-control"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe brevemente las actividades ejecutadas..."
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Actividades principales</label>
          <textarea
            className="form-control"
            rows={3}
            value={actividades}
            onChange={(e) => setActividades(e.target.value)}
            placeholder="Detalla las principales actividades desarrolladas durante el periodo."
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Logros obtenidos</label>
          <textarea
            className="form-control"
            rows={3}
            value={logros}
            onChange={(e) => setLogros(e.target.value)}
            placeholder="Indica los principales resultados o avances logrados."
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Dificultades encontradas</label>
          <textarea
            className="form-control"
            rows={3}
            value={dificultades}
            onChange={(e) => setDificultades(e.target.value)}
            placeholder="Menciona los principales retos o limitaciones."
          />
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button
            type="button"
            className="btn btn-secondary me-3"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Informe"}
          </button>
        </div>
      </form>
    </div>
  );
}
