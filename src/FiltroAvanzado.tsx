import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AreaVinculada {
  id: string;
  nombre: string;
}

interface FiltroAvanzadoProps {
  onApply: (filtros: {
    areas: string[];
    tipos: string[];
    estados: string[];
    anioInicio: string;
    anioFin: string;
    operator: "AND" | "OR";
  }) => void;
  onClose: () => void;
}

export default function FiltroAvanzado({
  onApply,
  onClose,
}: FiltroAvanzadoProps) {
  const [areas, setAreas] = useState<AreaVinculada[]>([]);
  const [tiposConvenio, setTiposConvenio] = useState<string[]>([]);

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);

  const [anioInicio, setAnioInicio] = useState<string>("");
  const [anioFin, setAnioFin] = useState<string>("");
  const [operator, setOperator] = useState<"AND" | "OR">("AND");

  // Cargar áreas vinculadas
  useEffect(() => {
    async function loadAreas() {
      const { data, error } = await supabase
        .from("areas_vinculadas")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (!error && data) {
        setAreas(data as AreaVinculada[]);
      }
    }
    loadAreas();
  }, []);

  // Cargar tipos de convenio
  useEffect(() => {
    async function loadTipos() {
      const { data, error } = await supabase
        .from("tipos_convenio")
        .select("nombre")
        .order("nombre", { ascending: true });

      if (!error && data && data.length > 0) {
        setTiposConvenio(data.map((t) => t.nombre));
      } else {
        // Si no existe tabla, usamos lista local
        setTiposConvenio([
          "Docente Asistencial",
          "Cooperación técnica",
          "Movilidad académica",
          "Investigación",
          "Colaboración académica",
          "Consultoría",
          "Cotutela",
        ]);
      }
    }
    loadTipos();
  }, []);

  // Toggles
  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const toggleEstado = (estado: string) => {
    setSelectedEstados((prev) =>
      prev.includes(estado) ? prev.filter((e) => e !== estado) : [...prev, estado]
    );
  };

  // Aplicar filtros
  const applyFilters = () => {
    onApply({
      areas: selectedAreas,
      tipos: selectedTipos,
      estados: selectedEstados,
      anioInicio,
      anioFin,
      operator,
    });
    onClose(); // Cerrar modal después de aplicar
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSelectedAreas([]);
    setSelectedTipos([]);
    setSelectedEstados([]);
    setAnioInicio("");
    setAnioFin("");
    setOperator("AND");
  };

  return (
    <div>
      {/* Área Responsable */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3">Área Responsable</h6>
        <div className="d-flex flex-wrap gap-2">
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => toggleArea(area.id)}
              className={`btn btn-sm ${
                selectedAreas.includes(area.id)
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
            >
              {area.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de Convenio */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3">Tipo de Convenio</h6>
        <div className="d-flex flex-wrap gap-2">
          {tiposConvenio.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => toggleTipo(tipo)}
              className={`btn btn-sm ${
                selectedTipos.includes(tipo)
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Estado */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3">Estado</h6>
        <div className="d-flex flex-wrap gap-2">
          {["Vigente", "Por vencer", "Vencido"].map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => toggleEstado(estado)}
              className={`btn btn-sm ${
                selectedEstados.includes(estado)
                  ? "btn-primary"
                  : "btn-outline-secondary"
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* Años */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3">Rango de Años</h6>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Año Inicio</label>
            <input
              type="number"
              value={anioInicio}
              onChange={(e) => setAnioInicio(e.target.value)}
              className="form-control"
              placeholder="2020"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Año Fin</label>
            <input
              type="number"
              value={anioFin}
              onChange={(e) => setAnioFin(e.target.value)}
              className="form-control"
              placeholder="2025"
            />
          </div>
        </div>
      </div>

      {/* Operador */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3">Operador</h6>
        <div className="d-flex gap-4">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              id="operatorAND"
              checked={operator === "AND"}
              onChange={() => setOperator("AND")}
            />
            <label className="form-check-label" htmlFor="operatorAND">
              Y (AND)
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              id="operatorOR"
              checked={operator === "OR"}
              onChange={() => setOperator("OR")}
            />
            <label className="form-check-label" htmlFor="operatorOR">
              O (OR)
            </label>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="d-flex gap-2 justify-content-end pt-3 border-top">
        <button
          type="button"
          onClick={clearFilters}
          className="btn btn-outline-secondary"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-secondary"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="btn btn-primary"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}