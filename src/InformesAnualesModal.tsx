// src/InformesAnualesModal.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface AgreementYear {
  id: string;
  agreement_id: string;
  year_number: number;
  year_start: string;
  year_end: string;
}

interface InformeAnual {
  id: string;
  convenio_id: string;
  year_id: string;
  contenido: string;
  dificultades: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  convenioId: string;
  year: AgreementYear;
  onSaved: () => void;
  editing?: InformeAnual | null;
}

export default function InformesAnualesModal({
  show,
  onClose,
  convenioId,
  year,
  onSaved,
  editing = null
}: Props) {
  const [contenido, setContenido] = useState("");
  const [dificultades, setDificultades] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    if (!show) return;
    
    fetchProfile();
    
    if (editing) {
      setContenido(editing.contenido || "");
      setDificultades(editing.dificultades || "");
    } else {
      setContenido("");
      setDificultades("");
    }
  }, [show, editing]);

  const fetchProfile = async () => {
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp?.user;
      
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(profileData);
    } catch (error) {
      console.error("Error cargando perfil:", error);
    }
  };

  const handleSave = async () => {
    if (!contenido || contenido.trim() === "") {
      alert("Por favor ingresa el contenido del informe");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        convenio_id: convenioId,
        year_id: year.id,
        contenido,
        dificultades: dificultades || null,
        created_by: profile?.id || null
      };

      if (editing && editing.id) {
        // Actualizar informe existente
        const { error } = await supabase
          .from("informes_anuales")
          .update({
            contenido,
            dificultades: dificultades || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", editing.id);

        if (error) throw error;
      } else {
        // Crear nuevo informe
        const { error } = await supabase
          .from("informes_anuales")
          .insert([payload]);

        if (error) throw error;
      }

      alert(`✅ Informe ${editing ? 'actualizado' : 'creado'} correctamente`);
      onSaved();
    } catch (error: any) {
      console.error("Error guardando informe:", error);
      alert("❌ Error al guardar: " + (error?.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="modal fade show d-block" 
      style={{ background: "rgba(0,0,0,0.5)" }} 
      tabIndex={-1}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header bg-primary text-white py-3">
            <div>
              <h4 className="modal-title mb-1 fw-bold">
                {editing ? "✏️ Editar Informe Anual" : "📄 Nuevo Informe Anual"}
              </h4>
              <small className="opacity-75">
                Año {year.year_number} ({formatFecha(year.year_start)} - {formatFecha(year.year_end)})
              </small>
              {profile && (
                <div>
                  <small className="opacity-75">
                    Responsable: <strong>{profile.full_name || profile.email}</strong>
                  </small>
                </div>
              )}
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <div className="row g-4">
              {/* Contenido Principal */}
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="mb-0 text-primary fw-semibold">
                      <i className="bi bi-file-text me-2"></i>
                      Contenido del Informe
                    </h6>
                  </div>
                  <div className="card-body">
                    <label className="form-label fw-semibold">
                      Descripción de actividades y resultados <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control shadow-sm"
                      rows={12}
                      value={contenido}
                      onChange={(e) => setContenido(e.target.value)}
                      placeholder="Describe las actividades realizadas durante el periodo, resultados obtenidos, metas alcanzadas..."
                      style={{
                        resize: "vertical",
                        minHeight: "200px",
                        fontSize: "0.95rem",
                        lineHeight: "1.6"
                      }}
                    />
                    <div className="form-text">
                      <i className="bi bi-info-circle me-1"></i>
                      Incluye detalles sobre las actividades realizadas, beneficiarios, impacto y resultados cuantitativos.
                    </div>
                  </div>
                </div>
              </div>

              {/* Dificultades/Observaciones */}
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <h6 className="mb-0 text-warning fw-semibold">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      Dificultades y Observaciones
                    </h6>
                  </div>
                  <div className="card-body">
                    <label className="form-label fw-semibold">
                      Desafíos encontrados y recomendaciones
                    </label>
                    <textarea
                      className="form-control shadow-sm"
                      rows={6}
                      value={dificultades}
                      onChange={(e) => setDificultades(e.target.value)}
                      placeholder="Describe obstáculos, limitaciones, áreas de mejora, recomendaciones..."
                      style={{
                        resize: "vertical",
                        minHeight: "120px",
                        fontSize: "0.95rem",
                        lineHeight: "1.6"
                      }}
                    />
                    <div className="form-text">
                      <i className="bi bi-info-circle me-1"></i>
                      Opcional: Menciona dificultades encontradas y sugerencias para mejorar.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-light border-0 p-3">
            <button
              type="button"
              className="btn btn-light px-4"
              onClick={onClose}
              disabled={loading}
            >
              <i className="bi bi-x-circle me-2"></i>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 shadow-sm"
              onClick={handleSave}
              disabled={loading || !contenido.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {editing ? "Actualizar Informe" : "Guardar Informe"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}