// src/Contraprestaciones.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function Contraprestaciones({
  agreementId,
  onBack,
}: {
  agreementId: string;
  onBack: () => void;
}) {
  const [years, setYears] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);

  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidades, setUnidades] = useState(1);
  const [catalogo, setCatalogo] = useState<any[]>([]);

  /* =========================
     CARGA INICIAL
     ========================= */
  useEffect(() => {
    if (!agreementId) return;
    loadYears();
    loadCatalogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  /* =========================
     AÑOS DEL CONVENIO (CLAVE)
     ========================= */
  async function loadYears() {
    try {
      setLoadingYears(true);

      const { data, error } = await supabase
        .from("agreement_years")
        .select("id, year_number, year_start, year_end")
        .eq("agreement_id", agreementId)
        .order("year_number", { ascending: false }); // 🔥 MÁS NUEVO PRIMERO

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        setYears(data);
        // ✅ Seleccionar SIEMPRE el año MÁS NUEVO
        setSelectedYear(data[0].id);
      } else {
        setYears([]);
        setSelectedYear("");
        setItems([]);
      }
    } catch (err) {
      console.error("Error loadYears:", err);
      setYears([]);
      setSelectedYear("");
      setItems([]);
    } finally {
      setLoadingYears(false);
    }
  }

  /* =========================
     CATÁLOGO
     ========================= */
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

  /* =========================
     CONTRAPRESTACIONES POR AÑO
     ========================= */
  useEffect(() => {
    if (!selectedYear || selectedYear.trim() === "") {
      setItems([]);
      return;
    }
    loadContraprestaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  async function loadContraprestaciones() {
    if (!selectedYear || selectedYear.trim() === "") {
      setItems([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, unidades_comprometidas")
        .eq("agreement_year_id", selectedYear)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setItems(data ?? []);
    } catch (err) {
      console.error("Error loadContraprestaciones:", err);
      setItems([]);
    }
  }

  /* =========================
     AGREGAR
     ========================= */
  async function addItem() {
    if (!agreementId) return alert("Convenio inválido.");
    if (!selectedYear || selectedYear.trim() === "")
      return alert("Seleccione un año válido.");
    if (!tipo) return alert("Seleccione un tipo.");

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

      setTipo("");
      setDescripcion("");
      setUnidades(1);
      await loadContraprestaciones();
    } catch (err: any) {
      console.error("Error addItem:", err);
      alert("No se pudo agregar: " + err.message);
    }
  }

  /* =========================
     ELIMINAR
     ========================= */
  async function deleteItem(id: string) {
    if (!confirm("¿Eliminar contraprestación?")) return;
    try {
      const { error } = await supabase
        .from("contraprestaciones")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadContraprestaciones();
    } catch (err) {
      console.error("Error deleteItem:", err);
      alert("No se pudo eliminar.");
    }
  }

  function formatDate(d: string) {
    try {
      return new Date(d).toLocaleDateString("es-PE");
    } catch {
      return d;
    }
  }

  /* =========================
     UI
     ========================= */
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button className="mb-4 px-3 py-1 bg-gray-300" onClick={onBack}>
        Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">Contraprestaciones</h1>

      {/* Selector de año */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Año del convenio:</label>
        {loadingYears ? (
          <span>Cargando años...</span>
        ) : years.length === 0 ? (
          <span className="text-red-600">No hay años definidos</span>
        ) : (
          <select
            className="border px-2 py-1"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                Año {y.year_number} — {formatDate(y.year_start)} /{" "}
                {formatDate(y.year_end)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Agregar */}
      <div className="border p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Agregar contraprestación</h2>

        <select
          className="border px-2 py-1 w-full mb-2"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Seleccione tipo</option>
          {catalogo.map((c) => (
            <option key={c.id} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>

        <textarea
          className="border px-2 py-1 w-full mb-2"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <input
          type="number"
          className="border px-2 py-1 w-full mb-2"
          value={unidades}
          onChange={(e) => setUnidades(Number(e.target.value))}
        />

        <button
          onClick={addItem}
          className="px-4 py-1 bg-blue-600 text-white rounded"
        >
          Agregar
        </button>
      </div>

      {/* Tabla */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
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



