// src/AgreementsList.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import FiltroAvanzado from "./FiltroAvanzado";
import RenewalHistory from "./RenewalHistory";
import AgreementDetailsModal from "./AgreementDetailsModal";

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
  // inclusive: restamos 1 día
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
  const navigate = useNavigate();

  // data
  const [agreements, setAgreements] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [renewalsMap, setRenewalsMap] = useState<Record<string, { count: number; latest_new_expiration_date: string | null }>>({});
  const [loading, setLoading] = useState(true);

   // 🔹 NUEVO: Estado para almacenar TODAS las renovaciones del convenio activo
   const [renewalsDataState, setRenewalsDataState] = useState<any[]>([]);

  // filtros UI
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"all" | "vigente" | "por_vencer" | "vencido">("all");

  // filtro avanzado
  const [showFiltroAvanzado, setShowFiltroAvanzado] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<any | null>(null);

  // paginación simple
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Busca la sección de useState (aproximadamente línea 50-60) y agrega:
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedAgreementForHistory, setSelectedAgreementForHistory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Agregar estados para el modal

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAgreementForDetails, setSelectedAgreementForDetails] = useState<{
    id: string;
    name: string;
  } | null>(null);

  /* ------------------ Fetch Áreas ------------------ */
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

  /* ------------------ Fetch convenios y renovaciones ------------------ */
  const fetchAgreementsAndRenewals = useCallback(async () => {
    setLoading(true);
    try {
      // 1) traer convenios según rol
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

      // 2) traer renovaciones para esos convenios (map)
      const agreementIds = (visible || []).map((a: any) => a.id).filter(Boolean);
      if (agreementIds.length === 0) {
        setRenewalsMap({});
        setLoading(false);
        return;
      }

      const { data: renewalsData, error: rError } = await supabase
        .from("agreement_renewals")
        .select("id, agreement_id, old_expiration_date, new_expiration_date, changed_at")
        .in("agreement_id", agreementIds)
        .order("changed_at", { ascending: false }); // más recientes primero

      if (rError) throw rError;

      setRenewalsDataState(renewalsData || []);

      // agrupar por agreement_id
      const map: Record<string, { count: number; latest_new_expiration_date: string | null }> = {};
      (renewalsData || []).forEach((r: any) => {
        const aid = r.agreement_id;
        if (!map[aid]) {
          map[aid] = { count: 0, latest_new_expiration_date: null };
        }
        map[aid].count += 1;
        // guardamos la más reciente (renewalsData ya está ordenado desc por changed_at)
        if (r.new_expiration_date && !map[aid].latest_new_expiration_date) {
          map[aid].latest_new_expiration_date = r.new_expiration_date;
        }
      });

      setRenewalsMap(map);
    } catch (err) {
      console.error("❌ Error al cargar convenios/renovaciones:", err);
      setAgreements([]);
      setRenewalsMap({});
    } finally {
      setLoading(false);
    }
  }, [role, user?.id]);

  useEffect(() => {
    if (!user?.id || !role) return;
    fetchAgreementsAndRenewals();
    fetchAreas();
  }, [user?.id, role, fetchAgreementsAndRenewals, fetchAreas]);

  /* ------------------ Helpers vigencia ------------------ */
  const getEndDate = useCallback((a: any): Date | null => {
    // el campo expiration_date puede venir como string|null
    if (a?.expiration_date) return new Date(String(a.expiration_date));
    if (!a?.signature_date || !a?.duration_years) return null;
    const sig = parseLocalDate(a.signature_date);
    if (!sig) return null;
    return computeEndDate(sig, Number(a.duration_years));
  }, []);

  const getActiveRenewalFor = (agreementId: string) => {
    if (!renewalsDataState || renewalsDataState.length === 0) return null;
  
    // Buscamos la renovación más reciente de ese convenio
    const r = renewalsDataState
      .filter((x) => x.agreement_id === agreementId)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  
    return r.length > 0 ? r[0] : null; // la más reciente
  };
  
  /* ------------------ Helpers renovaciones (vigencia + renovación activa) ------------------ */
    const getRenewalInfo = useCallback(
      (agreementId: string) => {
        const r = renewalsMap[agreementId];
        if (!r) return { latestExpiration: null, activeRenewalId: null };
  
        const latestExpiration = r.latest_new_expiration_date
          ? new Date(r.latest_new_expiration_date)
          : null;
  
        // Buscar en renewalsData cuál renovación tiene esa fecha (la más reciente)
        // NOTA: fetchAgreementsAndRenewals ya las trae ordenadas desc
        const renewalList = Object.values(renewalsMap);
        let activeRenewalId: string | null = null;
  
        // Como renewalsMap no guarda IDs, necesitamos buscar en fetch
        // Para eso añadimos renewalsData en state
        // (lo agregaremos más arriba en tu archivo)
  
        if (renewalsDataState.length > 0) {
          const found = renewalsDataState.find(
            (r) =>
              r.agreement_id === agreementId &&
              r.new_expiration_date === renewalsMap[agreementId]?.latest_new_expiration_date
          );
          if (found) activeRenewalId = found.id;
        }
  
        return {
          latestExpiration,
          activeRenewalId,
        };
      },
      [renewalsMap, renewalsDataState]
    );
  
    /* ------------------ Fecha final real del convenio ------------------ */
    const getRealEndDate = useCallback(
      (agreement: any): Date | null => {
        const renewal = getRenewalInfo(agreement.id);
  
        // 1) Si hay renovación → usar la fecha de la última renovación
        if (renewal.latestExpiration) return renewal.latestExpiration;
  
        // 2) Sino → usar la fecha normal del convenio
        return getEndDate(agreement);
      },
      [getRenewalInfo, getEndDate]
    );
  
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
    const colorClass =
      st.color === "success"
        ? "bg-success text-white"
        : st.color === "warning"
        ? "bg-warning text-dark"
        : st.color === "danger"
        ? "bg-danger text-white"
        : "bg-secondary text-white";
    return (
      <span className={`badge ${colorClass}`} title={st.label} style={{ fontSize: "0.85rem" }}>
        {st.key === "vigente" ? "🟢 Vigente" : st.key === "por_vencer" ? "🟡 Por vencer" : st.key === "vencido" ? "🔴 Vencido" : "⚪ Sin vigencia"}
      </span>
    );
  }, [getStatus]);

  const renderCountdown = useCallback(
    (a: any) => {
      const end = getEndDate(a);
      if (!end) return <small className="text-muted">Sin vigencia</small>;
      const today = new Date();
      const diff = diffDates(today, end);
      const text = diff.invert ? `Vencido hace ${formatDiffString(diff)}` : `${formatDiffString(diff)} restante`;
      const styleColor = diff.invert
        ? { color: "#6c757d" }
        : diff.totalDays <= 30
        ? { color: "#b21f2d", fontWeight: 600 }
        : diff.totalDays <= 90
        ? { color: "#8a6d1f", fontWeight: 600 }
        : { color: "#256029" };

      return (
        <div style={{ textAlign: "left" }}>
          <div style={styleColor} title={a.signature_date ? `Termina: ${end.toLocaleDateString("es-PE")}` : undefined}>
            {text}
          </div>
          <small className="text-muted">Termina: {end.toLocaleDateString("es-PE")}</small>

          {/* mostrar renovaciones */}
          {renewalsMap[a.id] && (
            <div style={{ fontSize: "0.85rem", marginTop: 6 }}>
              Renovado {renewalsMap[a.id].count} {renewalsMap[a.id].count === 1 ? "vez" : "veces"}
              {renewalsMap[a.id].latest_new_expiration_date
                ? ` — último: ${new Date(String(renewalsMap[a.id].latest_new_expiration_date)).toLocaleDateString("es-PE")}`
                : ""}
            </div>
          )}
        </div>
      );
    },
    [getEndDate, renewalsMap]
  );

  /* ------------------ Filtros (simple + advanced) ------------------ */
  const filtered = useMemo(() => {
    let result = agreements.slice();

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

    if (estadoFilter !== "all") {
      result = result.filter((a) => {
        const st = getStatus(a);
        if (estadoFilter === "vigente") return st.key === "vigente";
        if (estadoFilter === "por_vencer") return st.key === "por_vencer";
        if (estadoFilter === "vencido") return st.key === "vencido";
        return true;
      });
    }

    if (advancedFilters) {
      const areaIdsFromPayload: string[] = advancedFilters.areas || advancedFilters.areaResponsable || [];
      const tiposFromPayload: string[] = advancedFilters.tipos || advancedFilters.tipoConvenio || [];
      const estadosFromPayload: string[] = advancedFilters.estados || advancedFilters.estado || [];
      const anioInicio = advancedFilters.anioInicio || advancedFilters.añoInicio ? Number(advancedFilters.anioInicio ?? advancedFilters.añoInicio) : null;
      const anioFin = advancedFilters.anioFin || advancedFilters.añoFin ? Number(advancedFilters.anioFin ?? advancedFilters.añoFin) : null;
      const operador = advancedFilters.operator || advancedFilters.operador || "AND";

      let selectedAreaIds: string[] = [];
      if (areaIdsFromPayload.length > 0) {
        const first = areaIdsFromPayload[0];
        const foundById = areas.some((ar) => ar.id === first);
        if (foundById) {
          selectedAreaIds = areaIdsFromPayload;
        } else {
          selectedAreaIds = areas.filter((ar) => areaIdsFromPayload.includes(ar.nombre)).map((ar) => ar.id);
        }
      }

      const matchesAdvanced = (item: any) => {
        const checks: boolean[] = [];

        if (selectedAreaIds.length > 0) {
          checks.push(selectedAreaIds.includes(item.area_vinculada_id));
        }

        if (tiposFromPayload.length > 0) {
          const tiposField = item.tipo_convenio || [];
          const tipoMatch = Array.isArray(tiposField) ? tiposField.some((t: string) => tiposFromPayload.includes(t)) : tiposFromPayload.includes(tiposField);
          checks.push(tipoMatch);
        }

        if (estadosFromPayload.length > 0) {
          const st = getStatus(item);
          const keyLabel = st.key === "vigente" ? "Vigente" : st.key === "por_vencer" ? "Por vencer" : st.key === "vencido" ? "Vencido" : "Sin vigencia";
          checks.push(estadosFromPayload.includes(keyLabel));
        }

        if (anioInicio !== null) {
          const sig = parseLocalDate(item.signature_date);
          checks.push(sig ? sig.getFullYear() >= anioInicio : false);
        }
        if (anioFin !== null) {
          const sig = parseLocalDate(item.signature_date);
          checks.push(sig ? sig.getFullYear() <= anioFin : false);
        }

        if (checks.length === 0) return true;
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

  /* ------------------ Handlers Filtro Avanzado ------------------ */
  const handleApplyAdvancedFilters = (filtros: any) => {
    const normalized = {
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

  /* ------------------ Handlers Historial de Renovaciones ------------------ */
  const handleOpenHistory = (agreement: any) => {
    setSelectedAgreementForHistory({
      id: agreement.id,
      name: agreement.name
    });
    setShowHistoryModal(true);
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setSelectedAgreementForHistory(null);
  };
  // Agregar funciones para abrir/cerrar el modal
  const handleOpenDetails = (agreement: any) => {
    setSelectedAgreementForDetails({
      id: agreement.id,
      name: agreement.name
    });
    setShowDetailsModal(true);
  };
  
  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedAgreementForDetails(null);
  };

  /* ------------------ Navegación para renovaciones (abre nueva página) ------------------ */
  const navigateToRenewalPage = (agreementId: string) => {
    // abre la página de renovación en la misma pestaña (usar target nuevo si quieres en otra pestaña)
    navigate(`/renewals/${agreementId}`);
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

      {/* FILTROS */}
      <div className="card shadow-sm border-0 p-3 mb-4">
        <div className="row gy-2 align-items-center">
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
              <button className="btn btn-sm btn-link ms-2" onClick={handleClearAdvancedFilters}>
                Limpiar filtros avanzados
              </button>
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
                <th style={{ width: 380 }}>Acciones</th>
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
                    {Array.isArray(a.tipo_convenio) ? (
                      a.tipo_convenio.map((t: string, idx: number) => (
                        <span key={idx} className="badge bg-info text-dark me-1" style={{ fontSize: "0.75rem" }}>
                          {t}
                        </span>
                      ))
                    ) : a.convenio ? (
                      <span className="badge bg-info text-dark" style={{ fontSize: "0.75rem" }}>
                        {a.convenio}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>

                  <td style={{ verticalAlign: "middle" }}>{a.pais || "-"}</td>

                  <td style={{ verticalAlign: "middle" }}>{a.duration_years ? `${a.duration_years} ${a.duration_years === 1 ? "año" : "años"}` : "Sin dato"}</td>

                  <td style={{ verticalAlign: "middle" }}>{a.signature_date ? parseLocalDate(a.signature_date)?.toLocaleDateString("es-PE") : "-"}</td>

                  <td style={{ verticalAlign: "middle", textAlign: "left" }}>{renderCountdown(a)}</td>

                  <td style={{ verticalAlign: "middle" }}>{renderStatusBadge(a)}</td>

                  <td style={{ verticalAlign: "middle" }}>
                    <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '350px' }}>
                      
                      {/* 🆕 BOTÓN VER - AL PRINCIPIO */}
                      <button 
                        className="btn btn-sm btn-outline-info" 
                        onClick={() => handleOpenDetails(a)} 
                        title="Ver detalles completos"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      >
                        👁️ Ver
                      </button>

                      {/* Solo Admin puede editar y eliminar */}
                      {["admin", "Admin", "Administrador"].includes(role) && (
                        <>
                          <button 
                            className="btn btn-sm btn-outline-secondary" 
                            onClick={() => onEdit(a)} 
                            title="Editar convenio"
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={async () => {
                              if (confirm(`¿Eliminar el convenio "${a.name}"?`)) {
                                const { error } = await supabase.from("agreements").delete().eq("id", a.id);
                                if (error) alert("Error al eliminar: " + error.message);
                                else {
                                  setAgreements((prev) => prev.filter((x) => x.id !== a.id));
                                  alert("✅ Convenio eliminado correctamente");
                                }
                              }
                            }}
                            title="Eliminar convenio"
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                          >
                            🗑️ Eliminar
                          </button>
                        </>
                      )}

                      {/* Botones disponibles para todos */}
                      <button 
                        className="btn btn-sm btn-outline-success"
                        onClick={() => onOpenContraprestaciones(a.id)}
                        title="Programar contraprestaciones"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      >
                        📋 Programar
                      </button>

                      <button 
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => onOpenEvidencias(a.id)}
                        title="Cumplimiento / Evidencias"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      >
                        📂 Cumplimiento
                      </button>

                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onOpenInforme(a.id)}
                        title="Informe semestral"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      >
                        📝 Informe
                      </button>

                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        onClick={() => navigateToRenewalPage(a.id)} 
                        title="Renovar convenio"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      >
                        🔄 Renovar
                      </button>

                      <button 
                        className="btn btn-sm btn-outline-info" 
                        onClick={() => handleOpenHistory(a)} 
                        title="Ver historial de renovaciones"
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                      >
                        📜 Historial
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
            Mostrando {Math.min((page - 1) * pageSize + 1, filtered.length)} - {Math.min(page * pageSize, filtered.length)} de {filtered.length}
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              ← Prev
            </button>
            <div>
              Página {page} / {totalPages}
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Filtro Avanzado modal */}
{showFiltroAvanzado && (
  <div 
    className="modal fade show d-block" 
    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
    onClick={() => setShowFiltroAvanzado(false)}
  >
    <div 
      className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-content border-0 shadow-lg">
        {/* HEADER */}
        <div 
          className="modal-header" 
          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          <div className="text-white">
            <h4 className="modal-title mb-1 fw-bold">⚙️ Filtro Avanzado</h4>
            <p className="mb-0 opacity-75">Los filtros se aplican automáticamente</p>
          </div>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => setShowFiltroAvanzado(false)}
          ></button>
        </div>

        {/* BODY */}
        <div className="modal-body p-4">
          <FiltroAvanzado 
            onApply={handleApplyAdvancedFilters} 
            onClose={() => setShowFiltroAvanzado(false)} 
          />
        </div>

        {/* FOOTER */}
        <div className="modal-footer bg-light border-0">
          <button 
            className="btn btn-secondary px-4" 
            onClick={() => setShowFiltroAvanzado(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {/* Modal de Historial de Renovaciones */}
      {showHistoryModal && selectedAgreementForHistory && (
        <RenewalHistory
          show={showHistoryModal}
          onClose={handleCloseHistory}
          agreementId={selectedAgreementForHistory.id}
          agreementName={selectedAgreementForHistory.name}
        />
      )}

      {/* Modal de Detalles del Convenio */}
      {showDetailsModal && selectedAgreementForDetails && (
        <AgreementDetailsModal
          show={showDetailsModal}
          onClose={handleCloseDetails}
          agreementId={selectedAgreementForDetails.id}
        />
      )}

    </div>
  );
}