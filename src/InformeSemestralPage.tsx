import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState<number>(1);
  const [periodosDisponibles, setPeriodosDisponibles] = useState<string[]>([]);
  const [mostrarVista, setMostrarVista] = useState(false);

  // 🔹 Cargar duración del convenio y generar periodos
  useEffect(() => {
    const fetchConvenio = async () => {
      if (!convenioId) return;

      const { data, error } = await supabase
        .from("agreements")
        .select("duration_years, name")
        .eq("id", convenioId)
        .single();

      if (error) {
        console.error("Error al obtener convenio:", error);
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

  // 🔹 Guardar informe
  const handleGuardar = async () => {
    if (!convenioId) {
      alert("❌ No se encontró el ID del convenio.");
      return;
    }

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
      },
    ]);

    if (error) {
      alert("❌ Error al guardar el informe: " + error.message);
    } else {
      alert("✅ Informe guardado correctamente");
      navigate("/");
    }
  };

  // 🔹 Exportar a PDF
  const handleExportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Informe Semestral del Convenio", 14, 20);
    doc.setFontSize(12);
    doc.text(`Periodo: ${periodo}`, 14, 30);

    const contenido = [
      ["Resumen de actividades", resumen || "-"],
      ["Actividades principales", actividades || "-"],
      ["Logros obtenidos", logros || "-"],
      ["Dificultades encontradas", dificultades || "-"],
      ["Descripción general", descripcion || "-"],
    ];

    (doc as any).autoTable({
      startY: 40,
      head: [["Campo", "Contenido"]],
      body: contenido,
      styles: { cellPadding: 4, fontSize: 10, valign: "middle" },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
    });

    doc.save(`Informe_${periodo.replace(/\s+/g, "_")}.pdf`);
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

      {/* Si no está en vista previa, mostrar el formulario */}
      {!mostrarVista ? (
        <>
          <table
            className="table table-bordered align-middle"
            style={{
              border: "1px solid #ccc",
              backgroundColor: "#fafafa",
              borderRadius: "8px",
            }}
          >
            <tbody>
              <tr>
                <th style={{ width: "25%", backgroundColor: "#f5f7fa" }}>
                  Periodo del informe
                </th>
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
                <th style={{ backgroundColor: "#f5f7fa" }}>
                  Resumen de actividades realizadas
                </th>
                <td>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Describa brevemente las actividades realizadas durante el periodo."
                    value={resumen}
                    onChange={(e) => setResumen(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th style={{ backgroundColor: "#f5f7fa" }}>
                  Actividades principales
                </th>
                <td>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Detalle las principales actividades ejecutadas."
                    value={actividades}
                    onChange={(e) => setActividades(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th style={{ backgroundColor: "#f5f7fa" }}>Logros obtenidos</th>
                <td>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Indique los principales resultados o avances logrados."
                    value={logros}
                    onChange={(e) => setLogros(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th style={{ backgroundColor: "#f5f7fa" }}>
                  Dificultades encontradas
                </th>
                <td>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Describa los principales retos o limitaciones."
                    value={dificultades}
                    onChange={(e) => setDificultades(e.target.value)}
                  />
                </td>
              </tr>

              <tr>
                <th style={{ backgroundColor: "#f5f7fa" }}>
                  Descripción general
                </th>
                <td>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Agregue cualquier información adicional relevante."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-secondary me-3"
              onClick={() => navigate("/")}
            >
              🔙 Volver
            </button>
            <button
              className="btn btn-outline-primary me-3"
              onClick={() => setMostrarVista(true)}
            >
              👁️ Ver Informe
            </button>
            <button className="btn btn-primary" onClick={handleGuardar}>
              💾 Guardar Informe
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Vista previa del informe */}
          <div className="border p-4 bg-light rounded">
            <h4 className="text-center mb-4 text-primary">
              Vista Previa del Informe Semestral
            </h4>

            <table className="table table-bordered">
              <tbody>
                <tr>
                  <th style={{ width: "30%" }}>Periodo</th>
                  <td>{periodo}</td>
                </tr>
                <tr>
                  <th>Resumen de actividades</th>
                  <td>{resumen}</td>
                </tr>
                <tr>
                  <th>Actividades principales</th>
                  <td>{actividades}</td>
                </tr>
                <tr>
                  <th>Logros obtenidos</th>
                  <td>{logros}</td>
                </tr>
                <tr>
                  <th>Dificultades encontradas</th>
                  <td>{dificultades}</td>
                </tr>
                <tr>
                  <th>Descripción general</th>
                  <td>{descripcion}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-secondary me-3"
              onClick={() => setMostrarVista(false)}
            >
              ✏️ Editar
            </button>
            <button className="btn btn-success" onClick={handleExportarPDF}>
              🖨️ Exportar a PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}






