// src/Contraprestaciones.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Contraprestacion {
  id: string;
  tipo: string;
  descripcion: string;
  unidades_comprometidas: number;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  agreement_id: string;
}

interface ContraprestacionCatalogo {
  id: string;
  nombre: string;
  unidad: string;
}

interface AgreementInfo {
  signature_date: string | null;
  expiration_date: string | null;
  duration_years: number | null;
}

interface Renewal {
  id: string;
  agreement_id: string;
  old_expiration_date: string | null;
  new_expiration_date: string | null;
  changed_at: string | null;
  changed_by?: string | null;
}

interface Props {
  agreementId: string;
  onBack: () => void;
}

// Generador de ID con fallback
function generateId() {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return `ctr_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export default function Contraprestaciones({ agreementId, onBack }: Props) {
  const [contraprestaciones, setContraprestaciones] = useState<Contraprestacion[]>([]);
  const [tipos, setTipos] = useState<ContraprestacionCatalogo[]>([]);
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [unidades, setUnidades] = useState(1);
  const [aniosConvenio, setAniosConvenio] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [agreementInfo, setAgreementInfo] = useState<AgreementInfo | null>(null);
  const [renewals, setRenewals] = useState<Renewal[]>([]);

  // 🔹 Cargar permisos y datos iniciales
  useEffect(() => {
    verificarPermisos();
    fetchCatalogo();
    fetchContraprestaciones();
    fetchAgreementInfo();
    fetchRenewals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  // 🔹 Verifica si el usuario tiene acceso al convenio
  const verificarPermisos = async () => {
    try {
      const { data: userData, error } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const {  data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profileError) return;

      // @ts-ignore
      const role = profileData?.role;
      if (["admin", "Admin", "Administrador"].includes(role)) {
        setPuedeEditar(true);
        return;
      }

      const {  data: vinculoData, error: vinculoError } = await supabase
        .from("agreement_internal_responsibles")
        .select("id")
        .eq("agreement_id", agreementId)
        .eq("internal_responsible_id", userId)
        .maybeSingle();

      if (!vinculoError && vinculoData) setPuedeEditar(true);
    } catch (err) {
      console.error("Error verificando permisos:", err);
    }
  };

  // 🔹 Cargar catálogo desde tabla
  const fetchCatalogo = async () => {
    try {
      const {  data, error } = await supabase
        .from("contraprestaciones_catalogo")
        .select("id, nombre, unidad")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setTipos(data || []);
    } catch (error) {
      console.error("Error al cargar catálogo:", error);
      alert("Error al cargar el catálogo de contraprestaciones.");
    }
  };

  // 🔹 Obtener información completa del convenio
  const fetchAgreementInfo = async () => {
    try {
      const {  data, error } = await supabase
        .from("agreements")
        .select("signature_date, expiration_date, duration_years")
        .eq("id", agreementId)
        .single();

      if (error) throw error;
      
      setAgreementInfo(data || null);
      
      const years = data?.duration_years || 1;
      setAniosConvenio(Array.from({ length: years }, (_, i) => i + 1));
    } catch (error) {
      console.error("Error al obtener información del convenio:", error);
    }
  };

  // 🔹 Obtener renovaciones
  const fetchRenewals = async () => {
    try {
      const {  data, error } = await supabase
        .from("agreement_renewals")
        .select("*")
        .eq("agreement_id", agreementId)
        .order("changed_at", { ascending: false })
        .limit(1); // Solo necesitamos la última renovación

      if (error) throw error;
      setRenewals(data || []);
    } catch (error) {
      console.error("Error al obtener renovaciones:", error);
    }
  };

  // 🔹 Cargar contraprestaciones ya registradas
  const fetchContraprestaciones = async () => {
    try {
      const {  data, error } = await supabase
        .from("contraprestaciones")
        .select("id, tipo, descripcion, unidades_comprometidas, periodo_inicio, periodo_fin, agreement_id")
        .eq("agreement_id", agreementId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setContraprestaciones(data || []);
    } catch (error) {
      console.error("Error al cargar contraprestaciones:", error);
    }
  };

  // 🔹 Calcular fechas basadas en la renovación activa
  const calcularFechasPeriodo = (yearIndex: number = 0) => {
    if (!agreementInfo) {
      return { periodo_inicio: null, periodo_fin: null };
    }

    // Si hay renovaciones, usar la más reciente
    if (renewals.length > 0) {
      const latestRenewal = renewals[0];
      const startDateStr = latestRenewal.new_expiration_date || agreementInfo.signature_date;
      if (!startDateStr) {
        return { periodo_inicio: null, periodo_fin: null };
      }
      
      // Calcular fecha de inicio (1 año después de la expiración anterior)
      const startDate = new Date(startDateStr);
      startDate.setFullYear(startDate.getFullYear() + 1);
      startDate.setMonth(0); // Enero
      startDate.setDate(1);
      
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      endDate.setMonth(11); // Diciembre
      endDate.setDate(31);
      
      return {
        periodo_inicio: startDate.toISOString().split('T')[0],
        periodo_fin: endDate.toISOString().split('T')[0]
      };
    }

    // Si no hay renovaciones, usar las fechas del convenio original
    const { signature_date, expiration_date, duration_years } = agreementInfo;
    
    if (!signature_date || !duration_years) {
      return { periodo_inicio: null, periodo_fin: null };
    }

    const startDate = new Date(signature_date);
    let endDate: Date;
    
    if (expiration_date) {
      endDate = new Date(expiration_date);
    } else {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + duration_years);
      endDate.setDate(endDate.getDate() - 1);
    }

    return {
      periodo_inicio: startDate.toISOString().split('T')[0],
      periodo_fin: endDate.toISOString().split('T')[0]
    };
  };

  // 🔹 Registrar nueva contraprestación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEditar) return alert("No tienes permisos para realizar esta acción.");

    setLoading(true);

    if (!tipo) {
      alert("Por favor, seleccione el tipo de contraprestación.");
      setLoading(false);
      return;
    }

    const selectedTipo = tipos.find((t) => t.nombre === tipo);
    const tipoDescripcion = selectedTipo
      ? `${selectedTipo.nombre} (${selectedTipo.unidad})`
      : tipo;

    // Generamos un id cliente-lado
    const newId = generateId();

    // Calcular fechas del período
    const { periodo_inicio, periodo_fin } = calcularFechasPeriodo();

    try {
      // ✅ Obtener la última renovación activa para este agreement_id
      let renewalId = null;
      if (renewals.length > 0) {
      renewalId = renewals[0].id; // La renovación más reciente
      }

      const { error: insertError } = await supabase.from("contraprestaciones").insert([
        {
          id: newId,
          agreement_id: agreementId,
          tipo: tipoDescripcion,
          descripcion,
          unidades_comprometidas: unidades,
          periodo_inicio,
          periodo_fin,
          renewal_id: renewalId, // ✅ Asignar renewal_id
        },
      ]);

      if (insertError) throw insertError;

      // Crear seguimiento automático por cada año del convenio
      if (aniosConvenio.length > 0) {
        // Primero ver qué años ya existen para evitar duplicados
        const {   data: existingData, error: existingError } = await supabase
          .from("contraprestaciones_seguimiento")
          .select("anio")
          .eq("contraprestacion_id", newId);

        if (existingError) {
          console.warn("No se pudo comprobar seguimiento existente:", existingError);
        }

        const existingYears = Array.isArray(existingData) ? existingData.map((x: any) => x.anio) : [];

        const seguimientoData = aniosConvenio
          .map((a, i) => i + 1)
          .filter((year) => !existingYears.includes(year))
          .map((year) => ({
            contraprestacion_id: newId,
            anio: year,
            estado: "pendiente",
            ejecutado: false,
          }));

        if (seguimientoData.length > 0) {
          const { error: seguimientoError } = await supabase
            .from("contraprestaciones_seguimiento")
            .insert(seguimientoData);

          if (seguimientoError) {
            console.error("Error creando seguimiento:", seguimientoError);
            alert("⚠️ Se registró la contraprestación pero no el seguimiento.");
          }
        }
      }

      alert("✅ Contraprestación registrada correctamente.");
      setTipo("");
      setDescripcion("");
      setUnidades(1);
      fetchContraprestaciones();
    } catch (error: any) {
      console.error("Error al guardar contraprestación:", error);
      alert("❌ Error al guardar la contraprestación: " + (error?.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Eliminar contraprestación
  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas eliminar esta contraprestación?")) return;

    try {
      const { error } = await supabase.from("contraprestaciones").delete().eq("id", id);
      if (error) throw error;
      setContraprestaciones((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("❌ Error al eliminar: " + (err?.message || String(err)));
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

        {puedeEditar ? (
          <>
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

                <div className="col-md-6 mb-3">
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
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Contraprestación"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <p className="text-muted fst-italic mb-4">
            ⚠️ No tienes permisos para registrar contraprestaciones. Solo puedes visualizarlas.
          </p>
        )}

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
                  <th>Período</th>
                  {puedeEditar && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {contraprestaciones.map((c) => (
                  <tr key={c.id}>
                    <td>{c.tipo}</td>
                    <td style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>{c.descripcion}</td>
                    <td>{c.unidades_comprometidas}</td>
                    <td>
                      {c.periodo_inicio && c.periodo_fin 
                        ? `${c.periodo_inicio} - ${c.periodo_fin}`
                        : "Sin período definido"
                      }
                    </td>
                    {puedeEditar && (
                      <td>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(c.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    )}
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