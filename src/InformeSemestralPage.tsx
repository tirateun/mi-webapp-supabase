import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  // 🔒 Estado de usuario y rol
  const [userRole, setUserRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // 🔹 Estados del formulario
  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState<number>(1);
  const [periodosDisponibles, setPeriodosDisponibles] = useState<string[]>([]);

  // 🔹 Estados de informes
  const [informes, setInformes] = useState<any[]>([]);
  const [ultimoInforme, setUltimoInforme] = useState<any | null>(null);
  const [mostrarInforme, setMostrarInforme] = useState(false);
  const [editandoInforme, setEditandoInforme] = useState<any | null>(null);

  // 🔒 Solo admin o interno/internal pueden editar/eliminar
  const puedeEditar = ["admin", "Admin", "Administrador", "interno", "internal"].includes(userRole);

  // 🧩 Obtener rol del usuario desde Supabase
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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
    };

    fetchUserRole();
  }, []);

  // 🔹 Cargar duración del convenio
  useEffect(() => {
    const fetchConvenio = async () => {
      if (!convenioId) return;

      const { data, error } = await supabase
        .from("agreements")
        .select("duration_years")
        .eq("id", convenioId)
        .single();

      if (error) {
        console.error("Error al obtener duración del convenio:", error);
      } else {
        const años = data?.duration_years || 1;
        setDuracion(años);

        const periodos: string[] = [];
        for (let i = 1; i <= años; i++) {
          periodos.push(`Enero-Junio ${i}° año`);
          periodos.push(`Julio-Diciembre ${i}° año`);
        }
        setPeriodosDisponibles(periodos);
      }
    };

    fetchConvenio();
  }, [convenioId]);

  // 🔹 Cargar informes existentes
  const fetchInformes = async () => {
    if (!convenioId) return;

    const { data, error } = await supabase
      .from("informes_semestrales")
      .select("*")
      .eq("convenio_id", convenioId)
      .order("created_at", { ascending: false });

    if (error) console.error("Error al cargar informes:", error);
    else setInformes(data || []);
  };

  useEffect(() => {
    fetchInformes();
  }, [convenioId]);

  // 🔹 Guardar o actualizar informe
  const handleGuardar = async () => {
    if (!convenioId) {
      alert("❌ No se encontró el ID del convenio.");
      return;
    }

    if (!periodo) {
      alert("⚠️ Debes seleccionar un periodo antes de guardar.");
      return;
    }

    if (editandoInforme) {
      const { error } = await supabase
        .from("informes_semestrales")
        .update({
          periodo,
          resumen,
          actividades,
          logros,
          dificultades,
          descripcion,
        })
        .eq("id", editandoInforme.id);

      if (error) alert("❌ Error al actualizar: " + error.message);
      else {
        alert("✅ Informe actualizado correctamente");
        setEditandoInforme(null);
        limpiarFormulario();
        fetchInformes();
      }
    } else {
      const { error } = await supabase.from("informes_semestrales").insert([
        {
          convenio_id: convenioId,
          periodo,
          resumen,
          actividades,
          logros,
          dificultades,
          descripcion,
          created_at: new Date(),
          creado_por: userId, // opcional: quién lo creó
        },
      ]);

      if (error) alert("❌ Error al guardar el informe: " + error.message);
      else {
        alert("✅ Informe guardado correctamente");
        limpiarFormulario();
        fetchInformes();
      }
    }
  };

  // 🔹 Eliminar informe
  const handleEliminar = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este informe?")) return;

    const { error } = await supabase
      .from("informes_semestrales")
      .delete()
      .eq("id", id);

    if (error) alert("❌ Error al eliminar informe: " + error.message);
    else {
      alert("✅ Informe eliminado correctamente");
      fetchInformes();
    }
  };

  // 🔹 Ver informe
  const verInforme = (informe: any) => {
    setUltimoInforme(informe);
    setMostrarInforme(true);
  };

  // 🔹 Editar informe
  const editarInforme = (informe: any) => {
    setPeriodo(informe.periodo);
    setResumen(informe.resumen);
    setActividades(informe.actividades);
    setLogros(informe.logros);
    setDificultades(informe.dificultades);
    setDescripcion(informe.descripcion);
    setEditandoInforme(informe);
    setMostrarInforme(false);
  };

  // 🔹 Limpiar formulario
  const limpiarFormulario = () => {
    setPeriodo("");
    setResumen("");
    setActividades("");
    setLogros("");
    setDificultades("");
    setDescripcion("");
  };

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

          {puedeEditar && (
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-primary" onClick={handleGuardar}>
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
                      {puedeEditar && (
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








