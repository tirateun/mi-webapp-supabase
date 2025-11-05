import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🌍 VITE_SUPABASE_URL =", supabaseUrl);
console.log("🔑 VITE_SUPABASE_ANON_KEY =", supabaseAnonKey ? "Cargada ✅" : "No cargada ❌");

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
// 🚀 PRUEBA: Verificar acceso a la tabla agreements
(async () => {
    const { data, error } = await supabase.from("agreements").select("*").limit(1);
    if (error) {
      console.error("❌ Error al consultar agreements:", error);
    } else {
      console.log("✅ Acceso correcto a agreements:", data);
    }
  })();
  