import { useState } from "react";
import { supabase } from "./supabaseClient";

interface InformeSemestralModalProps {
  convenioId: string;
  onClose: () => void;
}

export default function InformeSemestralModal({ convenioId, onClose }: InformeSemestralModalProps) {
  const [periodo, setPeriodo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!periodo || !descripcion) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        alert("Error: usuario no autenticado.");
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
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("❌ Error al guardar informe:", error);
        alert("❌ Error al guardar informe: " + error.message);
      } else {
        alert("✅ Informe semestral guardado correctamente");
        onClose();
      }
    } catch (err) {
      console.error("❌ Error inesperado:", err);
      alert("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">📝 Informe Semestral</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Periodo</label>
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
                <label className="form-label fw-semibold">Resumen de actividades realizadas *</label>
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
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Informe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
