const nodemailer = require('nodemailer');

function clean(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(200).json({ ok: true, message: 'Email API Active' });

  const gmailUser = clean(process.env.GMAIL_USER || process.env.GMAIL_ADDRESS, 320);
  const gmailPass = clean(process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD, 320);

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ ok: false, error: 'Gmail credentials missing in Vercel.' });
  }

  const { to, subject, heading, message, name } = req.body || {};
  const recipientEmail = clean(to, 320);

  if (!recipientEmail) {
    return res.status(400).json({ ok: false, error: 'Recipient email is required.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  const htmlTemplate = `
    <div style="background:#070b0d; padding:30px; font-family:sans-serif; color:#fff;">
      <div style="max-width:600px; margin:0 auto; background:#11181c; padding:20px; border-radius:8px; border:1px solid #202a2e;">
        <h2 style="color:#d6a93b; margin-top:0;">BURAQ MARKETS</h2>
        <h3 style="color:#fff;">${clean(heading, 200) || 'Notification'}</h3>
        <p style="color:#ccc;">Dear ${clean(name, 100) || 'Valued Trader'},</p>
        <div style="background:#0d1417; padding:15px; border-left:4px solid #d6a93b; margin:20px 0; color:#e1e7e8;">
          ${clean(message, 4000)}
        </div>
        <p style="color:#888; font-size:12px;">© Buraq Markets. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Buraq Markets" <${gmailUser}>`,
      to: recipientEmail,
      subject: clean(subject, 200) || 'Notification — Buraq Markets',
      html: htmlTemplate,
    });

    return res.status(200).json({ ok: true, message: 'Email sent successfully.' });
  } catch (err) {
    console.error('Mail Error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to send email.' });
  }
};
