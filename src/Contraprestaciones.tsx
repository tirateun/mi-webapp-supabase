// Contraprestaciones.tsx (versión corregida y funcionando)
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Contraprestaciones({ agreementId, onBack }: { agreementId: string; onBack: () => void }) {
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);

  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogId, setCatalogId] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [unidades, setUnidades] = useState(1);

  useEffect(() => {
    loadYears();
    loadCatalog();
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

  async function loadCatalog() {
    const { data, error } = await supabase
      .from("contraprestaciones_catalogo")
      .select("id, nombre");

    if (!error && data) setCatalog(data);
  }

  useEffect(() => {
    if (selectedYear) loadContraprestaciones();
  }, [selectedYear]);

  async function loadContraprestaciones() {
    const { data, error } = await supabase
      .from("contraprestaciones")
      .select("id, tipo, descripcion, unidades_comprometidas, catalogo_id")
      .eq("agreement_year_id", selectedYear)
      .order("created_at", { ascending: true });

    if (!error && data) setItems(data);
  }

  async function addItem() {
    if (!catalogId) return;

    const { error } = await supabase.from("contraprestaciones").insert({
      agreement_id: agreementId,
      agreement_year_id: selectedYear,
      catalogo_id: catalogId,
      tipo: catalog.find((c) => c.id == catalogId)?.nombre || "",
      descripcion,
      unidades_comprometidas: unidades,
    });

    if (!error) {
      setCatalogId("");
      setDescripcion("");
      setUnidades(1);
      loadContraprestaciones();
    }
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from("contraprestaciones").delete().eq("id", id);
    if (!error) loadContraprestaciones();
  }

  function formatDate(d: string) {
    return new Date(d).toISOString().split("T")[0];
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
              Año {y.year_number} — {formatDate(y.year_start)} / {formatDate(y.year_end)}
            </option>
          ))}
        </select>
      </div>

      <div className="border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Agregar contraprestación</h2>

        <div className="mb-2">
          <label className="block">Tipo (Catálogo):</label>
          <select
            className="border px-2 py-1 w-full"
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
          >
            <option value="">Seleccione tipo</option>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
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

