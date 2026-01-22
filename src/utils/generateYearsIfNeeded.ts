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

  // Redondear duración hacia arriba para generar años completos
  // Ejemplo: 1.5 años → genera Año 1 y Año 2
  const totalYears = Math.ceil(durationYears);

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
  if (existing && existing.length === totalYears) {
    console.log("agreement_years ya completos, no se generan nuevamente");
    return;
  }

  // ---- Borrar los años existentes (si están truncados o inconsistentes) ----
  await supabase
    .from("agreement_years")
    .delete()
    .eq("agreement_id", agreementId);

  // ---- Calcular años usando zona horaria local ----
  // 🔧 CORRECCIÓN: Parsear fecha manualmente para evitar problemas de zona horaria
  const [year, month, day] = signatureDate.split('-').map(Number);
  const baseDate = new Date(year, month - 1, day); // mes es 0-indexed en JS

  const rows: any[] = [];

  for (let i = 0; i < totalYears; i++) {
    // Año N empieza en la fecha base + i años
    const start = new Date(baseDate);
    start.setFullYear(baseDate.getFullYear() + i);

    // Año N termina exactamente 1 año después - 1 día
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);

    // Formatear a YYYY-MM-DD manualmente
    const startStr = formatDate(start);
    const endStr = formatDate(end);

    rows.push({
      agreement_id: agreementId,
      year_number: i + 1,
      year_start: startStr,
      year_end: endStr,
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

/**
 * Formatea Date a YYYY-MM-DD sin problemas de zona horaria
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
