const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zlmoqiulzrqpnbxfeetp.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable__t2-g_ly7mOyzjOj6un36A_edOp9mU-';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = async function registerHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { email, password, metaData, emailRedirectTo } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' });
  }

  try {
    const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host))
      || (typeof req.get === 'function' ? req.get('host') : null)
      || 'buraqmarkets.com';
    const protocol = (req.headers && req.headers['x-forwarded-proto']) || req.protocol || 'https';
    const redirectUrl = emailRedirectTo || `${protocol}://${host}/client-login.html`;

    const { data, error } = await supabase.auth.signUp({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      options: {
        data: metaData || {},
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      console.error('Supabase Auth Signup Error:', error);

      if (error.code === 'over_email_send_rate_limit' || (error.message && error.message.includes('rate limit'))) {
        return res.status(429).json({
          ok: false,
          code: 'over_email_send_rate_limit',
          error: 'Supabase email send rate limit exceeded (Free tier par default email limit 3 per hour hoti hai). Har naye user ko verification email bhejne ke liye Supabase Dashboard > Project Settings > Authentication > SMTP Settings mein apna Custom SMTP (Gmail ya professional email) enable karein, jisse unlimited confirmation emails deliver hon gi.'
        });
      }

      if (error.message && error.message.toLowerCase().includes('already registered')) {
        return res.status(400).json({
          ok: false,
          code: 'user_already_exists',
          error: 'Yeh email address pehle se registered hai. Barahe meharbani login karein.'
        });
      }

      return res.status(400).json({
        ok: false,
        code: error.code || 'signup_error',
        error: error.message || 'Account registration failed in Supabase.'
      });
    }

    return res.status(200).json({
      ok: true,
      user: data.user,
      session: data.session,
      message: 'Account created successfully.'
    });

  } catch (err) {
    console.error('Server Registration Handler Exception:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal server error during registration.'
    });
  }
};
