import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();

  // 🔒 Usuario
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // 🔹 Formulario
  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // 🔹 Periodos dinámicos
  const [periodosDisponibles, setPeriodosDisponibles] = useState<string[]>([]);

  // 🔹 Informes existentes
  const [informes, setInformes] = useState<any[]>([]);
  const [ultimoInforme, setUltimoInforme] = useState<any | null>(null);
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [editandoInforme, setEditandoInforme] = useState<any | null>(null);

  // 🔒 Permisos
  const puedeEditar = ["admin", "Admin", "Administrador"].includes(userRole);

  // -----------------------
  // Util helpers fechas
  // -----------------------
  const addMonths = (d: Date, months: number) => {
    const res = new Date(d.getTime());
    const day = res.getDate();
    res.setMonth(res.getMonth() + months);

    // Manejo de meses cortos: si cambiamos mes y el día se "recarga" (ej. 31 ene + 1 mes -> 3 mar),
    // forzamos al último día válido del mes objetivo si pasó.
    if (res.getDate() < day) {
      res.setDate(0); // vuelve al último día del mes anterior (efecto buscado)
    }
    return res;
  };

  const addDays = (d: Date, days: number) => {
    const r = new Date(d.getTime());
    r.setDate(r.getDate() + days);
    return r;
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });

  // ---------------------------------------------------------
  // 🔹 Obtener usuario y rol
  // ---------------------------------------------------------
  useEffect(() => {
    const fetchUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      setUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();

      setUserRole(profile?.role || "externo");
    };

    fetchUser();
  }, []);

  // ---------------------------------------------------------
  // 🔹 Cargar periodos dinámicos desde agreements.signature_date (CORREGIDO)
  // ---------------------------------------------------------
  useEffect(() => {
    const cargarPeriodos = async () => {
      if (!convenioId) return;

      const { data, error } = await supabase
        .from("agreements")
        .select("signature_date, duration_years")
        .eq("id", convenioId)
        .maybeSingle();

      if (error || !data) {
        console.error("Error al cargar convenio:", error);
        return;
      }

      // Validar fecha
      const signature = data.signature_date ? new Date(data.signature_date) : null;
      if (!signature || isNaN(signature.getTime())) {
        console.error("signature_date inválida en el convenio:", data.signature_date);
        return;
      }

      const duracionAnios: number = Number(data.duration_years ?? 1);

      const periodos: string[] = [];

      // inicio del primer periodo = fecha de firma (mismo día)
      let inicioPeriodo = new Date(signature);

      // Generamos duracionAnios * 2 periodos (cada periodo = 6 meses)
      const totalPeriodos = duracionAnios * 2;
      for (let i = 0; i < totalPeriodos; i++) {
        // fin = inicio + 6 meses - 1 día
        const finTentativo = addMonths(inicioPeriodo, 6);
        const finPeriodo = addDays(finTentativo, -1);

        // etiqueta amigable: "01/11/2025 - 30/04/2026 (1° año)"
        const etiqueta = `${formatDate(inicioPeriodo)} - ${formatDate(finPeriodo)} (${Math.ceil((i + 1) / 2)}° año)`;
        periodos.push(etiqueta);

        // siguiente inicio = finPeriodo + 1 día
        inicioPeriodo = addDays(finPeriodo, 1);
      }

      setPeriodosDisponibles(periodos);
    };

    cargarPeriodos();
  }, [convenioId]);

  // ---------------------------------------------------------
  // 🔹 Cargar informes registrados
  // ---------------------------------------------------------
  const fetchInformes = async () => {
    if (!convenioId) return;

    const { data, error } = await supabase
      .from("informes_semestrales")
      .select("*")
      .eq("convenio_id", convenioId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar informes:", error);
      setInformes([]);
    } else {
      setInformes(data || []);
    }
  };

  useEffect(() => {
    fetchInformes();
  }, [convenioId]);

  // ---------------------------------------------------------
  // 🔹 Guardar informe (con verificación de duplicado por user+periodo)
  // ---------------------------------------------------------
  const handleGuardar = async () => {
    if (!periodo) {
      alert("Debes seleccionar un periodo.");
      return;
    }

    // Verificar duplicado por usuario (mismo convenio, mismo periodo, mismo user)
    const { data: duplicado, error: errDup } = await supabase
      .from("informes_semestrales")
      .select("id")
      .eq("convenio_id", convenioId)
      .eq("user_id", userId)
      .eq("periodo", periodo)
      .maybeSingle();

    if (errDup) {
      console.error("Error verificando duplicado:", errDup);
      alert("Ocurrió un error al verificar duplicados.");
      return;
    }

    if (duplicado) {
      alert(
        "⚠️ Ya registraste un informe para este periodo.\n\nComunica a la UCRIGP: convenios.medicina@unmsm.edu.pe para solicitar rectificación."
      );
      return;
    }

    const { error } = await supabase.from("informes_semestrales").insert([
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

    if (error) {
      console.error("Error guardando informe:", error);
      alert("❌ Error al guardar el informe: " + error.message);
      return;
    }

    alert("✅ Informe guardado correctamente");
    // limpiar formulario
    setPeriodo("");
    setResumen("");
    setActividades("");
    setLogros("");
    setDificultades("");
    setDescripcion("");
    fetchInformes();
  };

  // ---------------------------------------------------------
  // 🔹 Eliminar informe (solo admin)
  // ---------------------------------------------------------
  const handleEliminar = async (id: string) => {
    if (!puedeEditar) {
      alert("Solo el administrador puede eliminar informes.");
      return;
    }
    if (!confirm("¿Seguro que deseas eliminar este informe?")) return;

    const { error } = await supabase.from("informes_semestrales").delete().eq("id", id);
    if (error) {
      console.error("Error eliminando informe:", error);
      alert("❌ Error al eliminar informe: " + error.message);
      return;
    }
    alert("✅ Informe eliminado correctamente");
    fetchInformes();
  };

  // ---------------------------------------------------------
  // Ver/Editar informes
  // ---------------------------------------------------------
  const verInforme = (inf: any) => {
    setUltimoInforme(inf);
    setMostrarInforme(true);
  };

  const editarInforme = (inf: any) => {
    setPeriodo(inf.periodo);
    setResumen(inf.resumen);
    setActividades(inf.actividades);
    setLogros(inf.logros);
    setDificultades(inf.dificultades);
    setDescripcion(inf.descripcion);
    setEditandoInforme(inf);
    setMostrarInforme(false);
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
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
                  <select className="form-select" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                    <option value="">Seleccione un periodo</option>
                    {periodosDisponibles.map((p, i) => (
                      <option key={i} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>

              <tr>
                <th>Resumen</th>
                <td>
                  <textarea className="form-control" rows={3} value={resumen} onChange={(e) => setResumen(e.target.value)} />
                </td>
              </tr>

              <tr>
                <th>Actividades</th>
                <td>
                  <textarea className="form-control" rows={3} value={actividades} onChange={(e) => setActividades(e.target.value)} />
                </td>
              </tr>

              <tr>
                <th>Logros</th>
                <td>
                  <textarea className="form-control" rows={3} value={logros} onChange={(e) => setLogros(e.target.value)} />
                </td>
              </tr>

              <tr>
                <th>Dificultades</th>
                <td>
                  <textarea className="form-control" rows={3} value={dificultades} onChange={(e) => setDificultades(e.target.value)} />
                </td>
              </tr>

              <tr>
                <th>Descripción</th>
                <td>
                  <textarea className="form-control" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex justify-content-end mt-4">
            <button className="btn btn-primary" onClick={handleGuardar}>
              💾 Guardar Informe
            </button>
          </div>

          <hr className="my-5" />
          <h4 className="text-primary fw-bold mb-3">📚 Informes Guardados</h4>

          <table className="table table-striped table-bordered align-middle">
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
                    <td>{inf.created_at ? new Date(inf.created_at).toLocaleDateString("es-PE") : "-"}</td>
                    <td>{inf.periodo}</td>
                    <td style={{ maxWidth: "300px", whiteSpace: "pre-wrap" }}>{inf.resumen}</td>
                    <td>
                      <button className="btn btn-outline-info btn-sm me-2" onClick={() => verInforme(inf)}>
                        👁️ Ver
                      </button>

                      {puedeEditar ? (
                        <>
                          <button className="btn btn-outline-warning btn-sm me-2" onClick={() => editarInforme(inf)}>
                            ✏️ Editar
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleEliminar(inf.id)}>
                            🗑️ Eliminar
                          </button>
                        </>
                      ) : null}
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









