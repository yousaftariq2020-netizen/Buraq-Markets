const nodemailer = require('nodemailer');

function clean(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  const gmailPass = clean(process.env.GMAIL_PASS, 320);

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ ok: false, error: 'Email service credentials not configured.' });
  }

  const { to, subject, heading, message, name } = req.body || {};

  const recipientEmail = clean(to, 320);
  const emailSubject = clean(subject, 200) || 'Notification — Buraq Markets';
  const emailHeading = clean(heading, 200) || 'Account Notification';
  const emailMessage = clean(message, 4000);
  const userName = clean(name, 100) || 'Valued Trader';

  if (!recipientEmail || !isEmail(recipientEmail)) {
    return res.status(400).json({ ok: false, error: 'Invalid recipient email.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  // Lengthy Professional HTML Email Design
  const fullHtmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #070b0d; font-family: 'Segoe UI', Arial, sans-serif; color: #f4f7f6;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #070b0d; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #11181c; border: 1px solid #202a2e; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 35px 20px; background: linear-gradient(180deg, #181409 0%, #11181c 100%); border-bottom: 1px solid #202a2e;">
                  <h2 style="margin: 0; color: #d6a93b; font-size: 26px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">BURAQ MARKETS</h2>
                  <p style="margin: 6px 0 0; color: #8d999d; font-size: 12px; letter-spacing: 0.5px;">Institutional Grade Financial Services</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 40px 35px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">${emailHeading}</h1>
                        <p style="margin: 15px 0 25px; color: #9ba6a8; font-size: 14px; line-height: 1.6; text-align: left;">
                          Dear <strong>${userName}</strong>,<br><br>
                          Thank you for choosing Buraq Markets. Below are the official status details regarding your recent account transaction request.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Dynamic Message Box -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d1417; border-left: 4px solid #d6a93b; padding: 18px 20px; border-radius: 0 6px 6px 0; margin-bottom: 30px; border-top: 1px solid #202a2e; border-right: 1px solid #202a2e; border-bottom: 1px solid #202a2e;">
                    <tr>
                      <td style="color: #e1e7e8; font-size: 13.5px; line-height: 1.6;">
                        <strong style="color: #d6a93b; font-size: 11px; text-transform: uppercase; display: block; margin-bottom: 5px;">Transaction Notice Details</strong>
                        ${emailMessage}
                      </td>
                    </tr>
                  </table>

                  <!-- Policy Section -->
                  <h3 style="margin: 0 0 12px; color: #d6a93b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Important Account Guidelines</h3>
                  <ul style="margin: 0 0 30px; padding-left: 20px; color: #9ba6a8; font-size: 13px; line-height: 1.8;">
                    <li><strong>Security Protocol:</strong> Buraq Markets support will never ask for your trading account password or private security keys.</li>
                    <li><strong>Processing Verification:</strong> All deposits and withdrawals are processed strictly according to regulatory standards.</li>
                    <li><strong>Record Keeping:</strong> Keep a copy of your reference receipts for seamless transaction audit tracking.</li>
                  </ul>

                  <!-- Action Button -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center">
                        <a href="https://buraq-markets-dark-dashboard.vercel.app/client-dashboard.html" style="display: inline-block; background: linear-gradient(135deg, #a47b18 0%, #d6a93b 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 35px; border-radius: 6px; box-shadow: 0 4px 15px rgba(214, 169, 59, 0.25);">Go to Dashboard</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 28px 35px; background-color: #090f12; border-top: 1px solid #202a2e; text-align: center;">
                  <p style="margin: 0 0 10px; color: #8d999d; font-size: 12px;">Have questions? Our support desk is available 24/7 to assist you.</p>
                  <p style="margin: 0 0 15px; color: #69767a; font-size: 12px;">Contact: <a href="mailto:support@buraqmarkets.com" style="color: #d6a93b; text-decoration: none;">support@buraqmarkets.com</a></p>
                  <p style="margin: 0; color: #485458; font-size: 11px; line-height: 1.4;">
                    &copy; 2026 Buraq Markets Ltd. All rights reserved.<br>
                    Trading Foreign Exchange and Financial Derivatives carries a high level of risk to your capital.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Buraq Markets" <${gmailUser}>`,
      to: recipientEmail,
      subject: emailSubject,
      html: fullHtmlContent,
    });

    return res.status(200).json({ ok: true, message: 'Email sent successfully.' });
  } catch (err) {
    console.error('Nodemailer Error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Failed to send email.' });
  }
};
