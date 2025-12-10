// src/AgreementsForm.tsx
// Versión estable y compilable ✅
// - NO redeclaraciones
// - Tipos correctos
// - expiration_date GENERATED en BD
// - generateYearsIfNeeded correctamente tipado

import React, { useEffect, useMemo, useState } from "react";
import Select, { MultiValue } from "react-select";
import { supabase } from "./supabaseClient";
import generateYearsIfNeeded from "./utils/generateYearsIfNeeded";

interface Option {
  value: string;
  label: string;
}

export default function AgreementsForm({
  existingAgreement,
  onSave,
  onCancel,
}: any) {
  // ---------- ESTADOS PRINCIPALES ----------
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState<string>(existingAgreement?.name ?? "");
  const [signatureDate, setSignatureDate] = useState<string>(
    existingAgreement?.signature_date ?? ""
  );
  const [durationYears, setDurationYears] = useState<number>(
    existingAgreement?.duration_years ?? 1
  );
  const [tipoConvenio, setTipoConvenio] = useState<string>(
    existingAgreement?.convenio ?? "marco"
  );
  const [resolucion, setResolucion] = useState<string>(
    existingAgreement?.["Resolución Rectoral"] ??
      existingAgreement?.resolucion ??
      ""
  );
  const [pais, setPais] = useState<string>(existingAgreement?.pais ?? "");
  const [objetivos, setObjetivos] = useState<string>(
    existingAgreement?.objetivos ?? ""
  );
  const [tipoSeleccionados, setTipoSeleccionados] = useState<string[]>(
    existingAgreement?.tipo_convenio ?? []
  );
  const [subTipoDocente, setSubTipoDocente] = useState<string>(
    existingAgreement?.sub_tipo_docente ?? ""
  );

  const [version, setVersion] = useState<number>(
    existingAgreement?.version ?? 1
  );
  const [estado, setEstado] = useState<string>(
    existingAgreement?.estado ?? "ACTIVO"
  );

  // ---------- RESPONSABLES / ÁREAS ----------
  const [internos, setInternos] = useState<any[]>([]);
  const [externos, setExternos] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);

  const [selectedInternals, setSelectedInternals] = useState<Option[]>([]);
  const [externalResponsible, setExternalResponsible] = useState<string>(
    existingAgreement?.external_responsible ?? ""
  );
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<number[]>(
    existingAgreement?.areas ?? []
  );

  const [areaId, setAreaId] = useState<number | null>(
    existingAgreement?.area_vinculada_id ?? null
  );
  const [convenioMaestroId, setConvenioMaestroId] = useState<number | null>(
    existingAgreement?.convenio_maestro_id ?? null
  );

  // ---------- CONSTANTES ----------
  const paises = [
    "Perú",
    "Argentina",
    "Chile",
    "Colombia",
    "México",
    "Brasil",
    "España",
  ];

  const tipos = useMemo(
    () => [
      "Docente Asistencial",
      "Cooperación técnica",
      "Movilidad académica",
      "Investigación",
      "Colaboración académica",
      "Consultoría",
      "Cotutela",
    ],
    []
  );

  const subTiposDocente = useMemo(
    () => [
      "PREGRADO - NACIONALES",
      "POSTGRADO RESIDENTADO EN ENFERMERÍA - NACIONALES CONAREN",
      "POSTGRADO 2DA ESP. EN ENFERMERÍA NO RESIDENTADO - NACIONALES",
      "POSTGRADO RESIDENTADO MÉDICO - CONAREME",
      "POSTGRADO 2DA ESPECIALIDAD NUTRICIÓN PALIATIVA",
    ],
    []
  );

  // ---------- CARGAS INICIALES ----------
  useEffect(() => {
    fetchEnumsAndLists();
  }, []);

  async function fetchEnumsAndLists() {
    try {
      const [{ data: internosData }, { data: externosData }, { data: areasData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name")
            .eq("role", "internal"),
          supabase
            .from("profiles")
            .select("id, full_name")
            .eq("role", "external"),
          supabase.from("areas_vinculadas").select("id, nombre"),
        ]);

      setInternos(internosData ?? []);
      setExternos(externosData ?? []);
      setAreas(areasData ?? []);
    } catch (e) {
      console.error("Error cargando listas", e);
    }
  }

  const toggleTipo = (t: string) => {
    setTipoSeleccionados((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleArea = (id: number) => {
    setAreasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        signature_date: signatureDate || null,
        duration_years: durationYears,
        convenio: tipoConvenio,
        pais: pais || null,
        "Resolución Rectoral": resolucion || null,
        tipo_convenio: tipoSeleccionados,
        objetivos: objetivos || null,
        sub_tipo_docente: tipoSeleccionados.includes("Docente Asistencial")
          ? subTipoDocente || null
          : null,
        area_vinculada_id: areaId,
        convenio_maestro_id: convenioMaestroId,
        version,
        estado,
        updated_at: new Date().toISOString(),
      };

      let agreementId = existingAgreement?.id;

      if (agreementId) {
        const { error } = await supabase
          .from("agreements")
          .update(payload)
          .eq("id", agreementId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("agreements")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        agreementId = data.id;
      }

      // ---------- RESPONSABLES INTERNOS ----------
      await supabase
        .from("agreement_internal_responsibles")
        .delete()
        .eq("agreement_id", agreementId);

      if (selectedInternals.length > 0) {
        const toInsert = selectedInternals.map((s) => ({
          agreement_id: agreementId,
          internal_responsible_id: s.value,
        }));
        await supabase
          .from("agreement_internal_responsibles")
          .insert(toInsert);
      }

      // ---------- ÁREAS ----------
      await supabase
        .from("agreement_areas_vinculadas")
        .delete()
        .eq("agreement_id", agreementId);

      if (areasSeleccionadas.length > 0) {
        const toInsertAreas = areasSeleccionadas.map((id) => ({
          agreement_id: agreementId,
          area_vinculada_id: id,
        }));
        await supabase
          .from("agreement_areas_vinculadas")
          .insert(toInsertAreas);
      }

      // ---------- GENERAR AÑOS ----------
      const { data: row } = await supabase
        .from("agreements")
        .select("signature_date, expiration_date, duration_years")
        .eq("id", agreementId)
        .single();

      if (row) {
        await generateYearsIfNeeded(
          agreementId,
          row.signature_date ?? null,
          row.expiration_date ?? null,
          Number(row.duration_years ?? durationYears)
        );
      }

      alert("✅ Convenio guardado correctamente");
      onSave?.();
    } catch (err: any) {
      console.error(err);
      alert("❌ Error al guardar convenio");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="container mt-4">
      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del convenio"
          required
        />

        <input
          type="date"
          className="form-control mb-2"
          value={signatureDate}
          onChange={(e) => setSignatureDate(e.target.value)}
        />

        <select
          className="form-control mb-2"
          value={durationYears}
          onChange={(e) => setDurationYears(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} año(s)
            </option>
          ))}
        </select>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}

