// src/utils/renewAgreement.ts
import { supabase } from "../supabaseClient";

export async function renewAgreement(originalAgreementId: string, newStartDate: string, newEndDate: string) {
  try {
    // 1. Obtener el convenio original
    const { data: original, error: fetchError } = await supabase
      .from('agreements')
      .select('id, convenio_maestro_id, version, nombre, institucion_id, tipo, observaciones, responsable_id, area_id')
      .eq('id', originalAgreementId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Determinar el maestro_id y nueva versión
    const maestroId = original.convenio_maestro_id || original.id;
    const nextVersion = (original.version || 1) + 1;

    // 3. Crear el nuevo convenio (NO actualizar el original)
    const { data: newAgreement, error: insertError } = await supabase
      .from('agreements')
      .insert({
        nombre: original.nombre,
        institucion_id: original.institucion_id,
        tipo: original.tipo,
        fecha_inicio: newStartDate,
        fecha_fin: newEndDate,
        observaciones: original.observaciones,
        responsable_id: original.responsable_id,
        area_id: original.area_id,
        convenio_maestro_id: maestroId,
        version: nextVersion,
        estado: 'activo'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return { success: true, newAgreementId: newAgreement.id, version: nextVersion };
    
  } catch (err) {
    console.error('Error en renovación:', err);
    
    const errorMessage = err instanceof Error 
      ? err.message 
      : typeof err === 'string' 
        ? err 
        : 'Error desconocido en la renovación del convenio';
    
    return { success: false, error: errorMessage };
  }
}