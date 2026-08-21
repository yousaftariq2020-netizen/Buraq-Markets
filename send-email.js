const nodemailer = require('nodemailer');

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

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const gmailUser = clean(process.env.GMAIL_USER, 320);
  const gmailAppPassword = clean(process.env.GMAIL_APP_PASSWORD, 200);

  if (!gmailUser || !gmailAppPassword) {
    console.error('[Buraq Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD.');
    return res.status(500).json({ ok: false, error: 'Email service is not configured on the server.' });
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
      error: 'Email could not be sent. Check the Gmail App Password and Vercel environment variables.'
    });
  }
};
