import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();

  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [periodosDisponibles, setPeriodosDisponibles] = useState<string[]>([]);
  const [informes, setInformes] = useState<any[]>([]);
  const [editandoInforme, setEditandoInforme] = useState<any | null>(null);
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [ultimoInforme, setUltimoInforme] = useState<any | null>(null);

  const puedeEditar = ["admin", "Administrador", "Admin", "internal", "interno"].includes(userRole);

  /* ---------------------------------------------------------
     🔹 FUNCIONES SEGURAS PARA SUMAR MESES (respeta días reales)
     --------------------------------------------------------- */
  function addMonthsSafe(date: Date, months: number) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const targetMonth = d.getMonth() + months;
    const targetYear = d.getFullYear() + Math.floor(targetMonth / 12);
    const finalMonth = ((targetMonth % 12) + 12) % 12;

    const lastDay = new Date(targetYear, finalMonth + 1, 0).getDate();
    const day = Math.min(d.getDate(), lastDay);

    return new Date(targetYear, finalMonth, day);
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  /* ---------------------------------------------------------
     🔹 OBTENER USUARIO Y ROL
     --------------------------------------------------------- */
  useEffect(() => {
    async function fetchUser() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.id) return;

      setUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      setUserRole(profile?.role || "externo");
    }

    fetchUser();
  }, []);

  /* ---------------------------------------------------------
     🔹 GENERAR PERIODOS DESDE signature_date
     --------------------------------------------------------- */
  useEffect(() => {
    if (!convenioId) return;

    async function cargarPeriodos() {
      const { data, error } = await supabase
        .from("agreements")
        .select("signature_date, duration_years")
        .eq("id", convenioId)
        .single();

      if (error || !data) return;

      const fechaFirma = new Date(data.signature_date);
      fechaFirma.setHours(0, 0, 0, 0);

      const años = data.duration_years;
      const totalPeriodos = años * 2;

      const periodos: string[] = [];

      let inicio = new Date(fechaFirma);

      for (let i = 1; i <= totalPeriodos; i++) {
        const fin = addMonthsSafe(inicio, 6);
        const etiqueta =
          `${formatDate(inicio)} - ${formatDate(fin)} (${Math.ceil(i / 2)}° año)`;

        periodos.push(etiqueta);

        inicio = fin;
      }

      setPeriodosDisponibles(periodos);
    }

    cargarPeriodos();
  }, [convenioId]);

  /* ---------------------------------------------------------
     🔹 CARGAR INFORMES EXISTENTES
     --------------------------------------------------------- */
  async function fetchInformes() {
    if (!convenioId) return;

    const { data } = await supabase
      .from("informes_semestrales")
      .select("*")
      .eq("convenio_id", convenioId)
      .order("created_at", { ascending: false });

    setInformes(data || []);
  }

  useEffect(() => {
    fetchInformes();
  }, [convenioId]);

  /* ---------------------------------------------------------
     🔹 GUARDAR / ACTUALIZAR INFORME
     --------------------------------------------------------- */
  async function handleGuardar() {
    if (!periodo) return alert("Debe seleccionar un periodo.");

    // 👉 Validación: evitar duplicado por usuario
    const { data: existente } = await supabase
      .from("informes_semestrales")
      .select("id")
      .eq("convenio_id", convenioId)
      .eq("user_id", userId)
      .eq("periodo", periodo)
      .maybeSingle();

    if (existente && !editandoInforme) {
      alert(
        "⚠ Ya registró un informe para este periodo. " +
        "Contacte al admin: convenios.medicina@unmsm.edu.pe"
      );
      return;
    }

    if (editandoInforme) {
      await supabase
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

      alert("Informe actualizado correctamente.");
      setEditandoInforme(null);
      fetchInformes();
      return;
    }

    await supabase.from("informes_semestrales").insert([
      {
        convenio_id: convenioId,
        user_id: userId,
        periodo,
        resumen,
        actividades,
        logros,
        dificultades,
        descripcion,
        created_at: new Date(),
      },
    ]);

    alert("Informe guardado correctamente.");
    fetchInformes();
  }

  /* ---------------------------------------------------------
     🔹 ELIMINAR INFORME
     --------------------------------------------------------- */
  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar informe?")) return;

    await supabase.from("informes_semestrales").delete().eq("id", id);

    alert("Informe eliminado.");
    fetchInformes();
  }

  /* ---------------------------------------------------------
     🔹 VER / EDITAR INFORME
     --------------------------------------------------------- */
  const verInforme = (inf: any) => {
    setUltimoInforme(inf);
    setMostrarInforme(true);
  };

  const editar = (inf: any) => {
    setPeriodo(inf.periodo);
    setResumen(inf.resumen);
    setActividades(inf.actividades);
    setLogros(inf.logros);
    setDificultades(inf.dificultades);
    setDescripcion(inf.descripcion);

    setEditandoInforme(inf);
    setMostrarInforme(false);
  };

  /* ---------------------------------------------------------
     🔹 RENDER
     --------------------------------------------------------- */
  return (
    <div className="container mt-5" style={{ maxWidth: "900px" }}>
      <h2 className="text-primary fw-bold mb-4">
        📝 Informe Semestral de Convenio
      </h2>

      {!mostrarInforme ? (
        <>
          {/* ------------------------ FORMULARIO ------------------------ */}
          <table className="table table-bordered">
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
                      <option key={i} value={p}>{p}</option>
                    ))}
                  </select>
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
            <div className="text-end mt-3">
              <button className="btn btn-primary" onClick={handleGuardar}>
                {editandoInforme ? "Actualizar Informe" : "Guardar Informe"}
              </button>
            </div>
          )}

          {/* ------------------------ LISTA INFORMES ------------------------ */}
          <hr className="my-5" />
          <h4 className="text-primary">📚 Informes Guardados</h4>

          <table className="table table-striped table-bordered mt-3">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Periodo</th>
                <th>Resumen</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {informes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No hay informes registrados.
                  </td>
                </tr>
              ) : (
                informes.map((inf) => (
                  <tr key={inf.id}>
                    <td>{new Date(inf.created_at).toLocaleDateString("es-PE")}</td>
                    <td>{inf.periodo}</td>
                    <td style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>
                      {inf.resumen}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline-info btn-sm me-2"
                        onClick={() => verInforme(inf)}
                      >
                        Ver
                      </button>

                      {puedeEditar && (
                        <>
                          <button
                            className="btn btn-outline-warning btn-sm me-2"
                            onClick={() => editar(inf)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleEliminar(inf.id)}
                          >
                            Eliminar
                          </button>
                        </>
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
          {/* ------------------------ VISTA DETALLADA ------------------------ */}
          <div className="border p-4 bg-light rounded">
            <h4 className="text-primary">📘 Informe Guardado</h4>
            <table className="table table-bordered mt-3">
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
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-end">
            <button className="btn btn-secondary" onClick={() => setMostrarInforme(false)}>
              Volver
            </button>
          </div>
        </>
      )}
    </div>
  );
}










