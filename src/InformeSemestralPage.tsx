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
  // 🔹 Cargar periodos dinámicos desde agreements.signature_date
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

      const fechaFirma = new Date(data.signature_date);
      const duracionAnios = data.duration_years ?? 1;

      const periodos: string[] = [];
      let inicio = new Date(fechaFirma);

      for (let i = 1; i <= duracionAnios * 2; i++) {
        const fin = new Date(inicio);
        fin.setMonth(fin.getMonth() + 6);

        const etiqueta = `${inicio.toLocaleDateString("es-PE")} - ${fin.toLocaleDateString("es-PE")} (${Math.ceil(i / 2)}° año)`;

        periodos.push(etiqueta);

        inicio = fin;
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

    const { data } = await supabase
      .from("informes_semestrales")
      .select("*")
      .eq("convenio_id", convenioId)
      .order("created_at", { ascending: false });

    setInformes(data || []);
  };

  useEffect(() => {
    fetchInformes();
  }, [convenioId]);

  // ---------------------------------------------------------
  // 🔹 Guardar informe
  // ---------------------------------------------------------
  const handleGuardar = async () => {
    if (!periodo) {
      alert("Debes seleccionar un periodo.");
      return;
    }

    // ❗ Validar duplicado por usuario
    const { data: duplicado } = await supabase
      .from("informes_semestrales")
      .select("id")
      .eq("convenio_id", convenioId)
      .eq("user_id", userId)
      .eq("periodo", periodo)
      .maybeSingle();

    if (duplicado) {
      alert(
        "⚠️ Ya registraste un informe para este periodo.\n\nComunica a la UCRIGP: convenios.medicina@unmsm.edu.pe"
      );
      return;
    }

    // Insertar
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
      alert("❌ Error al guardar: " + error.message);
      return;
    }

    alert("✅ Informe guardado correctamente");
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

    const { error } = await supabase
      .from("informes_semestrales")
      .delete()
      .eq("id", id);

    if (error) {
      alert("❌ Error al eliminar: " + error.message);
      return;
    }

    alert("🗑️ Informe eliminado");
    fetchInformes();
  };

  // ---------------------------------------------------------
  // 🔹 Ver/Editar informes
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
  // 🔹 UI
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
      <h2 className="text-center mb-4 text-primary fw-bold">
        📝 Informe Semestral de Convenio
      </h2>

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
                        👁️ Ver
                      </button>

                      {puedeEditar ? (
                        <>
                          <button
                            className="btn btn-outline-warning btn-sm me-2"
                            onClick={() => editarInforme(inf)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleEliminar(inf.id)}
                          >
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








