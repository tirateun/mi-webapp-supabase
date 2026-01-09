// src/MovilidadForm.tsx
import { useEffect, useState } from "react";
import Select from "react-select";
import { supabase } from "./supabaseClient";
import countries from "./countries.json";

interface MovilidadFormProps {
  existingMovilidad?: any;
  onSave: () => void;
  onCancel: () => void;
}

interface Option {
  value: string;
  label: string;
}

export default function MovilidadForm({
  existingMovilidad,
  onSave,
  onCancel,
}: MovilidadFormProps) {
  const [loading, setLoading] = useState(false);

  // Datos del estudiante
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");

  // Escuela y nivel
  const [escuela, setEscuela] = useState("");
  const [nivelAcademico, setNivelAcademico] = useState("");
  const [programa, setPrograma] = useState("");
  const [cicloAcademico, setCicloAcademico] = useState("");

  // Convenio y responsable
  const [convenios, setConvenios] = useState<any[]>([]);
  const [selectedConvenio, setSelectedConvenio] = useState<string>("");
  const [responsables, setResponsables] = useState<any[]>([]);
  const [selectedResponsable, setSelectedResponsable] = useState<string>("");

  // Destino
  const [destinationPlace, setDestinationPlace] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [destinationCity, setDestinationCity] = useState("");

  // Fechas
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationMonths, setDurationMonths] = useState<number>(0);

  // Tipo y notas
  const [mobilityType, setMobilityType] = useState("Intercambio");
  const [notes, setNotes] = useState("");

  const escuelas = [
    "Medicina",
    "Enfermería",
    "Nutrición",
    "Obstetricia",
    "Tecnología Médica",
  ];

  const nivelesAcademicos = [
    "Pregrado",
    "Maestría",
    "Doctorado",
    "Segunda Especialidad",
    "Residentado",
  ];

  const tiposMovilidad = [
    "Intercambio",
    "Pasantía",
    "Investigación",
    "Rotación",
  ];

  const ciclosAcademicos = [
    "2025-1",
    "2025-2",
    "2024-1",
    "2024-2",
    "2023-1",
    "2023-2",
  ];

  useEffect(() => {
    fetchConvenios();
    fetchResponsables();

    if (existingMovilidad) {
      // Cargar datos existentes
      setStudentName(existingMovilidad.student_name || "");
      setStudentCode(existingMovilidad.student_code || "");
      setStudentEmail(existingMovilidad.student_email || "");
      setStudentPhone(existingMovilidad.student_phone || "");
      setEscuela(existingMovilidad.escuela || "");
      setNivelAcademico(existingMovilidad.nivel_academico || "");
      setPrograma(existingMovilidad.programa || "");
      setCicloAcademico(existingMovilidad.ciclo_academico || "");
      setSelectedConvenio(existingMovilidad.agreement_id || "");
      setSelectedResponsable(existingMovilidad.responsible_id || "");
      setDestinationPlace(existingMovilidad.destination_place || "");
      setDestinationCountry(existingMovilidad.destination_country || "");
      setDestinationCity(existingMovilidad.destination_city || "");
      setStartDate(existingMovilidad.start_date || "");
      setEndDate(existingMovilidad.end_date || "");
      setMobilityType(existingMovilidad.mobility_type || "Intercambio");
      setNotes(existingMovilidad.notes || "");
    }
  }, [existingMovilidad]);

  useEffect(() => {
    // Calcular duración cuando cambien las fechas
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      setDurationMonths(diffMonths);
    }
  }, [startDate, endDate]);

  async function fetchConvenios() {
    try {
      // Solo convenios tipo "Movilidad académica"
      const { data, error } = await supabase
        .from("agreements")
        .select("id, name")
        .contains("tipo_convenio", ["Movilidad académica"])
        .eq("estado", "ACTIVO")
        .order("name");

      if (error) throw error;
      setConvenios(data || []);
    } catch (err) {
      console.error("Error fetching convenios:", err);
    }
  }

  async function fetchResponsables() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "internal")
        .order("full_name");

      if (error) throw error;
      setResponsables(data || []);
    } catch (err) {
      console.error("Error fetching responsables:", err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!selectedConvenio) {
        alert("⚠️ Debe seleccionar un convenio");
        setLoading(false);
        return;
      }

      if (!selectedResponsable) {
        alert("⚠️ Debe seleccionar un responsable interno");
        setLoading(false);
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
        alert("⚠️ La fecha de fin debe ser posterior a la fecha de inicio");
        setLoading(false);
        return;
      }

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      const payload = {
        agreement_id: selectedConvenio,
        student_name: studentName.trim(),
        student_code: studentCode.trim() || null,
        student_email: studentEmail.trim() || null,
        student_phone: studentPhone.trim() || null,
        escuela,
        nivel_academico: nivelAcademico,
        programa: programa.trim() || null,
        ciclo_academico: cicloAcademico || null,
        responsible_id: selectedResponsable,
        destination_place: destinationPlace.trim(),
        destination_country: destinationCountry,
        destination_city: destinationCity.trim() || null,
        start_date: startDate,
        end_date: endDate,
        mobility_type: mobilityType,
        status: "Pendiente",
        notes: notes.trim() || null,
        created_by: profile?.id,
      };

      if (existingMovilidad) {
        // Actualizar
        const { error } = await supabase
          .from("movilidades")
          .update(payload)
          .eq("id", existingMovilidad.id);

        if (error) throw error;
        alert("✅ Movilidad actualizada correctamente");
      } else {
        // Crear
        const { error } = await supabase.from("movilidades").insert([payload]);

        if (error) throw error;
        alert("✅ Movilidad registrada correctamente");
      }

      onSave();
    } catch (err: any) {
      console.error("Error saving movilidad:", err);
      alert("❌ Error al guardar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">
            {existingMovilidad ? "✏️ Editar Movilidad" : "🌍 Registrar Nueva Movilidad"}
          </h4>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* CONVENIO */}
            <div className="mb-3">
              <label className="form-label fw-bold">Convenio de Movilidad Académica *</label>
              <Select
                options={convenios.map((c) => ({ value: c.id, label: c.name }))}
                value={
                  selectedConvenio
                    ? {
                        value: selectedConvenio,
                        label: convenios.find((c) => c.id === selectedConvenio)?.name || "",
                      }
                    : null
                }
                onChange={(option) => setSelectedConvenio(option?.value || "")}
                placeholder="Buscar convenio..."
                noOptionsMessage={() => "No hay convenios de movilidad disponibles"}
                isClearable
              />
              {convenios.length === 0 && (
                <small className="text-danger">
                  No hay convenios tipo "Movilidad académica" registrados
                </small>
              )}
            </div>

            <hr className="my-4" />

            {/* DATOS DEL ESTUDIANTE */}
            <h5 className="mb-3">🎓 Datos del Estudiante</h5>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nombre completo *</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Código de alumno</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="Ej: 20201234"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="estudiante@unmsm.edu.pe"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  placeholder="+51 999 999 999"
                />
              </div>
            </div>

            <hr className="my-4" />

            {/* ESCUELA Y NIVEL ACADÉMICO */}
            <h5 className="mb-3">🏫 Escuela y Nivel Académico</h5>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Escuela *</label>
                <select
                  className="form-select"
                  value={escuela}
                  onChange={(e) => setEscuela(e.target.value)}
                  required
                >
                  <option value="">Seleccione escuela...</option>
                  {escuelas.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Nivel Académico *</label>
                <select
                  className="form-select"
                  value={nivelAcademico}
                  onChange={(e) => setNivelAcademico(e.target.value)}
                  required
                >
                  <option value="">Seleccione nivel...</option>
                  {nivelesAcademicos.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Programa/Carrera</label>
                <input
                  type="text"
                  className="form-control"
                  value={programa}
                  onChange={(e) => setPrograma(e.target.value)}
                  placeholder="Ej: Medicina Humana"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Ciclo Académico</label>
                <select
                  className="form-select"
                  value={cicloAcademico}
                  onChange={(e) => setCicloAcademico(e.target.value)}
                >
                  <option value="">Seleccione ciclo...</option>
                  {ciclosAcademicos.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="my-4" />

            {/* RESPONSABLE INTERNO */}
            <h5 className="mb-3">👤 Responsable Interno</h5>

            <div className="mb-3">
              <label className="form-label">Responsable asignado *</label>
              <Select
                options={responsables.map((r) => ({
                  value: r.id,
                  label: `${r.full_name} (${r.email})`,
                }))}
                value={
                  selectedResponsable
                    ? {
                        value: selectedResponsable,
                        label:
                          responsables.find((r) => r.id === selectedResponsable)?.full_name ||
                          "",
                      }
                    : null
                }
                onChange={(option) => setSelectedResponsable(option?.value || "")}
                placeholder="Buscar responsable..."
                noOptionsMessage={() => "No hay responsables disponibles"}
                isClearable
              />
              <small className="text-muted">
                Este responsable será el encargado de subir el informe de viaje
              </small>
            </div>

            <hr className="my-4" />

            {/* DESTINO */}
            <h5 className="mb-3">🌍 Destino</h5>

            <div className="mb-3">
              <label className="form-label">Universidad/Institución Destino *</label>
              <input
                type="text"
                className="form-control"
                value={destinationPlace}
                onChange={(e) => setDestinationPlace(e.target.value)}
                placeholder="Ej: Universidad de Chile"
                required
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">País *</label>
                <select
                  className="form-select"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                  required
                >
                  <option value="">Seleccione país...</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Ciudad</label>
                <input
                  type="text"
                  className="form-control"
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="Ej: Santiago"
                />
              </div>
            </div>

            <hr className="my-4" />

            {/* FECHAS */}
            <h5 className="mb-3">📅 Fechas</h5>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Fecha de inicio *</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">Fecha de fin *</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {durationMonths > 0 && (
              <div className="alert alert-info">
                ⏱️ <strong>Duración calculada:</strong> {durationMonths}{" "}
                {durationMonths === 1 ? "mes" : "meses"}
              </div>
            )}

            <hr className="my-4" />

            {/* TIPO Y NOTAS */}
            <h5 className="mb-3">📝 Información Adicional</h5>

            <div className="mb-3">
              <label className="form-label">Tipo de movilidad</label>
              <select
                className="form-select"
                value={mobilityType}
                onChange={(e) => setMobilityType(e.target.value)}
              >
                {tiposMovilidad.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Notas adicionales</label>
              <textarea
                className="form-control"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones, requisitos especiales, etc."
              />
            </div>

            {/* BOTONES */}
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Guardando..." : existingMovilidad ? "Actualizar" : "Registrar"}{" "}
                Movilidad
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
