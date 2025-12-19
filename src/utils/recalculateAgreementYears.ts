// src/utils/recalculateAgreementYears.ts
import { supabase } from "../supabaseClient";

/**
 * Recalcula las fechas de los años existentes cuando se edita un convenio.
 * Útil cuando cambias signature_date o duration_years.
 * 
 * @param agreementId - UUID del convenio
 * @param signatureDate - Fecha de firma (YYYY-MM-DD)
 * @param durationYears - Duración total en años
 * @returns Promise<void>
 */
export async function recalculateAgreementYears(
  agreementId: string,
  signatureDate: string | null,
  durationYears: number
): Promise<void> {
  if (!agreementId || !signatureDate || !durationYears) {
    console.warn("⚠️ recalculateAgreementYears: faltan parámetros", {
      agreementId,
      signatureDate,
      durationYears,
    });
    return;
  }

  try {
    console.log(`🔄 Recalculando años para convenio ${agreementId}...`);

    // 1. Obtener los años existentes
    const { data: existingYears, error: fetchError } = await supabase
      .from("agreement_years")
      .select("id, year_number")
      .eq("agreement_id", agreementId)
      .order("year_number", { ascending: true });

    if (fetchError) {
      console.error("❌ Error obteniendo años:", fetchError);
      return;
    }

    if (!existingYears || existingYears.length === 0) {
      console.log("ℹ️ No hay años existentes, se crearán con generateYearsIfNeeded");
      return;
    }

    // 2. Calcular las nuevas fechas para cada año
    const updates: Array<{
      id: string;
      year_start: string;
      year_end: string;
    }> = [];

    const baseDate = new Date(signatureDate);

    for (let i = 0; i < existingYears.length; i++) {
      const year = existingYears[i];
      const yearNumber = year.year_number;

      // Calcular fecha de inicio: signature_date + (yearNumber - 1) años
      const yearStart = new Date(baseDate);
      yearStart.setFullYear(yearStart.getFullYear() + (yearNumber - 1));

      // Calcular fecha de fin: inicio + 1 año - 1 día
      const yearEnd = new Date(yearStart);
      yearEnd.setFullYear(yearEnd.getFullYear() + 1);
      yearEnd.setDate(yearEnd.getDate() - 1);

      // Formatear a YYYY-MM-DD
      const formatDate = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };

      updates.push({
        id: year.id,
        year_start: formatDate(yearStart),
        year_end: formatDate(yearEnd),
      });
    }

    // 3. Si hay más años de los que debería (ej: reduciste duración de 5 a 3)
    if (existingYears.length > durationYears) {
      const toDelete = existingYears.slice(durationYears);
      console.log(
        `🗑️ Eliminando ${toDelete.length} año(s) extra...`,
        toDelete.map((y) => `Año ${y.year_number}`)
      );

      const deleteIds = toDelete.map((y) => y.id);
      const { error: deleteError } = await supabase
        .from("agreement_years")
        .delete()
        .in("id", deleteIds);

      if (deleteError) {
        console.error("❌ Error eliminando años extra:", deleteError);
      }

      // Solo actualizar los años que quedan
      updates.splice(durationYears);
    }

    // 4. Si hay menos años de los que debería (ej: aumentaste duración de 3 a 5)
    if (existingYears.length < durationYears) {
      const yearsToCreate = durationYears - existingYears.length;
      console.log(`➕ Faltan ${yearsToCreate} año(s), se crearán después...`);
      
      // Los años faltantes se crearán con generateYearsIfNeeded
      // Aquí solo actualizamos los existentes
    }

    // 5. Actualizar las fechas de los años existentes
    console.log(`📝 Actualizando ${updates.length} año(s)...`);

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("agreement_years")
        .update({
          year_start: update.year_start,
          year_end: update.year_end,
        })
        .eq("id", update.id);

      if (updateError) {
        console.error(`❌ Error actualizando año ${update.id}:`, updateError);
      }
    }

    console.log("✅ Años recalculados correctamente");
  } catch (error) {
    console.error("❌ Error en recalculateAgreementYears:", error);
  }
}