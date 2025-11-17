// AgreementsList.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import FiltroAvanzado from "./FiltroAvanzado";

/* ------------------ Tipos ------------------ */
interface AgreementsListProps {
  user: any;
  role: string;
  onEdit: (agreement: any) => void;
  onCreate: () => void;
  onOpenContraprestaciones: (agreementId: string) => void;
  onOpenEvidencias: (agreementId: string) => void;
  onOpenInforme: (agreementId: string) => void;
}

/* ------------------ Utilidades de fecha (maneja YYYY-MM-DD) ------------------ */
function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function computeEndDate(start: Date, years: number): Date {
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + years);
  end.setDate(end.getDate() - 1);
  return end;
}

function diffDates(start: Date, end: Date) {
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  let invert = false;
  let from = s;
  let to = e;
  if (s > e) {
    invert = true;
    from = e;
    to = s;
  }

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((to.getTime() - from.getTime()) / msPerDay);

  return { years, months, days, totalDays, invert };
}

function formatDiffString({ years, months, days }: { years: number; months: number; days: number }) {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? "día" : "días"}`);
  return parts.length > 0 ? parts.join(" ") : "0 días";
}

/* ------------------ Componente ------------------ */
export default function AgreementsList({
  user,
  role,
  onEdit,
  onCreate,
  onOpenContraprestaciones,
  onOpenEvidencias,
  onOpenInforme,
}: AgreementsListProps) {
  // data
  const [agreements, setAgreements] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros UI
  const [search, setSearch] = useState("");
  // NOTA: removimos los botones rápidos de "tipos" de la cabecera (va en filtro avanzado)
  const [estadoFilter, setEstadoFilter] = useState<"all" | "vigente" | "por_vencer" | "vencido">("all");

  // filtro avanzado (objeto devuelto por FiltroAvanzado)
  const [showFiltroAvanzado, setShowFiltroAvanzado] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any | null>(null);

  // paginación simple
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // lista de tipos (se usa como fallback en FiltroAvanzado si no hay tabla)
  const tiposFallback = [
    "Docente Asistencial",
    "Cooperación técnica",
    "Movilidad académica",
    "Investigación",
    "Colaboración académica",
    "Consultoría",
    "Cotutela",
  ];

  /* ------------------ Fetch de areas (para filtro) ------------------ */
  const fetchAreas = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("areas_vinculadas").select("id, nombre").order("nombre", { ascending: true });
      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error("Error cargando áreas vinculadas:", err);
      setAreas([]);
    }
  }, []);

  /* ------------------ Fetch de convenios según rol ------------------ */
  const fetchAgreements = useCallback(async () => {
    setLoading(true);
    try {
      let visible: any[] = [];

      if (["admin", "Admin", "Administrador"].includes(role)) {
        const { data, error } = await supabase.from("agreements").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        visible = data || [];
      } else if (["internal", "interno"].includes(role)) {
        const { data: vinculos, error: err1 } = await supabase
          .from("agreement_internal_responsibles")
          .select("agreement_id")
          .eq("internal_responsible_id", user.id);
        if (err1) throw err1;
        const ids = (vinculos || []).map((v: any) => v.agreement_id);
        if (ids.length > 0) {
          const { data, error } = await supabase.from("agreements").select("*").in("id", ids).order("created_at", { ascending: false });
          if (error) throw error;
          visible = data || [];
        } else visible = [];
      } else {
        const { data, error } = await supabase
          .from("agreements")
          .select("*")
          .eq("external_responsible", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        visible = data || [];
      }

      setAgreements(visible);
    } catch (err) {
      console.error("❌ Error al cargar convenios:", err);
      alert("Error al cargar convenios. Revisa la consola.");
      setAgreements([]);
    } finally {
      setLoading(false);
    }
  }, [role, user?.id]);

  useEffect(() => {
    if (!user?.id || !role) return;
    fetchAgreements();
    fetchAreas();
  }, [user?.id, role, fetchAgreements, fetchAreas]);

  /* ------------------ Acciones ------------------ */
  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar el convenio "${name}"?`)) return;
    try {
      const { error } = await supabase.from("agreements").delete().eq("id", id);
      if (error) throw error;
      setAgreements((prev) => prev.filter((a) => a.id !== id));
      alert("✅ Convenio eliminado correctamente");
    } catch (err) {
      console.error(err);
      alert("❌ Error al eliminar convenio");
    }
  }, []);

  /* ------------------ Vigencia y estado helpers (usa expiration_date si existe) ------------------ */
  const getEndDate = useCallback((a: any): Date | null => {
    // preferimos expiration_date (columna generada en la base)
    if (a?.expiration_date) return new Date(a.expiration_date);
    if (!a?.signature_date || !a?.duration_years) return null;
    const sig = parseLocalDate(a.signature_date);
    if (!sig) return null;
    return computeEndDate(sig, Number(a.duration_years));
  }, []);

  const getStatus = useCallback((a: any) => {
    const end = getEndDate(a);
    if (!end) return { key: "sin_info", label: "Sin vigencia", color: "secondary" };

    const today = new Date();
    const diff = diffDates(today, end);
    if (diff.invert) return { key: "vencido", label: `Vencido hace ${formatDiffString(diff)}`, color: "danger" };
    if (diff.totalDays <= 90) return { key: "por_vencer", label: `Por vencer: ${formatDiffString(diff)}`, color: "warning" };
    return { key: "vigente", label: `Vigente: ${formatDiffString(diff)}`, color: "success" };
  }, [getEndDate]);

  const renderStatusBadge = useCallback((a: any) => {
    const st = getStatus(a);
    const colorClass = st.color === "success" ? "bg-success text-white" : st.color === "warning" ? "bg-warning text-dark" : st.color === "danger" ? "bg-danger text-white" : "bg-secondary text-white";
    return (
      <span className={`badge ${colorClass}`} title={st.label} style={{ fontSize: "0.85rem" }}>
        {st.key === "vigente" ? "🟢 Vigente" : st.key === "por_vencer" ? "🟡 Por vencer" : st.key === "vencido" ? "🔴 Vencido" : "⚪ Sin vigencia"}
      </span>
    );
  }, [getStatus]);

  const renderCountdown = useCallback((a: any) => {
    const end = getEndDate(a);
    if (!end) return <small className="text-muted">Sin vigencia</small>;
    const today = new Date();
    const diff = diffDates(today, end);
    const text = diff.invert ? `Vencido hace ${formatDiffString(diff)}` : `${formatDiffString(diff)} restante`;
    const styleColor = diff.invert ? { color: "#6c757d" } : diff.totalDays <= 30 ? { color: "#b21f2d", fontWeight: 600 } : diff.totalDays <= 90 ? { color: "#8a6d1f", fontWeight: 600 } : { color: "#256029" };
    return (
      <div style={{ textAlign: "left" }}>
        <div style={styleColor} title={a.signature_date ? `Termina: ${end.toLocaleDateString("es-PE")}` : undefined}>
          {text}
        </div>
        <small className="text-muted">Termina: {end.toLocaleDateString("es-PE")}</small>
      </div>
    );
  }, [getEndDate]);

  /* ------------------ Filtrado (incluye advancedFilters) ------------------ */
  const filtered = useMemo(() => {
    let result = agreements.slice();

    // búsqueda simple
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => {
        const name = (a.name || "").toString().toLowerCase();
        const objetivos = (a.objetivos || "").toString().toLowerCase();
        const pais = (a.pais || "").toString().toLowerCase();
        const resol = (a["Resolución Rectoral"] || "").toString().toLowerCase();
        return name.includes(q) || objetivos.includes(q) || pais.includes(q) || resol.includes(q);
      });
    }

    // filtro por estado (select - usa expiration_date)
    if (estadoFilter !== "all") {
      result = result.filter((a) => {
        const st = getStatus(a);
        if (estadoFilter === "vigente") return st.key === "vigente";
        if (estadoFilter === "por_vencer") return st.key === "por_vencer";
        if (estadoFilter === "vencido") return st.key === "vencido";
        return true;
      });
    }

    // filtro avanzado (client-side). Soportamos payloads con claves: areas | areaResponsable, tipos | tipoConvenio, estados | estado
    if (advancedFilters) {
      const areaIdsFromPayload: string[] = advancedFilters.areas || advancedFilters.areaResponsable || [];
      const tiposFromPayload: string[] = advancedFilters.tipos || advancedFilters.tipoConvenio || [];
      const estadosFromPayload: string[] = advancedFilters.estados || advancedFilters.estado || [];
      const anioInicio = advancedFilters.anioInicio || advancedFilters.añoInicio ? Number(advancedFilters.anioInicio ?? advancedFilters.añoInicio) : null;
      const anioFin = advancedFilters.anioFin || advancedFilters.añoFin ? Number(advancedFilters.anioFin ?? advancedFilters.añoFin) : null;
      const operador = advancedFilters.operator || advancedFilters.operador || "AND";

      // Si payload áreas contiene nombres en vez de ids (compatibilidad), convertimos nombres a ids
      // (permitimos ambos: FiltroAvanzado actual devuelve ids en `areas`, pero versiones previas podían devolver nombres)
      let selectedAreaIds: string[] = [];
      if (areaIdsFromPayload.length > 0) {
        // detectamos si it's array of ids (uuid-ish) by checking presence in areas list by id or by name
        const first = areaIdsFromPayload[0];
        const foundById = areas.some((ar) => ar.id === first);
        if (foundById) {
          selectedAreaIds = areaIdsFromPayload;
        } else {
          // tratar como nombres -> mapear a ids
          selectedAreaIds = areas.filter((ar) => areaIdsFromPayload.includes(ar.nombre)).map((ar) => ar.id);
        }
      }

      const matchesAdvanced = (item: any) => {
        const checks: boolean[] = [];

        // AREA
        if (selectedAreaIds.length > 0) {
          const matchArea = selectedAreaIds.includes(item.area_vinculada_id);
          checks.push(matchArea);
        }

        // TIPO (tipo_convenio array)
        if (tiposFromPayload.length > 0) {
          const tiposField = item.tipo_convenio || [];
          const tipoMatch = Array.isArray(tiposField)
            ? tiposField.some((t: string) => tiposFromPayload.includes(t))
            : tiposFromPayload.includes(tiposField);
          checks.push(tipoMatch);
        }

        // CLASIFICACIÓN (convenio campo: 'específico' | 'marco')
        if (advancedFilters.clasificacion) {
          // soporte: clasificacion puede ser string or array
          const cls = Array.isArray(advancedFilters.clasificacion) ? advancedFilters.clasificacion : [advancedFilters.clasificacion];
          const convenioValue = (item.convenio || "").toString();
          checks.push(cls.includes(convenioValue));
        }

        // ESTADO (por payload)
        if (estadosFromPayload.length > 0) {
          const st = getStatus(item);
          const keyLabel = st.key === "vigente" ? "Vigente" : st.key === "por_vencer" ? "Por vencer" : st.key === "vencido" ? "Vencido" : "Sin vigencia";
          const estadoMatch = estadosFromPayload.includes(keyLabel);
          checks.push(estadoMatch);
        }

        // AÑOS (signature_date)
        if (anioInicio !== null) {
          const sig = parseLocalDate(item.signature_date);
          checks.push(sig ? sig.getFullYear() >= anioInicio : false);
        }
        if (anioFin !== null) {
          const sig = parseLocalDate(item.signature_date);
          checks.push(sig ? sig.getFullYear() <= anioFin : false);
        }

        // Si no hay checks aplicados devolvemos true
        if (checks.length === 0) return true;

        // operador
        if (operador === "OR") return checks.some(Boolean);
        return checks.every(Boolean);
      };

      result = result.filter((r) => matchesAdvanced(r));
    }

    return result;
  }, [agreements, search, estadoFilter, advancedFilters, areas, getStatus]);

  // paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  /* ------------------ Handlers para FiltroAvanzado ------------------ */
  const handleApplyAdvancedFilters = (filtros: any) => {
    // Normalizamos claves antiguas (compatibilidad)
    const normalized = {
      // áreas: permitimos que venga {areas: [ids]} o {areaResponsable: [names]}
      areas: filtros.areas ?? filtros.areaResponsable ?? [],
      tipos: filtros.tipos ?? filtros.tipoConvenio ?? [],
      estados: filtros.estados ?? filtros.estado ?? [],
      anioInicio: filtros.anioInicio ?? filtros.añoInicio ?? "",
      anioFin: filtros.anioFin ?? filtros.añoFin ?? "",
      operator: filtros.operator ?? filtros.operador ?? "AND",
      clasificacion: filtros.clasificacion ?? filtros.clasificación ?? undefined,
    };
    setAdvancedFilters(normalized);
    setShowFiltroAvanzado(false);
    setPage(1);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters(null);
  };

  /* ------------------ Render UI ------------------ */
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold text-primary">📄 Lista de Convenios</h3>

        {["admin", "Admin", "Administrador"].includes(role) && (
          <button className="btn btn-success shadow-sm" onClick={onCreate}>
            ➕ Nuevo Convenio
          </button>
        )}
      </div>

      {/* FILTROS REDISEÑADOS */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <div className="row gy-2 align-items-center">
          {/* búsqueda */}
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="🔎 Buscar por nombre, objetivos, país o resolución..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* estado select */}
          <div className="col-md-3 d-flex align-items-center">
            <label className="me-2 mb-0">Estado:</label>
            <select
              className="form-select"
              value={estadoFilter}
              onChange={(e) => {
                setEstadoFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="all">Todos</option>
              <option value="vigente">Vigente</option>
              <option value="por_vencer">Por vencer (&lt;= 90 días)</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          {/* mostrar y filtro avanzado */}
          <div className="col-md-5 d-flex align-items-center justify-content-end">
            <div className="me-2">Mostrar:</div>
            <select
              className="form-select me-2"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>

            <button className="btn btn-outline-secondary" onClick={() => setShowFiltroAvanzado(true)}>
              ⚙️ Filtro Avanzado
            </button>
          </div>
        </div>

        {/* indicadores de filtros avanzados aplicados */}
        <div className="mt-2">
          {advancedFilters ? (
            <div>
              <small className="text-muted">
                <strong>Filtros avanzados:</strong>{" "}
                {advancedFilters.tipos?.length > 0 && `Tipo: ${advancedFilters.tipos.join(", ")}. `}
                {advancedFilters.areas?.length > 0 && `Área: ${advancedFilters.areas.join(", ")}. `}
                {advancedFilters.estados?.length > 0 && `Estado: ${advancedFilters.estados.join(", ")}. `}
                {advancedFilters.anioInicio && `Año desde ${advancedFilters.anioInicio}. `}
                {advancedFilters.anioFin && `Año hasta ${advancedFilters.anioFin}. `}
                {advancedFilters.clasificacion && `Clasificación: ${Array.isArray(advancedFilters.clasificacion) ? advancedFilters.clasificacion.join(", ") : advancedFilters.clasificacion}. `}
                (Operador: {advancedFilters.operator})
              </small>
              <button className="btn btn-sm btn-link ms-2" onClick={handleClearAdvancedFilters}>Limpiar filtros avanzados</button>
            </div>
          ) : (
            <small className="text-muted">No hay filtros avanzados aplicados.</small>
          )}
        </div>
      </div>

      {/* tabla */}
      <div className="table-responsive shadow-sm" style={{ borderRadius: 10, border: "1px solid #e6e6e6" }}>
        {loading ? (
          <div className="p-4 text-center">Cargando convenios...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-muted">No se encontraron convenios.</div>
        ) : (
          <table className="table table-hover mb-0 align-middle" style={{ fontSize: "0.92rem" }}>
            <thead className="table-light sticky-top" style={{ top: 0 }}>
              <tr>
                <th style={{ minWidth: 260, textAlign: "left" }}>Nombre</th>
                <th>Tipo</th>
                <th>País</th>
                <th>Duración</th>
                <th>Fecha Firma</th>
                <th style={{ minWidth: 240 }}>Vigencia restante</th>
                <th style={{ minWidth: 260 }}>Estado</th>
                <th style={{ width: 260 }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paged.map((a) => (
                <tr key={a.id}>
                  <td style={{ textAlign: "left", verticalAlign: "middle" }}>
                    <div style={{ fontWeight: 600 }}>{a.name || "-"}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>{a["Resolución Rectoral"] || ""}</div>
                  </td>

                  <td style={{ verticalAlign: "middle" }}>
                    {Array.isArray(a.tipo_convenio)
                      ? a.tipo_convenio.map((t: string, idx: number) => (
                          <span key={idx} className="badge bg-info text-dark me-1" style={{ fontSize: "0.75rem" }}>
                            {t}
                          </span>
                        ))
                      : a.convenio ? (
                        <span className="badge bg-info text-dark" style={{ fontSize: "0.75rem" }}>{a.convenio}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                  </td>

                  <td style={{ verticalAlign: "middle" }}>{a.pais || "-"}</td>

                  <td style={{ verticalAlign: "middle" }}>{a.duration_years ? `${a.duration_years} ${a.duration_years === 1 ? "año" : "años"}` : "Sin dato"}</td>

                  <td style={{ verticalAlign: "middle" }}>
                    {a.signature_date ? parseLocalDate(a.signature_date)?.toLocaleDateString("es-PE") : "-"}
                  </td>

                  <td style={{ verticalAlign: "middle", textAlign: "left" }}>{renderCountdown(a)}</td>

                  <td style={{ verticalAlign: "middle" }}>{renderStatusBadge(a)}</td>

                  <td style={{ verticalAlign: "middle" }}>
                    <div className="d-flex flex-wrap gap-2">
                      {["admin", "Admin", "Administrador"].includes(role) && (
                        <>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(a)} title="Editar convenio">
                            ✏️ Editar
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(a.id, a.name)} title="Eliminar convenio">
                            🗑️ Eliminar
                          </button>
                        </>
                      )}

                      <button className="btn btn-sm btn-outline-success" onClick={() => onOpenContraprestaciones(a.id)} title="Programar contraprestaciones">
                        📋 Programar
                      </button>

                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => onOpenEvidencias(a.id)}
                        title="Cumplimiento / Evidencias"
                      >
                        📂 Cumplimiento
                      </button>

                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onOpenInforme(a.id)}
                        title="Informe semestral"
                      >
                        📝 Informe
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* paginación */}
      {filtered.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-muted">
            Mostrando {Math.min((page - 1) * pageSize + 1, filtered.length)} -{" "}
            {Math.min(page * pageSize, filtered.length)} de {filtered.length}
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <div>
              Página {page} / {totalPages}
            </div>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Filtro Avanzado modal */}
      {showFiltroAvanzado && (
        <FiltroAvanzado
          onApply={handleApplyAdvancedFilters}
          onClose={() => setShowFiltroAvanzado(false)}
        />
      )}
    </div>
  );
}























