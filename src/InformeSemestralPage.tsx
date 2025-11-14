// InformeSemestralPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  // estado de usuario y rol
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // estados del formulario
  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState<number>(1);
  const [periodosDisponibles, setPeriodosDisponibles] = useState<string[]>([]);
  const [signatureDate, setSignatureDate] = useState<string | null>(null);

  // informes y UI
  const [informes, setInformes] = useState<any[]>([]);
  const [ultimoInforme, setUltimoInforme] = useState<any | null>(null);
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [editandoInforme, setEditandoInforme] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // permisos
  const puedeEditar = ["admin", "Admin", "Administrador", "interno", "internal"].includes(userRole);
  const esAdmin = ["admin", "Admin", "Administrador"].includes(userRole);

  // ---------- utilidades de fechas ----------
  const addMonths = (d: Date, months: number) => {
    const copy = new Date(d.getTime());
    const day = copy.getDate();
    copy.setMonth(copy.getMonth() + months);

    // si al agregar meses se pasó al mes siguiente por días (ej 31 ene + 1 mes -> 3 mar),
    // ajustamos para quedarnos en el último día válido del mes anterior.
    if (copy.getDate() < day) {
      copy.setDate(0); // último día del mes anterior
    }
    return copy;
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });

  // ---------- obtener usuario y rol ----------
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user;
        if (userError || !user) {
          console.error("No se encontró usuario:", userError);
          return;
        }
        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error al obtener el rol del usuario:", profileError);
        } else {
          setUserRole(profile?.role || "externo");
        }
      } catch (err) {
        console.error("Error al obtener usuario/rol:", err);
      }
    };

    fetchUserRole();
  }, []);

  // ---------- cargar datos del convenio (signature_date + duration) y generar periodos ----------
  useEffect(() => {
    const fetchConvenio = async () => {
      if (!convenioId) return;
      try {
        const { data, error } = await supabase
          .from("agreements")
          .select("signature_date, duration_years")
          .eq("id", convenioId)
          .single();

        if (error) {
          console.error("Error al obtener duración del convenio:", error);
          // fallback: generar semestres por defecto
          generateDefaultPeriods(1, new Date());
          return;
        }

        const años = data?.duration_years || 1;
        setDuracion(años);

        // signature_date puede venir nulo; proteger
        const sig = data?.signature_date ? new Date(data.signature_date) : null;
        setSignatureDate(sig ? sig.toISOString() : null);

        if (sig) {
          generatePeriodsFromSignature(sig, años);
        } else {
          // fallback: semestres por año calendarizado (ene-jun, jul-dic)
          generateDefaultPeriods(años, new Date());
        }
      } catch (err) {
        console.error("Error fetchConvenio:", err);
      }
    };

    fetchConvenio();
  }, [convenioId]);

  // genera periodos desde fecha de firma: cada periodo = inicio incluido, fin = inicio + 6 meses - 1 día
  const generatePeriodsFromSignature = (startDate: Date, años: number) => {
    const periodos: string[] = [];
    let inicio = new Date(startDate);

    const totalPeriods = años * 2;
    for (let i = 0; i < totalPeriods; i++) {
      const finCandidate = addMonths(inicio, 6);
      // restar 1 día para que el periodo sea inclusive
      const fin = new Date(finCandidate);
      fin.setDate(fin.getDate() - 1);

      const yearNumber = Math.ceil((i + 1) / 2);
      const label = `${formatDate(inicio)} - ${formatDate(fin)} (${yearNumber}° año)`;
      periodos.push(label);

      // siguiente inicio = fin + 1 día
      const siguienteInicio = new Date(fin);
      siguienteInicio.setDate(siguienteInicio.getDate() + 1);
      inicio = siguienteInicio;
    }

    setPeriodosDisponibles(periodos);
  };

  // fallback: periodos estándar por semestres calendario (ene-jun, jul-dic)
  const generateDefaultPeriods = (años: number, reference: Date) => {
    const periodos: string[] = [];
    const currentYear = reference.getFullYear();
    for (let i = 0; i < años; i++) {
      // Enero-Junio
      periodos.push(`01/01/${currentYear + i} - 30/06/${currentYear + i} (${i + 1}° año)`);
      // Julio-Diciembre
      periodos.push(`01/07/${currentYear + i} - 31/12/${currentYear + i} (${i + 1}° año)`);
    }
    setPeriodosDisponibles(periodos);
  };

  // ---------- cargar informes y mapear autor (full_name) ----------
  const fetchInformes = async () => {
    if (!convenioId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("informes_semestrales")
        .select("*")
        .eq("convenio_id", convenioId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error al cargar informes:", error);
        setInformes([]);
      } else {
        const rows = data || [];
        // obtener los user_ids únicos
        const userIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
        let usersMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);
          usersMap = (users || []).reduce((acc: any, u: any) => {
            acc[u.id] = u.full_name;
            return acc;
          }, {});
        }

        // anexo full_name a cada informe
        const enriched = rows.map((r: any) => ({
          ...r,
          user_full_name: r.user_id ? usersMap[r.user_id] || "Usuario" : "Usuario",
        }));

        setInformes(enriched);
      }
    } catch (err) {
      console.error("Error fetchInformes:", err);
      setInformes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInformes();
  }, [convenioId, userRole, userId]);

  // ---------- guardar (insert / update) ----------
  const handleGuardar = async () => {
    if (!convenioId) {
      alert("❌ No se encontró el ID del convenio.");
      return;
    }
    if (!periodo) {
      alert("⚠️ Debes seleccionar un periodo antes de guardar.");
      return;
    }
    setLoading(true);

    try {
      // obtener user actual
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        alert("Error: usuario no autenticado.");
        setLoading(false);
        return;
      }

      // si estamos editando: permitir solo al autor o admin
      if (editandoInforme) {
        if (!esAdmin && editandoInforme.user_id !== uid) {
          alert("No tienes permisos para editar este informe.");
          setLoading(false);
          return;
        }
        const { error } = await supabase
          .from("informes_semestrales")
          .update({
            periodo,
            resumen,
            actividades,
            logros,
            dificultades,
            descripcion,
            updated_at: new Date(),
          })
          .eq("id", editandoInforme.id);

        if (error) {
          console.error("Error actualizar informe:", error);
          alert("❌ Error al actualizar: " + error.message);
        } else {
          alert("✅ Informe actualizado correctamente");
          setEditandoInforme(null);
          limpiarFormulario();
          fetchInformes();
        }
        setLoading(false);
        return;
      }

      // validar que el usuario no haya subido ya informe para este periodo (cada responsable una vez por periodo)
      const { data: existente, error: checkErr } = await supabase
        .from("informes_semestrales")
        .select("id")
        .eq("convenio_id", convenioId)
        .eq("user_id", uid)
        .eq("periodo", periodo)
        .maybeSingle();

      if (checkErr) {
        console.error("Error validación existente:", checkErr);
        alert("Error al validar informe existente.");
        setLoading(false);
        return;
      }

      if (existente) {
        alert(
          "⚠️ Ya registraste un informe para este periodo. Si necesitas rectificar, comunícate con la UCRIGP: convenios.medicina@unmsm.edu.pe"
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("informes_semestrales").insert([
        {
          convenio_id: convenioId,
          user_id: uid,
          periodo,
          resumen,
          actividades,
          logros,
          dificultades,
          descripcion,
          created_at: new Date(),
        },
      ]);

      if (error) {
        console.error("Error al guardar informe:", error);
        alert("❌ Error al guardar el informe: " + error.message);
      } else {
        alert("✅ Informe guardado correctamente");
        limpiarFormulario();
        fetchInformes();
      }
    } catch (err) {
      console.error("Error handleGuardar:", err);
      alert("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- eliminar (solo admin) ----------
  const handleEliminar = async (id: string) => {
    if (!esAdmin) {
      alert("Solo el administrador puede eliminar informes. Comuníquese con convenios.medicina@unmsm.edu.pe");
      return;
    }
    if (!confirm("¿Seguro que deseas eliminar este informe?")) return;

    const { error } = await supabase.from("informes_semestrales").delete().eq("id", id);

    if (error) {
      console.error("Error eliminar informe:", error);
      alert("❌ Error al eliminar informe: " + error.message);
    } else {
      alert("✅ Informe eliminado correctamente");
      fetchInformes();
    }
  };

  // ver, editar, limpiar
  const verInforme = (informe: any) => {
    setUltimoInforme(informe);
    setMostrarInforme(true);
  };

  const editarInforme = (informe: any) => {
    // solo autor o admin
    if (!esAdmin && informe.user_id !== userId) {
      alert("No tienes permisos para editar este informe.");
      return;
    }
    setPeriodo(informe.periodo);
    setResumen(informe.resumen || "");
    setActividades(informe.actividades || "");
    setLogros(informe.logros || "");
    setDificultades(informe.dificultades || "");
    setDescripcion(informe.descripcion || "");
    setEditandoInforme(informe);
    setMostrarInforme(false);
  };

  const limpiarFormulario = () => {
    setPeriodo("");
    setResumen("");
    setActividades("");
    setLogros("");
    setDificultades("");
    setDescripcion("");
  };

  // ---------- render ----------
  return (
    <div
      className="container mt-5"
      style={{
        maxWidth: "900px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "40px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 className="text-center mb-4 text-primary fw-bold">📝 Informe Semestral de Convenio</h2>

      {!mostrarInforme ? (
        <>
          <table className="table table-bordered align-middle">
            <tbody>
              <tr>
                <th style={{ width: "25%" }}>Periodo</th>
                <td>
                  <select
                    className="form-select"
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                  >
                    <option value="">Seleccione un periodo</option>
                    {periodosDisponibles.map((p, i) => (
                      <option key={i} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {signatureDate && (
                    <small className="text-muted d-block mt-1">
                      Fecha de inicio del convenio: {new Date(signatureDate).toLocaleDateString("es-PE")}
                    </small>
                  )}
                </td>
              </tr>

              <tr>
                <th>Resumen</th>
                <td>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={resumen}
                    onChange={(e) => setResumen(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th>Actividades</th>
                <td>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={actividades}
                    onChange={(e) => setActividades(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th>Logros</th>
                <td>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={logros}
                    onChange={(e) => setLogros(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th>Dificultades</th>
                <td>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={dificultades}
                    onChange={(e) => setDificultades(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th>Descripción</th>
                <td>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {puedeEditar && (
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
                {editandoInforme ? "💾 Actualizar Informe" : "💾 Guardar Informe"}
              </button>
            </div>
          )}

          <hr className="my-5" />
          <h4 className="text-primary fw-bold mb-3">📚 Informes Guardados</h4>

          <table className="table table-striped table-bordered align-middle">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Periodo</th>
                <th>Resumen</th>
                <th>Responsable</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {informes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    No hay informes registrados.
                  </td>
                </tr>
              ) : (
                informes.map((inf) => (
                  <tr key={inf.id}>
                    <td>{inf.created_at ? new Date(inf.created_at).toLocaleDateString("es-PE") : "-"}</td>
                    <td>{inf.periodo}</td>
                    <td style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>{inf.resumen}</td>
                    <td>{inf.user_full_name || "Usuario"}</td>
                    <td>
                      <button className="btn btn-outline-info btn-sm me-2" onClick={() => verInforme(inf)}>
                        👁️ Ver
                      </button>
                      {/* editar solo autor o admin */}
                      {(esAdmin || inf.user_id === userId) && (
                        <button className="btn btn-outline-warning btn-sm me-2" onClick={() => editarInforme(inf)}>
                          ✏️ Editar
                        </button>
                      )}
                      {/* eliminar solo admin */}
                      {esAdmin && (
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleEliminar(inf.id)}>
                          🗑️ Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <div className="border p-4 bg-light rounded">
            <h4 className="text-center mb-4 text-primary">📘 Informe Guardado</h4>
            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th>Periodo</th>
                  <td>{ultimoInforme?.periodo}</td>
                </tr>
                <tr>
                  <th>Resumen</th>
                  <td>{ultimoInforme?.resumen}</td>
                </tr>
                <tr>
                  <th>Actividades</th>
                  <td>{ultimoInforme?.actividades}</td>
                </tr>
                <tr>
                  <th>Logros</th>
                  <td>{ultimoInforme?.logros}</td>
                </tr>
                <tr>
                  <th>Dificultades</th>
                  <td>{ultimoInforme?.dificultades}</td>
                </tr>
                <tr>
                  <th>Descripción</th>
                  <td>{ultimoInforme?.descripcion}</td>
                </tr>
                <tr>
                  <th>Responsable</th>
                  <td>{ultimoInforme?.user_full_name || "Usuario"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-secondary" onClick={() => setMostrarInforme(false)}>
              🔙 Volver
            </button>
          </div>
        </>
      )}
    </div>
  );
}











