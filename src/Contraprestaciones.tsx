// src/Contraprestaciones.tsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "./supabaseClient";

type YearStatus = 'pasado' | 'vigente' | 'futuro';

interface YearOption {
  id: string;
  year_number: number;
  year_start: string;
  year_end: string;
  status: YearStatus;
  icon: string;
  statusLabel: string;
}

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

  // 🆕 Estado para rol del usuario
  const [userRole, setUserRole] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState(true);

  /* =========================
     OBTENER ROL DEL USUARIO
     ========================= */
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) {
          console.error("Error obteniendo usuario:", userErr);
          setLoadingUser(false);
          return;
        }

        const user = userData?.user;
        if (!user) {
          setLoadingUser(false);
          return;
        }

        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) {
          console.error("Error obteniendo perfil:", profileErr);
        } else if (profileData) {
          setUserRole(profileData.role || "");
        }
      } catch (err) {
        console.error("Error en getUserRole:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    getUserRole();
  }, []);

  /* =========================
     VALIDAR SI ES ADMIN
     ========================= */
  const isAdmin = useMemo(() => {
    return ["admin", "Admin", "Administrador"].includes(userRole);
  }, [userRole]);

  /* =========================
     HELPERS: Estado de año
     ========================= */
  const getYearStatus = (yearStart: string, yearEnd: string): YearStatus => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const inicio = new Date(yearStart);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(yearEnd);
    fin.setHours(0, 0, 0, 0);
    
    if (hoy < inicio) {
      return 'futuro';
    } else if (hoy > fin) {
      return 'pasado';
    } else {
      return 'vigente';
    }
  };

  const getYearIcon = (status: YearStatus): string => {
    switch (status) {
      case 'pasado': return '⏸️';
      case 'vigente': return '✅';
      case 'futuro': return '📅';
    }
  };

  const getYearLabel = (status: YearStatus): string => {
    switch (status) {
      case 'pasado': return '(Vencido)';
      case 'vigente': return '(Vigente)';
      case 'futuro': return '(Próximo)';
    }
  };

  /* =========================
     AÑOS PROCESADOS con estado
     ========================= */
  const yearOptions = useMemo((): YearOption[] => {
    return years.map((year) => {
      const status = getYearStatus(year.year_start, year.year_end);
      const icon = getYearIcon(status);
      const statusLabel = getYearLabel(status);
      
      return {
        id: year.id,
        year_number: year.year_number,
        year_start: year.year_start,
        year_end: year.year_end,
        status,
        icon,
        statusLabel,
      };
    });
  }, [years]);

  /* =========================
     AÑOS AGRUPADOS por estado
     ========================= */
  const groupedYears = useMemo(() => {
    return {
      vigente: yearOptions.filter(y => y.status === 'vigente'),
      futuro: yearOptions.filter(y => y.status === 'futuro'),
      pasado: yearOptions.filter(y => y.status === 'pasado'),
    };
  }, [yearOptions]);

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
     AÑOS DEL CONVENIO
     ========================= */
  async function loadYears() {
    try {
      setLoadingYears(true);

      const { data, error } = await supabase
        .from("agreement_years")
        .select("id, year_number, year_start, year_end")
        .eq("agreement_id", agreementId)
        .order("year_number", { ascending: true });

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        setYears(data);
        
        const vigente = data.find(y => {
          const status = getYearStatus(y.year_start, y.year_end);
          return status === 'vigente';
        });
        
        if (vigente) {
          setSelectedYear(vigente.id);
        } else {
          const sorted = [...data].sort((a, b) => b.year_number - a.year_number);
          setSelectedYear(sorted[0].id);
        }
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
     AGREGAR - 🔒 SOLO ADMIN
     ========================= */
  async function addItem() {
    // 🔒 VALIDACIÓN DE PERMISOS
    if (!isAdmin) {
      alert("❌ Solo los administradores pueden agregar contraprestaciones.");
      return;
    }

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
     ELIMINAR - 🔒 SOLO ADMIN
     ========================= */
  async function deleteItem(id: string) {
    // 🔒 VALIDACIÓN DE PERMISOS
    if (!isAdmin) {
      alert("❌ Solo los administradores pueden eliminar contraprestaciones.");
      return;
    }

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
  if (loadingUser) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p>Cargando permisos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button className="mb-4 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400" onClick={onBack}>
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">Contraprestaciones</h1>

      {/* Selector de año con agrupación visual */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Año del convenio:</label>
        {loadingYears ? (
          <span>Cargando años...</span>
        ) : years.length === 0 ? (
          <span className="text-red-600">No hay años definidos</span>
        ) : (
          <select
            className="border px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {groupedYears.vigente.length > 0 && (
              <optgroup label="✅ Año vigente actual">
                {groupedYears.vigente.map((y) => (
                  <option 
                    key={y.id} 
                    value={y.id}
                    style={{
                      backgroundColor: '#d4edda',
                      color: '#155724',
                      fontWeight: 'bold'
                    }}
                  >
                    {y.icon} Año {y.year_number} — {formatDate(y.year_start)} / {formatDate(y.year_end)} {y.statusLabel}
                  </option>
                ))}
              </optgroup>
            )}

            {groupedYears.futuro.length > 0 && (
              <optgroup label="📅 Años próximos">
                {groupedYears.futuro.map((y) => (
                  <option 
                    key={y.id} 
                    value={y.id}
                    style={{
                      backgroundColor: '#fff3cd',
                      color: '#856404'
                    }}
                  >
                    {y.icon} Año {y.year_number} — {formatDate(y.year_start)} / {formatDate(y.year_end)} {y.statusLabel}
                  </option>
                ))}
              </optgroup>
            )}

            {groupedYears.pasado.length > 0 && (
              <optgroup label="⏸️ Años vencidos">
                {groupedYears.pasado.map((y) => (
                  <option 
                    key={y.id} 
                    value={y.id}
                    style={{
                      backgroundColor: '#f8f9fa',
                      color: '#6c757d',
                      opacity: 0.8
                    }}
                  >
                    {y.icon} Año {y.year_number} — {formatDate(y.year_start)} / {formatDate(y.year_end)} {y.statusLabel}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        )}
      </div>

      {/* Indicador visual del año seleccionado */}
      {selectedYear && yearOptions.length > 0 && (() => {
        const currentYear = yearOptions.find(y => y.id === selectedYear);
        if (!currentYear) return null;
        
        const badgeColors: Record<YearStatus, string> = {
          vigente: 'bg-green-100 text-green-800 border-green-300',
          futuro: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          pasado: 'bg-gray-100 text-gray-600 border-gray-300'
        };
        
        return (
          <div className={`mb-4 p-3 rounded-lg border-2 ${badgeColors[currentYear.status]}`}>
            <span className="font-semibold">
              {currentYear.icon} Trabajando en: Año {currentYear.year_number} {currentYear.statusLabel}
            </span>
            <span className="ml-2 text-sm">
              ({formatDate(currentYear.year_start)} al {formatDate(currentYear.year_end)})
            </span>
          </div>
        );
      })()}

      {/* Formulario - 🔒 SOLO VISIBLE PARA ADMIN */}
      {isAdmin ? (
        <div className="border-2 border-gray-300 p-4 rounded-lg mb-6 bg-gray-50">
          <h2 className="font-semibold mb-3 text-lg">Agregar contraprestación</h2>

          <select
            className="border px-3 py-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border px-3 py-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <input
            type="number"
            className="border px-3 py-2 w-full mb-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Unidades comprometidas"
            min={1}
            value={unidades}
            onChange={(e) => setUnidades(Number(e.target.value))}
          />

          <button
            onClick={addItem}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow"
          >
            ➕ Agregar
          </button>
        </div>
      ) : (
        <div className="border-2 border-yellow-300 p-4 rounded-lg mb-6 bg-yellow-50">
          <div className="text-center text-yellow-800">
            <p className="font-semibold text-lg mb-2">🔒 Permisos insuficientes</p>
            <p className="text-sm">Solo los administradores pueden agregar contraprestaciones.</p>
            <p className="text-xs mt-2 text-yellow-700">Tu rol actual: <strong>{userRole || "Sin rol"}</strong></p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-gray-300 shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 p-3 text-left">Tipo</th>
              <th className="border border-gray-300 p-3 text-left">Descripción</th>
              <th className="border border-gray-300 p-3 text-center">Unidades</th>
              {isAdmin && <th className="border border-gray-300 p-3 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="border border-gray-300 p-4 text-center text-gray-500">
                  No hay contraprestaciones registradas para este año
                </td>
              </tr>
            ) : (
              items.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">{i.tipo}</td>
                  <td className="border border-gray-300 p-3">{i.descripcion || '—'}</td>
                  <td className="border border-gray-300 p-3 text-center">{i.unidades_comprometidas}</td>
                  {isAdmin && (
                    <td className="border border-gray-300 p-3 text-center">
                      <button
                        className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => deleteItem(i.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}



