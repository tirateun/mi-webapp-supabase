// src/GestionAcademica.tsx
// Módulo principal: Gestión Académica
// Tabs: Alumnos | Cursos | Internos | Residentes | Sedes (admin)
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import AlumnosManager    from "./AlumnosManager";
import CursosManager     from "./CursosManager";
import InternosManager   from "./InternosManager";
import ResidentesManager from "./ResidentesManager";
import RotacionesManager from "./RotacionesManager";
import SedesManager      from "./SedesManager";

type Tab = "alumnos" | "cursos" | "internos" | "residentes" | "rotaciones" | "sedes";

interface Convenio { id: string; name: string; tipo_convenio: string; subtipos: string[]; }

interface Props {
  userRole: string;
  userId?: string;
}

interface Props {
  userRole: string;
  userId?: string;
}

export default function GestionAcademica({ userRole, userId }: Props) {
  const isAdmin   = userRole === "admin";
  const [tab, setTab]                 = useState<Tab>("alumnos");
  const [convenios, setConvenios]     = useState<Convenio[]>([]);
  const [convenioId, setConvenioId]   = useState("");
  const [convenioNombre, setConvenioNombre] = useState("");
  const [loadingConv, setLoadingConv] = useState(false);
  const [busqConv, setBusqConv]         = useState("");
  const [showConvList, setShowConvList] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  const conveniosFiltrados = convenios.filter(c => {
    // Filtrar por nombre primero
    const matchNombre = !busqConv || c.name.toLowerCase().includes(busqConv.toLowerCase());
    if (!matchNombre) return false;
    // Filtrar por subtipo según el tab activo
    if (tab === "cursos" || tab === "internos") {
      // Solo convenios con al menos un subtipo PREGRADO
      return c.subtipos?.some(s => s.toUpperCase().includes("PREGRADO"));
    }
    if (tab === "residentes" || tab === "rotaciones") {
      // Solo convenios con al menos un subtipo NO PREGRADO (postgrado/residentado)
      return c.subtipos?.some(s => !s.toUpperCase().includes("PREGRADO"));
    }
    return true; // Sedes y otros: todos
  });

  useEffect(() => { cargarConvenios(); }, []);

  const cargarConvenios = async () => {
    setLoadingConv(true);
    const { data } = await supabase
      .from("agreements")
      .select("id, name, tipo_convenio, agreement_subtypes(subtipo_nombre)")
      .contains("tipo_convenio", ["Docente Asistencial"])
      .order("name");
    setConvenios((data || []).map((c: any) => ({
      ...c,
      subtipos: (c.agreement_subtypes || []).map((s: any) => s.subtipo_nombre).filter(Boolean)
    })));
    setLoadingConv(false);
  };

  const onConvenioChange = (id: string) => {
    const conv = convenios.find(c => c.id === id);
    setConvenioId(id);
    setConvenioNombre(conv?.name || "");
  };

  const TABS: { key: Tab; label: string; emoji: string; needsConv: boolean; adminOnly: boolean }[] = [
    { key: "alumnos",    label: "Alumnos",    emoji: "👩‍🎓", needsConv: false, adminOnly: false },
    { key: "cursos",     label: "Cursos",     emoji: "📚",  needsConv: true,  adminOnly: false },
    { key: "internos",   label: "Internos",   emoji: "👨‍⚕️", needsConv: true,  adminOnly: false },
    { key: "residentes", label: "Residentes", emoji: "🏥",  needsConv: true,  adminOnly: false },
    { key: "rotaciones", label: "Rotaciones", emoji: "🔄",  needsConv: true,  adminOnly: false },
    { key: "sedes",      label: "Sedes",      emoji: "🏛️",  needsConv: false, adminOnly: true  },
  ];

  const handleTabChange = (newTab: Tab) => {
    const esPregrado  = (t: Tab) => t === "cursos" || t === "internos";
    const esPostgrado = (t: Tab) => t === "residentes" || t === "rotaciones";
    if ((esPregrado(tab) && esPostgrado(newTab)) ||
        (esPostgrado(tab) && esPregrado(newTab))) {
      setConvenioId(""); setConvenioNombre(""); setBusqConv("");
    }
    setTab(newTab);
  };

  const tabsVisibles = TABS.filter(t => !t.adminOnly || isAdmin);
  const tabActual    = TABS.find(t => t.key === tab)!;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F2F8" }}>
      {/* Header principal */}
      <div style={{ background: "linear-gradient(135deg, #3D1A4F 0%, #5B2C6F 100%)",
        color: "white", padding: "1.75rem 2rem 0", boxShadow: "0 2px 12px rgba(0,0,0,.2)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 700, display: "flex", alignItems: "center", gap: ".5rem" }}>
              🎓 Gestión Académica
            </h1>
            <p style={{ margin: ".3rem 0 0", opacity: .8, fontSize: ".9rem" }}>
              Administración de cursos, alumnos, internos y residentes de convenios Docente Asistencial
            </p>
          </div>

          {/* Selector de convenio (para tabs que lo necesitan) */}
          {tabActual.needsConv && (
            <div style={{ background: "rgba(255,255,255,.1)", borderRadius: "10px 10px 0 0",
              padding: "1rem 1.25rem", marginBottom: 0, display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 320px" }}>
                <label style={{ display: "block", fontSize: ".75rem", fontWeight: 600,
                  letterSpacing: ".06em", textTransform: "uppercase", opacity: .7, marginBottom: 4 }}>
                  Convenio Docente Asistencial
                </label>

                {/* Si ya hay convenio seleccionado → mostrar nombre + subtipos + botón limpiar */}
                {convenioId ? (
                  <div style={{ background: "rgba(255,255,255,.95)", borderRadius: 8, padding: ".6rem .9rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: ".5rem" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: ".8rem", color: "#1A1A2E", fontWeight: 600,
                          marginBottom: ".3rem" }}>✅ {convenioNombre}</div>
                        {(() => {
                          const conv = convenios.find(c => c.id === convenioId);
                          return conv?.subtipos?.length ? (
                            <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
                              {conv.subtipos.map(s => (
                                <span key={s} style={{ background: "#3D1A4F", color: "white",
                                  padding: ".1rem .5rem", borderRadius: 8, fontSize: ".68rem", fontWeight: 600 }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <button onClick={() => { setConvenioId(""); setConvenioNombre(""); setBusqConv(""); }}
                        style={{ background: "none", border: "none", cursor: "pointer",
                          color: "#DC3545", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: ".35rem" }}>
                    {/* Buscador */}
                    <input
                      type="text"
                      value={busqConv}
                      onChange={e => setBusqConv(e.target.value)}
                      placeholder="🔍  Escribir para filtrar..."
                      style={{ width: "100%", padding: ".55rem .9rem", borderRadius: 8,
                        border: "none", fontSize: ".85rem",
                        background: "rgba(255,255,255,.95)", color: "#1A1A2E", outline: "none" }}
                    />
                    {/* Select filtrado con subtipo visible */}
                    <select
                      value=""
                      onChange={e => {
                        if (e.target.value) { onConvenioChange(e.target.value); setBusqConv(""); }
                      }}
                      style={{ width: "100%", padding: ".55rem .9rem", borderRadius: 8,
                        border: "none", fontSize: ".82rem",
                        background: "rgba(255,255,255,.95)", color: "#1A1A2E",
                        cursor: "pointer", maxHeight: 140 }}
                      size={Math.min(conveniosFiltrados.length + 1, 6)}
                    >
                      <option value="" disabled>
                        {loadingConv ? "Cargando..." : `— ${conveniosFiltrados.length} convenio(s) —`}
                      </option>
                      {conveniosFiltrados.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.subtipos?.length ? `[${c.subtipos.join(" / ")}]  ` : ""}{c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: ".25rem", marginTop: tabActual.needsConv ? 0 : "1rem" }}>
            {tabsVisibles.map(t => (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                style={{ padding: ".65rem 1.1rem", border: "none", cursor: "pointer",
                  borderRadius: "8px 8px 0 0", fontWeight: tab === t.key ? 700 : 500,
                  fontSize: ".88rem", transition: "all .15s",
                  background: tab === t.key ? "white" : "rgba(255,255,255,.15)",
                  color: tab === t.key ? "#3D1A4F" : "white" }}>
                {t.emoji} {t.label}
                {t.adminOnly && (
                  <span style={{ fontSize: ".68rem", background: "#FDB913", color: "#3D1A4F",
                    marginLeft: ".4rem", padding: ".1rem .35rem", borderRadius: 4, fontWeight: 700 }}>
                    ADMIN
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {tab === "alumnos" && (
          // En Gestión Académica todos los roles con acceso pueden gestionar alumnos
          <AlumnosManager isAdmin={false}/>
        )}

        {tab === "cursos" && (
          !convenioId ? (
            <SinConvenio texto="Selecciona un convenio docente asistencial para gestionar los cursos"/>
          ) : (
            <CursosManager
              convenioId={convenioId} convenioNombre={convenioNombre}
              areaId="" areaNombre=""
              isAdmin={false}
            />
          )
        )}

        {tab === "internos" && (
          !convenioId ? (
            <SinConvenio texto="Selecciona un convenio docente asistencial para gestionar los internos"/>
          ) : (
            <InternosManager
              convenioId={convenioId} convenioNombre={convenioNombre}
              isAdmin={false}
            />
          )
        )}

        {tab === "residentes" && (
          !convenioId ? (
            <SinConvenio texto="Selecciona un convenio docente asistencial para gestionar los residentes"/>
          ) : (
            <ResidentesManager convenioId={convenioId} convenioNombre={convenioNombre} isAdmin={false}/>
          )
        )}

        {tab === "rotaciones" && (
          !convenioId ? (
            <SinConvenio texto="Selecciona un convenio docente asistencial para gestionar las rotaciones"/>
          ) : (
            <RotacionesManager convenioId={convenioId} convenioNombre={convenioNombre} isAdmin={false}/>
          )
        )}

        {tab === "sedes" && isAdmin && <SedesManager/>}
      </div>
    </div>
  );
}

function SinConvenio({ texto }: { texto: string }) {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏥</div>
      <p style={{ color: "#6C757D", fontSize: "1rem", maxWidth: 360, margin: "0 auto" }}>{texto}</p>
    </div>
  );
}