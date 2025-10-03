import { createClient } from "@supabase/supabase-js";

// ✅ Variables de entorno (cargadas desde Vercel o .env.local en desarrollo)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// 🔎 Debug para confirmar que las variables llegan bien
console.log("🌍 VITE_SUPABASE_URL =", supabaseUrl);
console.log("🔑 VITE_SUPABASE_ANON_KEY =", supabaseAnonKey ? "Cargada ✅" : "No encontrada ❌");

// 👉 Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
