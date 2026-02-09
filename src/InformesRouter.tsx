// src/InformesRouter.tsx
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import InformesAnualesPage from "./InformesAnualesPage";
import InformesSemestralesList from "./InformesSemestralesList";
import InformeSemestralForm from "./InformeSemestralForm";

interface Props {
  convenioId: string;
  convenioNombre: string;
  onClose?: () => void;
}

export default function InformesRouter({ convenioId, convenioNombre, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [esDocenteAsistencial, setEsDocenteAsistencial] = useState(false);
  const [vista, setVista] = useState<"lista" | "form">("lista");
  const [informeEditar, setInformeEditar] = useState<any>(null);

  useEffect(() => {
    verificarTipo();
  }, [convenioId]);

  const verificarTipo = async () => {
    try {
      const { data, error } = await supabase
        .from("agreements")
        .select("tipo_convenio")
        .eq("id", convenioId)
        .single();

      if (error) throw error;

      // Verificar si tipo_convenio incluye "Docente Asistencial"
      const esDocente = data?.tipo_convenio?.includes("Docente Asistencial") || false;
      setEsDocenteAsistencial(esDocente);
    } catch (error) {
      console.error("Error verificando tipo de convenio:", error);
      setEsDocenteAsistencial(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "3rem", 
        textAlign: "center",
        minHeight: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p style={{ color: "#6C757D", margin: 0 }}>Verificando tipo de convenio...</p>
      </div>
    );
  }

  // ============================================
  // CONVENIOS DOCENTE ASISTENCIAL
  // Sistema NUEVO: Informes Semestrales Cuantitativos
  // ============================================
  if (esDocenteAsistencial) {
    if (vista === "lista") {
      return (
        <InformesSemestralesList
          convenioId={convenioId}
          convenioNombre={convenioNombre}
          onNuevoInforme={() => {
            setInformeEditar(null);
            setVista("form");
          }}
          onEditarInforme={(informe: any) => {
            setInformeEditar(informe);
            setVista("form");
          }}
          onVerDetalle={(informe: any) => {
            // Opcional: Implementar vista de detalle
            console.log("Ver detalle:", informe);
          }}
        />
      );
    } else {
      return (
        <InformeSemestralForm
          convenioId={convenioId}
          convenioNombre={convenioNombre}
          informeId={informeEditar?.id}
          onGuardado={() => setVista("lista")}
          onCancelar={() => setVista("lista")}
        />
      );
    }
  }

  // ============================================
  // CONVENIOS NO DOCENTE ASISTENCIAL
  // Sistema ANTIGUO: Informes Anuales Narrativos (Año 1, 2, 3)
  // ============================================
  return (
    <InformesAnualesPage
      convenioId={convenioId}
      onClose={onClose}
    />
  );
}