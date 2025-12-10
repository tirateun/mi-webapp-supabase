import { supabase } from "../supabaseClient";

/**
 * Genera los años del convenio en agreement_years
 * SOLO si no existen o están incompletos.
 *
 * TABLA: agreement_years
 * COLUMNAS:
 *  - agreement_id (uuid)
 *  - year_number (int)
 *  - year_start (date)
 *  - year_end (date)
 */
export default async function generateYearsIfNeeded(
  agreementId: string,
  signatureDate: string | null,
  expirationDate: string | null,
  durationYears: number | null
) {
  // ---- Validaciones duras (evitan basura en BD) ----
  if (!agreementId) {
    console.warn("generateYearsIfNeeded: agreementId vacío");
    return;
  }

  if (!signatureDate || !durationYears || durationYears <= 0) {
    console.warn("generateYearsIfNeeded: datos insuficientes", {
      signatureDate,
      durationYears,
    });
    return;
  }

  // ---- Verificar si ya existen años ----
  const { data: existing, error: checkErr } = await supabase
    .from("agreement_years")
    .select("id")
    .eq("agreement_id", agreementId);

  if (checkErr) {
    console.error("Error verificando agreement_years:", checkErr);
    return;
  }

  // Si ya existen TODOS los años, no hacer nada
  if (existing && existing.length === durationYears) {
    console.log("agreement_years ya completos, no se generan nuevamente");
    return;
  }

  // ---- Borrar los años existentes (si están truncados o inconsistentes) ----
  await supabase
    .from("agreement_years")
    .delete()
    .eq("agreement_id", agreementId);

  // ---- Calcular años ----
  const baseDate = new Date(signatureDate);
  const rows: any[] = [];

  for (let i = 0; i < durationYears; i++) {
    const start = new Date(baseDate);
    start.setFullYear(baseDate.getFullYear() + i);

    const end = new Date(baseDate);
    end.setFullYear(baseDate.getFullYear() + i + 1);
    end.setDate(end.getDate() - 1); // inclusivo

    rows.push({
      agreement_id: agreementId,
      year_number: i + 1,
      year_start: start.toISOString().slice(0, 10), // YYYY-MM-DD
      year_end: end.toISOString().slice(0, 10),
    });
  }

  // ---- Insertar ----
  const { error: insertErr } = await supabase
    .from("agreement_years")
    .insert(rows);

  if (insertErr) {
    console.error("Error insertando agreement_years:", insertErr);
  } else {
    console.log("agreement_years generados correctamente:", rows.length);
  }
}


