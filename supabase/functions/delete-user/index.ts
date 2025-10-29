// supabase/functions/delete-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  // 🧩 Manejo de preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ✅ Asegurar método correcto
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método no permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🔐 Verificar autorización
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing authorization header", { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");

    // 🧑‍💻 Crear cliente de Supabase con anon key y el token de autorización
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // 🔍 Obtener información del usuario autenticado
    // ✅ CORREGIDO: Sintaxis correcta para desestructurar {  { user }, error }
    const { { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // 🔐 Verificar que el usuario sea administrador
    const {  profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response("Forbidden: Admins only", { status: 403, headers: corsHeaders });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Falta user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🔐 Cliente con service_role_key para operaciones de admin
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // 🗑️ 1️⃣ Eliminar usuario desde Auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(user_id);
    if (authError) {
      throw new Error(`Error al eliminar en Auth: ${authError.message}`);
    }

    // 🗑️ 2️⃣ Eliminar también de la tabla 'profiles'
    const { error: profileDeleteError } = await adminSupabase
      .from("profiles")
      .delete()
      .eq("id", user_id);

    if (profileDeleteError) {
      throw new Error(`Error al eliminar en profiles: ${profileDeleteError.message}`);
    }

    // ✅ Éxito
    return new Response(
      JSON.stringify({ success: true, message: "Usuario eliminado correctamente ✅" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("❌ Error al eliminar usuario:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});