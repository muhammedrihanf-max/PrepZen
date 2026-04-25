import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, role, department } = req.body;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return res.status(500).json({ error: 'Missing environment variables' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // 1. Create the user in Supabase Auth
  const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { display_name: name, role },
    email_confirm: true
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  // 2. Create the profile record
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: data.user.id,
      email,
      name,
      role,
      department,
      gender: 'other'
    });

  if (profileError) {
    return res.status(400).json({ error: profileError.message });
  }

  return res.status(200).json({ success: true, user: data.user });
}
