// InformeSemestralModal.tsx
// Versión actualizada para integrarse con `agreement_years` (años reales por convenio)
// - Muestra selector de años con fechas exactas (year_start - year_end)
// - Guarda informes vinculados a `year_id` en `informes_semestrales`
// - Valida que un mismo usuario no cree más de un informe por año
// - Usa Bootstrap y tu estructura actual (sin shadcn/ui)

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Props {
  convenioId: string;
  onClose: () => void;
}

interface AgreementYear {
  id: string;
  agreement_id: string;
  year_number: number;
  year_start: string;
  year_end: string;
}

export default function InformeSemestralModal({ convenioId, onClose }: Props) {
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [years, setYears] = useState<AgreementYear[]>([]);

  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!convenioId) return;
    loadYears();
  }, [convenioId]);

  // Carga los años reales desde la tabla agreement_years (orden ascendente)
  const loadYears = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("agreement_years")
        .select("id, agreement_id, year_number, year_start, year_end")
        .eq("agreement_id", convenioId)
        .order("year_number", { ascending: true });

      if (error) throw error;
      setYears(data || []);
      if (data && data.length > 0) setSelectedYearId((prev) => prev || data[0].id);
    } catch (err) {
      console.error("Error cargando years:", err);
      alert("Error al cargar los años del convenio.");
    } finally {
      setLoading(false);
    }
  };

  // Guardar informe vinculado a un year_id
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYearId) return alert("Selecciona un año.");
    if (!descripcion.trim()) return alert("Agrega el resumen de actividades (campo obligatorio).");

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return alert("Usuario no autenticado.");

      // Verificar si ya existe informe del mismo usuario para este year
      const { data: existente, error: checkErr } = await supabase
        .from("informes_semestrales")
        .select("id")
        .eq("agreement_id", convenioId)
        .eq("year_id", selectedYearId)
        .eq("user_id", userId)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (existente) {
        alert("⚠️ Ya registraste un informe para este año. Contacta al administrador si necesitas modificarlo.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("informes_semestrales").insert([
        {
          agreement_id: convenioId,
          year_id: selectedYearId,
          user_id: userId,
          contenido: descripcion,
          actividades,
          logros,
          dificultades,
        },
      ]);

      if (error) throw error;

      alert("✅ Informe guardado correctamente.");
      onClose();
    } catch (err: any) {
      console.error("Error guardando informe:", err);
      alert("Error al guardar el informe: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">📝 Informe Semestral</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Año</label>
                <select
                  className="form-select"
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  required
                >
                  <option value="">Seleccione un año</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      Año {y.year_number} — {new Date(y.year_start).toLocaleDateString("es-PE")} — {new Date(y.year_end).toLocaleDateString("es-PE")}
                    </option>
                  ))}
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
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Informe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



