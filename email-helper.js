// Buraq Markets — server-side email notification helper
// Browser code calls the Vercel /api/send-email endpoint.
// Gmail credentials are NEVER exposed to the browser.

export async function sendNotification({
  to_email,
  to_name = 'Client',
  subject,
  heading,
  message
}) {
  const recipient = String(to_email || '').trim();

  if (!recipient) {
    const error = new Error('No recipient email address was provided.');
    console.error('[Buraq Email] Skipped:', error.message);
    return { ok: false, error };
  }

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_email: recipient,
        to_name: String(to_name || 'Client').trim() || 'Client',
        subject: String(subject || '').trim(),
        heading: String(heading || '').trim(),
        message: String(message || '').trim()
      })
    });

    let result = {};
    try {
      result = await response.json();
    } catch (_) {
      result = {};
    }

    if (!response.ok || !result.ok) {
      const error = new Error(result.error || `Email request failed (${response.status}).`);
      console.error('[Buraq Email] Send failed:', error.message);
      return { ok: false, error };
    }

    console.info('[Buraq Email] Sent successfully:', {
      messageId: result.messageId,
      to: recipient,
      subject
    });

    return { ok: true, response: result };
  } catch (error) {
    console.error('[Buraq Email] Network/API error:', error);
    return { ok: false, error };
  }
}
