// Single Template EmailJS Helper & Server Fallback
const EMAILJS_SERVICE_ID = 'service_94w4z5q';
const EMAILJS_TEMPLATE_ID = 'template_ly4i099'; // AAPKA MAIN SINGLE TEMPLATE
const EMAILJS_PUBLIC_KEY = 'srCNMfHCpU7OtJ4hJ';

function loadEmailSDK() {
  return new Promise((resolve) => {
    if (window.emailjs) {
      try {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
      } catch (e) {}
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
      try {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
      } catch (e) {}
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

// 1. Admin Approval / Rejection Email
export async function triggerEmail(recipientEmail, recipientName, actionType, txDetails = {}) {
  const isApproved = String(actionType).toLowerCase() === 'approve';
  return await sendGenericEmail({
    to_email: recipientEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: isApproved ? 'APPROVED' : 'DECLINED',
    email_heading: isApproved ? 'Transaction Successful' : 'Transaction Declined',
    tx_type: txDetails.type || 'Deposit',
    amount: txDetails.amount || '0',
    reference_id: txDetails.reference || 'N/A',
    custom_message: isApproved 
      ? 'Your request has been successfully processed and credited to your trading account.' 
      : 'Your request could not be processed at this time. Please contact support for further details.'
  });
}

// Alias export for admin dashboard compatibility
export const sendNotification = triggerEmail;

// 2. Deposit Request Received Email
export async function sendDepositRequestEmail(recipientEmail, recipientName, amount, reference, type = 'Deposit') {
  return await sendGenericEmail({
    to_email: recipientEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: 'PENDING',
    email_heading: 'Deposit Request Received',
    tx_type: type,
    amount: amount || '0',
    reference_id: reference || 'N/A',
    custom_message: 'Your deposit request has been received and is currently under review. Our team will verify and credit your account shortly.'
  });
}

// 2b. Withdrawal Request Received Email
export async function sendWithdrawalRequestEmail(recipientEmail, recipientName, amount, reference, type = 'Withdrawal') {
  return await sendGenericEmail({
    to_email: recipientEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: 'PENDING REVIEW',
    email_heading: 'Withdrawal Request Submitted',
    tx_type: type,
    amount: amount || '0',
    reference_id: reference || 'N/A',
    custom_message: 'Your withdrawal request has been received and is currently being processed by our treasury desk. Once reviewed, funds will be released to your destination payout account.'
  });
}

// 3. Login Alert Email
export async function sendLoginEmail(recipientEmail, recipientName) {
  return await sendGenericEmail({
    to_email: recipientEmail,
    to_name: recipientName || recipientEmail?.split('@')[0] || 'Valued Trader',
    status_title: 'SECURITY ALERT',
    email_heading: 'New Login Detected',
    tx_type: 'Account Login',
    amount: '-',
    reference_id: new Date().toLocaleString(),
    custom_message: 'We detected a new successful login to your trading account. If this was not you, please contact support immediately.'
  });
}

// Core Sender Function (Tries Server first, then EmailJS with safe catch)
async function sendGenericEmail(params) {
  let safeEmail = typeof params.to_email === 'string' ? params.to_email.trim() : '';
  if (!safeEmail || !safeEmail.includes('@')) return false;

  // 1. Try server-side Nodemailer first (if configured in environment)
  try {
    const serverRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: safeEmail,
        name: params.to_name || 'Valued Trader',
        subject: `[${params.status_title || 'Buraq Markets'}] ${params.email_heading || 'Notification'}`,
        heading: params.email_heading,
        message: `${params.custom_message || ''}`
      })
    });
    if (serverRes.ok) {
      const data = await serverRes.json().catch(() => ({}));
      if (data.ok) {
        console.log('Notification email sent via server');
        return true;
      }
    }
  } catch (e) {
    // Server email route skipped or unavailable
  }

  // 2. Try EmailJS client-side
  try {
    await loadEmailSDK();
    if (!window.emailjs) return false;

    const templateParams = {
      ...params,
      email: safeEmail,
      recipient_email: safeEmail,
      to_email: safeEmail,
      to_name: params.to_name || safeEmail.split('@')[0]
    };

    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log('EmailJS dispatched successfully:', response?.status);
    return true;
  } catch (error) {
    // Graceful non-blocking catch so login and UI flows never hang or throw unhandled exceptions
    console.warn('Email dispatch notice:', error?.text || error?.message || 'Email delivery completed');
    return false;
  }
}

window.triggerEmail = triggerEmail;
window.sendNotification = sendNotification;
window.sendLoginEmail = sendLoginEmail;
window.sendDepositRequestEmail = sendDepositRequestEmail;
