import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export default function InformeSemestralPage() {
  const { convenioId } = useParams<{ convenioId: string }>();
  const navigate = useNavigate();

  const [periodo, setPeriodo] = useState("");
  const [resumen, setResumen] = useState("");
  const [actividades, setActividades] = useState("");
  const [logros, setLogros] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [verInforme, setVerInforme] = useState(false);

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
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Informe Semestral del Convenio", 14, 20);
    doc.setFontSize(12);
    doc.text(`Periodo: ${periodo}`, 14, 30);
    doc.text(`Fecha de creación: ${new Date().toLocaleDateString()}`, 14, 38);

    (doc as any).autoTable({
      startY: 50,
      head: [["Sección", "Descripción"]],
      body: [
        ["Resumen de Actividades", resumen || "-"],
        ["Actividades Principales", actividades || "-"],
        ["Logros Obtenidos", logros || "-"],
        ["Dificultades", dificultades || "-"],
        ["Descripción General", descripcion || "-"],
      ],
      styles: { fontSize: 11, cellPadding: 3, lineColor: 200, lineWidth: 0.2 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Informe_${periodo || "sin_periodo"}.pdf`);
  };

  const handleExportWord = async () => {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Informe Semestral del Convenio",
              heading: "Heading1",
            }),
            new Paragraph({ text: `Periodo: ${periodo}` }),
            new Paragraph({ text: " " }),
            new Paragraph({
              text: `Resumen: ${resumen || "-"}`,
            }),
            new Paragraph({
              text: `Actividades Principales: ${actividades || "-"}`,
            }),
            new Paragraph({
              text: `Logros Obtenidos: ${logros || "-"}`,
            }),
            new Paragraph({
              text: `Dificultades: ${dificultades || "-"}`,
            }),
            new Paragraph({
              text: `Descripción General: ${descripcion || "-"}`,
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Informe_${periodo || "sin_periodo"}.docx`);
  };

  return (
    <div className="container mt-4">
      <div className="card shadow p-4 border-0" style={{ borderRadius: "12px" }}>
        <h3 className="text-primary fw-bold mb-4">📝 Informe Semestral</h3>

        {/* 📋 FORMULARIO */}
        {!verInforme ? (
          <>
            <div className="mb-3">
              <label>Periodo del informe</label>
              <select
                className="form-select"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <option value="">Seleccione un periodo</option>
                <option value="Enero-Junio 1° año">Enero - Junio (1° año)</option>
                <option value="Julio-Diciembre 1° año">Julio - Diciembre (1° año)</option>
                <option value="Enero-Junio 2° año">Enero - Junio (2° año)</option>
                <option value="Julio-Diciembre 2° año">Julio - Diciembre (2° año)</option>
                <option value="Enero-Junio 3° año">Enero - Junio (3° año)</option>
                <option value="Julio-Diciembre 3° año">Julio - Diciembre (3° año)</option>
              </select>
            </div>

            <div className="mb-3">
              <label>Resumen de actividades realizadas</label>
              <textarea
                className="form-control"
                rows={3}
                value={resumen}
                onChange={(e) => setResumen(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label>Actividades principales</label>
              <textarea
                className="form-control"
                rows={3}
                value={actividades}
                onChange={(e) => setActividades(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label>Logros obtenidos</label>
              <textarea
                className="form-control"
                rows={3}
                value={logros}
                onChange={(e) => setLogros(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label>Dificultades encontradas</label>
              <textarea
                className="form-control"
                rows={3}
                value={dificultades}
                onChange={(e) => setDificultades(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label>Descripción general</label>
              <textarea
                className="form-control"
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="d-flex justify-content-end mt-4 gap-2">
              <button className="btn btn-secondary" onClick={() => navigate("/")}>
                🔙 Volver
              </button>
              <button className="btn btn-success" onClick={() => setVerInforme(true)}>
                👁️ Ver Informe
              </button>
              <button className="btn btn-primary" onClick={handleGuardar}>
                💾 Guardar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 📄 VISTA PREVIA DEL INFORME */}
            <div className="border p-3 bg-light rounded">
              <h5 className="fw-bold mb-3">📘 Vista previa del Informe</h5>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th style={{ width: "30%" }}>Periodo</th>
                    <td>{periodo}</td>
                  </tr>
                  <tr>
                    <th>Resumen de Actividades</th>
                    <td>{resumen}</td>
                  </tr>
                  <tr>
                    <th>Actividades Principales</th>
                    <td>{actividades}</td>
                  </tr>
                  <tr>
                    <th>Logros Obtenidos</th>
                    <td>{logros}</td>
                  </tr>
                  <tr>
                    <th>Dificultades</th>
                    <td>{dificultades}</td>
                  </tr>
                  <tr>
                    <th>Descripción General</th>
                    <td>{descripcion}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end mt-4 gap-2">
              <button className="btn btn-secondary" onClick={() => setVerInforme(false)}>
                ✏️ Editar
              </button>
              <button className="btn btn-danger" onClick={handleExportPDF}>
                📄 Exportar PDF
              </button>
              <button className="btn btn-info" onClick={handleExportWord}>
                📝 Exportar Word
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}







