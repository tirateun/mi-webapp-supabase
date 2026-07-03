import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ylekwhaeyullcrkzbzty.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsZWt3aGFleXVsbGNya3pienR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTk1NzIsImV4cCI6MjA3MzE3NTU3Mn0.riHlrigLN3OWinW2iTFUeNl8qMcupMxmj_Sh0FWQ_KU"; // pega la key completa aquí

export const supabase = createClient(supabaseUrl, supabaseAnonKey);