import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Data persistence will be limited to internal simulation.");
}

// Diagnostic helper for mobile network issues
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('exams').select('id').limit(1);
    if (error) throw error;
    console.log("Supabase connection successful:", data);
    return true;
  } catch (err: any) {
    console.error("Supabase connection failed:", err.message);
    return false;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auto-check on load (helpful for debugging mobile APK)
checkConnection().then(connected => {
  if (!connected && !supabaseUrl) {
    alert("Warning: Supabase URL is empty. Check your .env setup!");
  } else if (!connected) {
    console.warn("Initial Supabase connection check failed.");
  }
});
