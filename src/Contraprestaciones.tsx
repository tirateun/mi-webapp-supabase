// src/Contraprestaciones.tsx (fix: carga años cuando cambia agreementId)
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Contraprestaciones({ agreementId, onBack }: { agreementId: string; onBack: () => void }) {
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);

  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidades, setUnidades] = useState(1);

  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);

  // --- IMPORTANTE: dependemos de agreementId; cargar cuando cambie ---
  useEffect(() => {
    if (!agreementId) {
      console.log("Contraprestaciones: waiting for agreementId...");
      return;
    }
    loadYears();
    loadCatalogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  async function loadYears() {
    try {
      if (!agreementId) return;
      setLoadingYears(true);
      const { data, error } = await supabase
        .from("agreement_years")
        .select("id, year_number, year_start, year_end")
        .eq("agreement_id", agreementId)
        .order("year_number", { ascending: true });

      console.log("loadYears result:", { agreementId, data, error });

      if (!error && Array.isArray(data)) {
        setYears(data);
        // si no hay selectedYear o el selectedYear dejó de existir, establecer el primero
        if (!selectedYear && data.length > 0) {
          setSelectedYear(String(data[0].id));
        } else if (selectedYear) {
          // si hay selectedYear, verificar que siga presente; si no, reasignar
          const exists = data.find((y) => String(y.id) === String(selectedYear));
          if (!exists && data.length > 0) setSelectedYear(String(data[0].id));
        }
      } else {
        setYears([]);
        setSelectedYear("");
      }
    } catch (err) {
      console.error("Error loadYears:", err);
      setYears([]);
      setSelectedYear("");
    } finally {
      setLoadingYears(false);
    }
  }

  async function loadCatalogo() {
    try {
      const { data, error } = await supabase
        .from("contraprestaciones_catalogo")
        .select("id, nombre")
        .order("nombre", { ascending: true });

      if (!error && data) setCatalogo(data);
    } catch (err) {
      console.error("Error loadCatalogo:", err);
      setCatalogo([]);
    }
  }

  // cuando cambia el año seleccionado, recargar contraprestaciones
  useEffect(() => {
    if (selectedYear) loadContraprestaciones();
    else setItems([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  async function loadContraprestaciones() {
    if (!selectedYear) return;
    try {
      const { data, error } = await supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, unidades_comprometidas, catalogo_id")
        .eq("agreement_year_id", selectedYear)
        .order("created_at", { ascending: true });

      if (!error && data) setItems(data);
      else setItems([]);
    } catch (err) {
      console.error("Error loadContraprestaciones:", err);
      setItems([]);
    }
  }

  async function addItem() {
    if (!agreementId) return alert("Error: convenio desconocido.");
    if (!selectedYear) return alert("Selecciona primero un año para registrar la contraprestación.");
    if (!tipo) return alert("Selecciona un tipo.");

    try {
      const payload = {
        agreement_id: agreementId,
        agreement_year_id: selectedYear,
        catalogo_id: catalogo.find((c) => c.nombre === tipo)?.id ?? null,
        tipo,
        descripcion,
        unidades_comprometidas: unidades,
      };

      const { error } = await supabase.from("contraprestaciones").insert(payload);
      if (error) throw error;

      // limpiar y recargar
      setTipo("");
      setDescripcion("");
      setUnidades(1);
      await loadContraprestaciones();
    } catch (err: any) {
      console.error("Error addItem:", err);
      alert("No se pudo agregar contraprestación: " + (err?.message || String(err)));
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar contraprestación?")) return;
    try {
      const { error } = await supabase.from("contraprestaciones").delete().eq("id", id);
      if (error) throw error;
      await loadContraprestaciones();
    } catch (err) {
      console.error("Error deleteItem:", err);
      alert("No se pudo eliminar.");
    }
  }

  function formatDate(d: string) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("es-PE");
    } catch {
      return d;
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button className="mb-4 px-3 py-1 bg-gray-300" onClick={onBack}>Volver</button>
      <h1 className="text-2xl font-bold mb-4">Contraprestaciones</h1>

      {/* Selector de año */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Seleccionar año:</label>
        {loadingYears ? (
          <span className="ms-2 text-muted">Cargando años...</span>
        ) : years.length === 0 ? (
          <span className="ms-2 text-danger">No hay años definidos para este convenio.</span>
        ) : (
          <select
            className="border px-2 py-1"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="">Seleccione un año</option>
            {years.map((y) => (
              <option key={y.id} value={String(y.id)}>
                Año {y.year_number} — {formatDate(y.year_start)} / {formatDate(y.year_end)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Agregar contraprestación</h2>

        <div className="mb-2">
          <label className="block">Tipo (Catálogo):</label>
          <select
            className="border px-2 py-1 w-full"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Seleccione tipo</option>
            {catalogo.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
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


