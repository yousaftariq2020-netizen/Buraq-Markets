const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zlmoqiulzrqpnbxfeetp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable__t2-g_ly7mOyzjOj6un36A_edOp9mU-';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = async function loginHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: String(password)
    });

    if (error) {
      console.error('Server login proxy error:', error);
      const errMsg = (error.message || '').toLowerCase();
      
      if (error.code === 'email_not_confirmed' || errMsg.includes('email not confirmed')) {
        return res.status(401).json({
          ok: false,
          code: 'email_not_confirmed',
          error: 'Aapka email verify nahi hua. Barahe meharbani apna email inbox check karein.'
        });
      }

      if (error.code === 'invalid_credentials' || errMsg.includes('invalid login credentials')) {
        return res.status(401).json({
          ok: false,
          code: 'invalid_credentials',
          error: 'Email ya password durust nahi hai. Dobara check karein.'
        });
      }

      return res.status(400).json({
        ok: false,
        code: error.code || 'auth_error',
        error: error.message || 'Login failed. Please try again.'
      });
    }

    // Attempt to fetch profile role
    let role = 'client';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, client_id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile && profile.role) {
        role = profile.role;
      }
    } catch (profErr) {
      console.warn('Profile fetch notice in login proxy:', profErr);
    }

    return res.status(200).json({
      ok: true,
      user: data.user,
      session: data.session,
      role: role
    });
  } catch (err) {
    console.error('Login proxy unexpected error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Server connection error during login. Please try again in a few moments.'
    });
  }
};
