const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

function clean(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Very small in-memory rate limiter -------------------------------
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitHits = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const hits = (rateLimitHits.get(key) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitHits.set(key, hits);
  return hits.length > RATE_LIMIT_MAX;
}
// -----------------------------------------------------------------------

const ALLOWED_ORIGIN = process.env.SITE_ORIGIN || 'https://buraq-markets-dark-dashboard.vercel.app';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Missing Authorization bearer token.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Buraq Email] Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars on Vercel.');
    return res.status(500).json({ ok: false, error: 'Server auth is not configured.' });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData?.user) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired session.' });
  }

  const rateKey = userData.user.id || req.headers['x-forwarded-for'] || 'unknown';
  if (isRateLimited(rateKey)) {
    return res.status(429).json({ ok: false, error: 'Too many email requests. Please wait a moment and try again.' });
  }

  const gmailUser = clean(process.env.GMAIL_USER, 320);
  const gmailAppPassword = clean(process.env.GMAIL_APP_PASSWORD, 200).replace(/\s+/g, '');

  if (!gmailUser || !gmailAppPassword) {
    console.error('[Buraq Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars on Vercel.');
    return res.status(500).json({
      ok: false,
      error: 'Email service is not configured on the server (GMAIL_USER / GMAIL_APP_PASSWORD missing in Vercel).'
    });
  }

  const body = req.body || {};
  const toEmail = clean(body.to_email, 320).toLowerCase();
  const toName = clean(body.to_name || 'Client', 200) || 'Client';
  const subject = clean(body.subject, 300);
  const heading = clean(body.heading, 500);
  const message = clean(body.message, 5000);

  if (!isEmail(toEmail)) {
    return res.status(400).json({ ok: false, error: 'A valid recipient email address is required.' });
  }
  if (!subject || !message) {
    return res.status(400).json({ ok: false, error: 'Subject and message are required.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword
    }
  });

  const text = `${heading ? heading + '\n\n' : ''}${message}\n\nBuraq Markets`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#222"><h2>${escapeHtml(heading || subject)}</h2><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p><hr><p style="font-size:12px;color:#777">Buraq Markets</p></body></html>`;

  try {
    const info = await transporter.sendMail({
      from: `Buraq Markets <${gmailUser}>`,
      to: toEmail,
      subject,
      text,
      html
    });

    console.info('[Buraq Email] Sent:', {
      messageId: info.messageId,
      to: toEmail,
      subject
    });

    return res.status(200).json({ ok: true, messageId: info.messageId });
  } catch (error) {
    console.error('[Buraq Email] Send failed:', {
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
      to: toEmail
    });

    return res.status(502).json({
      ok: false,
      error: 'Email could not be sent: ' + (error?.message || 'unknown SMTP error') +
        (error?.responseCode ? ` (code ${error.responseCode})` : '')
    });
  }
};
