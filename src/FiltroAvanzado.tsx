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

  // =====================
  // CARGAR ÁREAS VINCULADAS
  // =====================
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

  // =====================
  // CARGAR TIPOS DE CONVENIO (SI EXISTE TABLA)
  // =====================
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

  // =====================
  // TOGGLES
  // =====================
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

  // =====================
  // APLICAR FILTROS
  // =====================
  const applyFilters = () => {
    onApply({
      areas: selectedAreas,
      tipos: selectedTipos,
      estados: selectedEstados,
      anioInicio,
      anioFin,
      operator,
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow-md w-80">
      <h2 className="text-xl font-bold mb-4">Filtro Avanzado</h2>

      {/* Áreas */}
      <h3 className="font-semibold mb-2">Área Responsable</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => toggleArea(area.id)}
            className={`px-3 py-1 rounded-full border ${
              selectedAreas.includes(area.id)
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            {area.nombre}
          </button>
        ))}
      </div>

      {/* Tipos de convenio */}
      <h3 className="font-semibold mb-2">Tipo de Convenio</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {tiposConvenio.map((tipo) => (
          <button
            key={tipo}
            onClick={() => toggleTipo(tipo)}
            className={`px-3 py-1 rounded-full border ${
              selectedTipos.includes(tipo)
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Estado */}
      <h3 className="font-semibold mb-2">Estado</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {["Vigente", "Por vencer", "Concluido"].map((estado) => (
          <button
            key={estado}
            onClick={() => toggleEstado(estado)}
            className={`px-3 py-1 rounded-full border ${
              selectedEstados.includes(estado)
                ? "bg-blue-600 text-white"
                : "bg-gray-100"
            }`}
          >
            {estado}
          </button>
        ))}
      </div>

      {/* Años */}
      <div className="mb-4">
        <label className="block">Año Inicio</label>
        <input
          type="number"
          value={anioInicio}
          onChange={(e) => setAnioInicio(e.target.value)}
          className="border p-1 w-full rounded"
        />

        <label className="block mt-2">Año Fin</label>
        <input
          type="number"
          value={anioFin}
          onChange={(e) => setAnioFin(e.target.value)}
          className="border p-1 w-full rounded"
        />
      </div>

      {/* Operador */}
      <h3 className="font-semibold mb-2">Operador</h3>
      <div className="flex gap-4 mb-4">
        <label>
          <input
            type="radio"
            checked={operator === "AND"}
            onChange={() => setOperator("AND")}
          />{" "}
          Y (AND)
        </label>

        <label>
          <input
            type="radio"
            checked={operator === "OR"}
            onChange={() => setOperator("OR")}
          />{" "}
          O (OR)
        </label>
      </div>

      {/* Botones */}
      <button
        onClick={applyFilters}
        className="w-full bg-blue-600 text-white py-2 rounded mb-2"
      >
        Aplicar filtros
      </button>

      <button onClick={onClose} className="w-full bg-gray-300 py-2 rounded">
        Cerrar
      </button>
    </div>
  );
}

