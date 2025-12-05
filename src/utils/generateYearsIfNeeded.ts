// /src/utils/generateYearsIfNeeded.ts
import { supabase } from "../supabaseClient";

/**
 * Genera automáticamente los años de vigencia de un convenio si no existen.
 *
 * @param agreementId        ID del convenio
 * @param signatureDate      Fecha de firma (YYYY-MM-DD)
 * @param durationYears      Duración en años
 * @param expirationDate     Fecha de expiración calculada (YYYY-MM-DD)
 */
export default async function generateYearsIfNeeded(
  agreementId: number,
  signatureDate: string | null,
  expirationDate: string | null,
  durationYears: number | null
) {
  try {
    if (!agreementId) {
      console.warn("generateYearsIfNeeded: no agreementId");
      return;
    }

    if (!signatureDate || !durationYears) {
      console.warn("generateYearsIfNeeded: faltan datos para generar años");
      return;
    }

    const startYear = new Date(signatureDate).getFullYear();
    const endYear =
      expirationDate
        ? new Date(expirationDate).getFullYear()
        : startYear + durationYears - 1;

    if (!startYear || !endYear) {
      console.warn("generateYearsIfNeeded: fechas inválidas");
      return;
    }

    // Obtener años existentes
    const { data: existingYears, error: fetchError } = await supabase
      .from("agreement_years")
      .select("year")
      .eq("agreement_id", agreementId);

    if (fetchError) throw fetchError;

    const yearsToCreate = [];
    for (let y = startYear; y <= endYear; y++) {
      if (!existingYears?.some((row: any) => row.year === y)) {
        yearsToCreate.push({ agreement_id: agreementId, year: y });
      }
    }

    if (yearsToCreate.length === 0) {
      console.log("generateYearsIfNeeded: todos los años ya existen");
      return;
    }

    const { error: insertError } = await supabase
      .from("agreement_years")
      .insert(yearsToCreate);

    if (insertError) throw insertError;

    console.log("Años generados:", yearsToCreate);
  } catch (err) {
    console.error("Error en generateYearsIfNeeded:", err);
  }
}

