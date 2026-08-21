// Buraq Markets — EmailJS notification helper
// Used by deposit.html, withdraw.html, verify-identity.html, and admin-dashboard.html
import emailjs from 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm';

const EMAILJS_PUBLIC_KEY = 'srCNMfHCpU7OtJ4hJ';
const EMAILJS_SERVICE_ID = 'service_94w4z5q';
const EMAILJS_TEMPLATE_ID = 'template_ly4i099';

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

/**
 * Sends a notification email via EmailJS.
 * @param {Object} opts
 * @param {string} opts.to_email - recipient's email address
 * @param {string} [opts.to_name] - recipient's display name
 * @param {string} opts.subject - email subject line
 * @param {string} opts.heading - short bold heading shown in the email
 * @param {string} opts.message - body text
 */
export async function sendNotification({ to_email, to_name, subject, heading, message }) {
  if (!to_email) {
    console.warn('sendNotification: no recipient email, skipping send.');
    return;
  }
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email,
      to_name: to_name || 'Client',
      subject,
      heading,
      message
    });
  } catch (err) {
    // Never block the main action (deposit/withdraw/kyc/approve) if email fails
    console.error('Email notification failed:', err);
  }
}
