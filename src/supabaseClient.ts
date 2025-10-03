// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// ✅ Usar variables de entorno configuradas en Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// 🔎 Debug para verificar (solo en desarrollo)
console.log("🌍 VITE_SUPABASE_URL =", supabaseUrl);
console.log("🔑 VITE_SUPABASE_ANON_KEY =", supabaseAnonKey ? "Cargada ✅" : "No encontrada ❌");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
