import { useState } from "react";
import { X } from "lucide-react";

// Tipos para TypeScript
interface FiltroAvanzadoProps {
  onApply: (filtros: Filtros) => void;
  onClose: () => void;
}

interface Filtros {
  areaResponsable: string[];
  tipoConvenio: string[];
  estado: string[];
  añoInicio: string;
  añoFin: string;
  operador: "AND" | "OR";
}

export default function FiltroAvanzado({ onApply, onClose }: FiltroAvanzadoProps) {
  const [filters, setFilters] = useState<Filtros>({
    areaResponsable: [],
    tipoConvenio: [],
    estado: [],
    añoInicio: "",
    añoFin: "",
    operador: "AND",
  });

  const toggleValue = (field: keyof Filtros, value: string) => {
    if (!Array.isArray(filters[field])) return;

    setFilters((prev) => {
      const arr = prev[field] as string[];
      const exists = arr.includes(value);
      return {
        ...prev,
        [field]: exists ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const applyFilters = () => {
    onApply(filters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center p-4 z-50">
      <div className="w-full max-w-2xl p-6 bg-white rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Filtro Avanzado</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid gap-6">
          {/* ÁREA RESPONSABLE */}
          <div>
            <h3 className="font-semibold mb-2">Área Responsable</h3>
            <div className="flex flex-wrap gap-3">
              {["Escuela de Medicina", "CITBM", "Facultad"].map((area) => (
                <button
                  key={area}
                  onClick={() => toggleValue("areaResponsable", area)}
                  className={`px-3 py-1 rounded-xl border ${filters.areaResponsable.includes(area) ? "bg-gray-200" : ""}`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* TIPO DE CONVENIO */}
          <div>
            <h3 className="font-semibold mb-2">Tipo de Convenio</h3>
            <div className="flex flex-wrap gap-3">
              {["Investigación", "Específico", "Marco"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => toggleValue("tipoConvenio", tipo)}
                  className={`px-3 py-1 rounded-xl border ${filters.tipoConvenio.includes(tipo) ? "bg-gray-200" : ""}`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* ESTADO */}
          <div>
            <h3 className="font-semibold mb-2">Estado</h3>
            <div className="flex flex-wrap gap-3">
              {["Vigente", "Por vencer", "Concluido"].map((estado) => (
                <button
                  key={estado}
                  onClick={() => toggleValue("estado", estado)}
                  className={`px-3 py-1 rounded-xl border ${filters.estado.includes(estado) ? "bg-gray-200" : ""}`}
                >
                  {estado}
                </button>
              ))}
            </div>
          </div>

          {/* AÑOS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Año Inicio</label>
              <input
                type="number"
                className="border rounded-xl p-2 w-full"
                value={filters.añoInicio}
                onChange={(e) => setFilters({ ...filters, añoInicio: e.target.value })}
              />
            </div>
            <div>
              <label className="font-semibold">Año Fin</label>
              <input
                type="number"
                className="border rounded-xl p-2 w-full"
                value={filters.añoFin}
                onChange={(e) => setFilters({ ...filters, añoFin: e.target.value })}
              />
            </div>
          </div>

          {/* OPERADOR */}
          <div>
            <h3 className="font-semibold mb-2">Operador</h3>
            <div className="flex gap-6">
              {[
                { value: "AND", label: "Y (AND)" },
                { value: "OR", label: "O (OR)" },
              ].map((op) => (
                <label key={op.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="operador"
                    value={op.value}
                    checked={filters.operador === op.value}
                    onChange={() => setFilters({ ...filters, operador: op.value as "AND" | "OR" })}
                  />
                  {op.label}
                </label>
              ))}
            </div>
          </div>

          {/* BOTÓN APLICAR */}
          <div className="flex justify-end">
            <button
              className="rounded-2xl px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
              onClick={applyFilters}
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
