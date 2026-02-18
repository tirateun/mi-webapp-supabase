// src/utils/generateYearsIfNeeded.ts
import { supabase } from "../supabaseClient";

/**
 * Genera automáticamente los años de vigencia de un convenio si no existen.
 * Genera años contiguos desde signature_date hasta expiration_date.
 *
 * @param agreementId        ID del convenio (uuid string)
 * @param signatureDate      Fecha de firma (YYYY-MM-DD)
 * @param expirationDate     Fecha de expiración (YYYY-MM-DD)
 * @param durationYears      Duración en años (usado si no hay expirationDate)
 */
export default async function generateYearsIfNeeded(
  agreementId: string | number,
  signatureDate: string | null,
  expirationDate: string | null,
  durationYears: number | null
) {
  try {
    if (!agreementId) {
      console.warn("❌ generateYearsIfNeeded: no agreementId");
      return;
    }

    const agreementIdSafe = String(agreementId);

    if (!signatureDate) {
      console.warn("❌ generateYearsIfNeeded: falta signatureDate");
      return;
    }

    // Calcular fecha de expiración si no existe
    let endDate: Date;
    
    if (expirationDate) {
      endDate = new Date(expirationDate);
    } else if (durationYears) {
      const start = new Date(signatureDate);
      endDate = new Date(start);
      endDate.setFullYear(endDate.getFullYear() + Number(durationYears));
      endDate.setDate(endDate.getDate() - 1);
    } else {
      console.warn("❌ generateYearsIfNeeded: falta expirationDate y durationYears");
      return;
    }

    // Verificar si ya tiene años generados
    const { data: existingYears, error: fetchError } = await supabase
      .from("agreement_years")
      .select("id")
      .eq("agreement_id", agreementIdSafe)
      .limit(1);

    if (fetchError) {
      console.error("❌ Error verificando años existentes:", fetchError);
      return;
    }

    if (existingYears && existingYears.length > 0) {
      console.log("📅 Años ya existentes para convenio, saltando generación");
      return;
    }

    // Generar años de vigencia
    const start = new Date(signatureDate);
    const yearRows: any[] = [];
    let yearNum = 1;
    let cursor = new Date(start);

    while (cursor < endDate) {
      const yearStart = new Date(cursor);
      const yearEnd = new Date(yearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
      yearEnd.setDate(yearEnd.getDate() - 1);

      // Si el fin de año excede la expiración, ajustar
      if (yearEnd > endDate) {
        yearEnd.setTime(endDate.getTime());
      }

      yearRows.push({
        agreement_id: agreementIdSafe,
        year_number: yearNum,
        year_start: yearStart.toISOString().slice(0, 10),
        year_end: yearEnd.toISOString().slice(0, 10),
      });

      // Si llegamos al final, salir
      if (yearEnd >= endDate) break;

      // Avanzar al siguiente año
      cursor = new Date(yearEnd);
      cursor.setDate(cursor.getDate() + 1);
      yearNum++;
    }

    if (yearRows.length === 0) {
      console.warn("⚠️ No se generaron años (duración muy corta?)");
      return;
    }

    // Insertar años en la BD
    const { error: insertError } = await supabase
      .from("agreement_years")
      .insert(yearRows);

    if (insertError) {
      console.error("❌ Error insertando años:", insertError);
      throw insertError;
    }

    console.log(`✅ Generados ${yearRows.length} año(s) para convenio ${agreementIdSafe}`);
  } catch (err) {
    console.error("❌ Error en generateYearsIfNeeded:", err);
    throw err;
  }
}