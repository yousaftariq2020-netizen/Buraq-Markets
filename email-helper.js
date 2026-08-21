// Buraq Markets — EmailJS notification helper
// Centralized client/admin notification sender.
import emailjs from 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm';

const EMAILJS_PUBLIC_KEY = 'srCNMfHCpU7OtJ4hJ';
const EMAILJS_SERVICE_ID = 'service_94w4z5q';
const EMAILJS_TEMPLATE_ID = 'template_ly4i099';

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

/**
 * Send a Buraq Markets notification through the configured EmailJS template.
 * The caller awaits this function so navigation/rendering cannot race the
 * EmailJS request. A failed email never rolls back a successful DB action.
 */
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
    console.error('[Buraq EmailJS] Skipped:', error.message);
    return { ok: false, error };
  }

  const safeName = String(to_name || 'Client').trim() || 'Client';
  const safeSubject = String(subject || '').trim();
  const safeHeading = String(heading || '').trim();
  const safeMessage = String(message || '').trim();
  const now = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Include both the Buraq notification variables and the common Contact Us
  // variables so the current EmailJS template remains fully compatible.
  const templateParams = {
    to_email: recipient,
    to_name: safeName,
    subject: safeSubject,
    heading: safeHeading,
    message: safeMessage,
    name: safeName,
    email: recipient,
    title: safeSubject,
    time: now
  };

  try {
    console.info('[Buraq EmailJS] Sending:', {
      service: EMAILJS_SERVICE_ID,
      template: EMAILJS_TEMPLATE_ID,
      to: recipient,
      subject: safeSubject
    });

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.info('[Buraq EmailJS] Sent successfully:', {
      status: response?.status,
      text: response?.text,
      to: recipient
    });

    return { ok: true, response };
  } catch (error) {
    console.error('[Buraq EmailJS] Send failed:', {
      status: error?.status,
      text: error?.text,
      message: error?.message,
      to: recipient
    });

    return { ok: false, error };
  }
}
