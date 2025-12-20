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

  // Cargar tipos de convenio (lista fija, no de BD)
  useEffect(() => {
    // Usar siempre lista local ya que la tabla tipos_convenio no existe
    setTiposConvenio([
      "Docente Asistencial",
      "Cooperación técnica",
      "Movilidad académica",
      "Investigación",
      "Colaboración académica",
      "Consultoría",
      "Cotutela",
    ]);
  }, []);

  // 🆕 APLICAR FILTROS AUTOMÁTICAMENTE cuando cambia cualquier filtro
  useEffect(() => {
    onApply({
      areas: selectedAreas,
      tipos: selectedTipos,
      estados: selectedEstados,
      anioInicio,
      anioFin,
      operator,
    });
  }, [selectedAreas, selectedTipos, selectedEstados, anioInicio, anioFin, operator]);

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

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSelectedAreas([]);
    setSelectedTipos([]);
    setSelectedEstados([]);
    setAnioInicio("");
    setAnioFin("");
    setOperator("AND");
  };

  // Contador de filtros activos
  const activeFiltersCount = 
    selectedAreas.length + 
    selectedTipos.length + 
    selectedEstados.length + 
    (anioInicio ? 1 : 0) + 
    (anioFin ? 1 : 0);

  return (
    <div>
      {/* Indicador de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
          <div>
            <strong>🔍 {activeFiltersCount}</strong> filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
          </div>
          <button 
            type="button"
            onClick={clearAllFilters}
            className="btn btn-sm btn-outline-primary"
          >
            Limpiar todos
          </button>
        </div>
      )}

      {/* Área Responsable */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3">
          🏢 Área Responsable 
          {selectedAreas.length > 0 && (
            <span className="badge bg-primary ms-2">{selectedAreas.length}</span>
          )}
        </h6>
        <div className="d-flex flex-wrap gap-2">
          {areas.length > 0 ? (
            areas.map((area) => (
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
            ))
          ) : (
            <div className="text-muted">Cargando áreas...</div>
          )}
        </div>
      </div>

      {/* Tipo de Convenio */}
      <div className="mb-4">
        <h6 className="fw-bold mb-3">
          📋 Tipo de Convenio
          {selectedTipos.length > 0 && (
            <span className="badge bg-primary ms-2">{selectedTipos.length}</span>
          )}
        </h6>
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
        <h6 className="fw-bold mb-3">
          🚦 Estado
          {selectedEstados.length > 0 && (
            <span className="badge bg-primary ms-2">{selectedEstados.length}</span>
          )}
        </h6>
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
        <h6 className="fw-bold mb-3">
          📅 Rango de Años
          {(anioInicio || anioFin) && (
            <span className="badge bg-primary ms-2">
              {anioInicio && anioFin ? `${anioInicio} - ${anioFin}` : anioInicio || anioFin}
            </span>
          )}
        </h6>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Año Inicio</label>
            <input
              type="number"
              value={anioInicio}
              onChange={(e) => setAnioInicio(e.target.value)}
              className="form-control"
              placeholder="2020"
              min="2000"
              max="2100"
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
              min="2000"
              max="2100"
            />
          </div>
        </div>
      </div>

      {/* Operador */}
      <div className="mb-0">
        <h6 className="fw-bold mb-3">⚙️ Operador Lógico</h6>
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
              <strong>Y (AND)</strong> - Cumplir todos los filtros
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
              <strong>O (OR)</strong> - Cumplir al menos uno
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}