// src/FiltroAvanzadoSimple.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface FiltroAvanzadoProps {
  onApply: (filtros: any) => void;
  onClose: () => void;
}

export default function FiltroAvanzadoSimple({
  onApply,
  onClose,
}: FiltroAvanzadoProps) {
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  useEffect(() => {
    async function loadAreas() {
      const { data } = await supabase
        .from("areas_vinculadas")
        .select("id, nombre")
        .order("nombre", { ascending: true });
      
      if (data) setAreas(data);
    }
    loadAreas();
  }, []);

  useEffect(() => {
    onApply({
      areas: selectedAreas,
      tipos: [],
      estados: [],
      anioInicio: "",
      anioFin: "",
      operator: "AND",
    });
  }, [selectedAreas, onApply]);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-3">
      <h5 className="mb-3">Filtro por Área</h5>
      
      <div className="d-flex flex-wrap gap-2 mb-3">
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

      {selectedAreas.length > 0 && (
        <div className="alert alert-info">
          {selectedAreas.length} área(s) seleccionada(s)
        </div>
      )}
    </div>
  );
}