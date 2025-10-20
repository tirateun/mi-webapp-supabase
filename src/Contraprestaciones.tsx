import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Contraprestacion {
  id: string;
  tipo: string;
  descripcion: string;
  unidades_comprometidas: number;
  periodo_inicio: string;
  periodo_fin: string;
  agreement_id: string;
}

interface ContraprestacionCatalogo {
  id: string;
  nombre: string;
  unidad: string;
}

interface Props {
  agreementId: string;
  onBack: () => void;
}

export default function Contraprestaciones({ agreementId, onBack }: Props) {
  const [contraprestaciones, setContraprestaciones] = useState<Contraprestacion[]>([]);
  const [tipos, setTipos] = useState<ContraprestacionCatalogo[]>([]);
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidades, setUnidades] = useState(1);
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar catálogo y datos iniciales
  useEffect(() => {
    fetchCatalogo();
    fetchContraprestaciones();
    fetchDuracionConvenio();
  }, []);

  // 🔹 Cargar catálogo desde tabla
  const fetchCatalogo = async () => {
    const { data, error } = await supabase
      .from("contraprestaciones_catalogo")
      .select("id, nombre, unidad")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error al cargar catálogo:", error);
      alert("Error al cargar el catálogo de contraprestaciones.");
    } else {
      setTipos(data || []);
    }
  };

  // 🔹 Obtener duración (en años) desde agreements
  const fetchDuracionConvenio = async () => {
    const { data, error } = await supabase
      .from("agreements")
      .select("duration_years")
      .eq("id", agreementId)
      .single();

    if (error) {
      console.error("Error al obtener duración del convenio:", error);
    } else {
      const years = data?.duration_years || 1;
      setAniosDisponibles(Array.from({ length: years }, (_, i) => i + 1));
    }
  };

  // 🔹 Cargar contraprestaciones registradas
  const fetchContraprestaciones = async () => {
    const { data, error } = await supabase
      .from("contraprestaciones")
      .select("*")
      .eq("agreement_id", agreementId)
      .order("created_at", { ascending: true });

    if (error) console.error("Error al cargar contraprestaciones:", error);
    else setContraprestaciones(data || []);
  };

  // 🔹 Registrar nueva contraprestación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tipo || !anioSeleccionado) {
      alert("Por favor, seleccione el tipo y el año del convenio.");
      setLoading(false);
      return;
    }

    const selectedTipo = tipos.find((t) => t.nombre === tipo);
    const tipoDescripcion = selectedTipo
      ? `${selectedTipo.nombre} (${selectedTipo.unidad})`
      : tipo;

    // 🔹 Insertar la contraprestación principal
    const { data: inserted, error } = await supabase
      .from("contraprestaciones")
      .insert([
        {
          agreement_id: agreementId,
          tipo: tipoDescripcion,
          descripcion,
          unidades_comprometidas: unidades,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error al guardar:", error);
      alert("❌ Error al guardar la contraprestación: " + error.message);
      setLoading(false);
      return;
    }

    // 🔹 Crear registros de seguimiento automático para todos los años del convenio
    if (inserted && aniosDisponibles.length > 0) {
      const seguimientoData = aniosDisponibles.map((a, i) => ({
        contraprestacion_id: inserted.id,
        año: i + 1,
        estado: "pendiente",
        ejecutado: false,
      }));

      const { error: seguimientoError } = await supabase
        .from("contraprestaciones_seguimiento")
        .insert(seguimientoData);

      if (seguimientoError) {
        console.error("Error creando seguimiento:", seguimientoError);
        alert("⚠️ Se registró la contraprestación pero no el seguimiento.");
      }
    }

    alert("✅ Contraprestación registrada correctamente.");
    setTipo("");
    setDescripcion("");
    setUnidades(1);
    setAnioSeleccionado(null);
    setLoading(false);
    fetchContraprestaciones();
  };

  // 🔹 Eliminar contraprestación
  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta contraprestación?")) return;

    const { error } = await supabase.from("contraprestaciones").delete().eq("id", id);
    if (error) {
      alert("❌ Error al eliminar: " + error.message);
    } else {
      setContraprestaciones(contraprestaciones.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "900px" }}>
      <div className="card shadow p-4 border-0" style={{ borderRadius: "16px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold text-primary mb-0">🏛️ Contraprestaciones del Convenio</h4>
          <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
            ← Volver
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="fw-semibold">Tipo de contraprestación</label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
              >
                <option value="">Seleccione...</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.nombre}>
                    {t.nombre} ({t.unidad})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 mb-3">
              <label className="fw-semibold">Año</label>
              <select
                className="form-select"
                value={anioSeleccionado || ""}
                onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                required
              >
                <option value="">Seleccione año...</option>
                {aniosDisponibles.map((a) => (
                  <option key={a} value={a}>
                    {a}° año
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 mb-3">
              <label className="fw-semibold">Unidades comprometidas</label>
              <input
                type="number"
                className="form-control"
                min={1}
                value={unidades}
                onChange={(e) => setUnidades(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="fw-semibold">Descripción / Detalle</label>
            <textarea
              className="form-control"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ejemplo: 2 becas del 50% para maestría en salud pública"
            />
          </div>

          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary px-4"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar Contraprestación"}
            </button>
          </div>
        </form>

        {/* Lista */}
        <h5 className="fw-bold text-secondary mt-4">📋 Contraprestaciones registradas</h5>
        {contraprestaciones.length === 0 ? (
          <p className="text-muted mt-2">No hay contraprestaciones registradas.</p>
        ) : (
          <div className="table-responsive mt-3">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Unidades</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contraprestaciones.map((c) => (
                  <tr key={c.id}>
                    <td>{c.tipo}</td>
                    <td style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>{c.descripcion}</td>
                    <td>{c.unidades_comprometidas}</td>
                    <td>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(c.id)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



