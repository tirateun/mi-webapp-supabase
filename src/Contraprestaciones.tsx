// Contraprestaciones.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Contraprestaciones({ agreementId, onBack }: { agreementId: string; onBack: () => void }) {
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);

  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidades, setUnidades] = useState(1);

  useEffect(() => {
    loadYears();
  }, []);

  async function loadYears() {
    const { data, error } = await supabase
      .from("agreement_years")
      .select("id, year_number, year_start, year_end")
      .eq("agreement_id", agreementId)
      .order("year_number", { ascending: true });

    if (!error && data) {
      setYears(data);
      if (data.length > 0) setSelectedYear(data[0].id);
    }
  }

  useEffect(() => {
    if (selectedYear) loadContraprestaciones();
  }, [selectedYear]);

  async function loadContraprestaciones() {
    const { data, error } = await supabase
      .from("contraprestaciones")
      .select("*")
      .eq("agreement_year_id", selectedYear)
      .order("created_at", { ascending: true });

    if (!error && data) setItems(data);
  }

  async function addItem() {
    if (!tipo) return;

    const { error } = await supabase.from("contraprestaciones").insert({
      agreement_id: agreementId,
      agreement_year_id: selectedYear,
      tipo,
      descripcion,
      unidades_comprometidas: unidades
    });

    if (!error) {
      setTipo("");
      setDescripcion("");
      setUnidades(1);
      loadContraprestaciones();
    }
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from("contraprestaciones").delete().eq("id", id);
    if (!error) loadContraprestaciones();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button className="mb-4 px-3 py-1 bg-gray-300" onClick={onBack}>Volver</button>
      <h1 className="text-2xl font-bold mb-4">Contraprestaciones</h1>

      <div className="mb-4">
        <label className="font-semibold mr-2">Seleccionar año:</label>
        <select
          className="border px-2 py-1"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              Año {y.year_number} — {y.year_start} / {y.year_end}
            </option>
          ))}
        </select>
      </div>

      <div className="border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Agregar contraprestación</h2>

        <div className="mb-2">
          <label className="block">Tipo:</label>
          <input
            className="border px-2 py-1 w-full"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          />
        </div>

        <div className="mb-2">
          <label className="block">Descripción:</label>
          <textarea
            className="border px-2 py-1 w-full"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </div>

        <div className="mb-2">
          <label className="block">Unidades comprometidas:</label>
          <input
            type="number"
            className="border px-2 py-1 w-full"
            value={unidades}
            onChange={(e) => setUnidades(Number(e.target.value))}
          />
        </div>

        <button
          onClick={addItem}
          className="px-4 py-1 bg-blue-600 text-white rounded mt-2"
        >
          Agregar
        </button>
      </div>

      <h2 className="font-semibold text-lg mb-2">Listado del año seleccionado</h2>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Descripción</th>
            <th className="border p-2">Unidades</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td className="border p-2">{i.tipo}</td>
              <td className="border p-2">{i.descripcion}</td>
              <td className="border p-2">{i.unidades_comprometidas}</td>
              <td className="border p-2">
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={() => deleteItem(i.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
