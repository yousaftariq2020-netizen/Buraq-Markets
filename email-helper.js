// Single Template EmailJS Helper (Fixed Export)

const EMAILJS_SERVICE_ID = 'service_94w4z5q';
const EMAILJS_TEMPLATE_ID = 'template_ly4i099'; // AAPKA MAIN SINGLE TEMPLATE
const EMAILJS_PUBLIC_KEY = 'srCNMfHCpU7OtJ4hJ';

function loadEmailSDK() {
  return new Promise((resolve) => {
    if (window.emailjs) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
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

// 3. Login Alert Email
export async function sendLoginEmail(recipientEmail, recipientName) {
  return await sendGenericEmail({
    to_email: recipientEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: 'SECURITY ALERT',
    email_heading: 'New Login Detected',
    tx_type: 'Account Login',
    amount: '-',
    reference_id: new Date().toLocaleString(),
    custom_message: 'We detected a new successful login to your trading account. If this was not you, please contact support immediately.'
  });
}

// Core Sender Function
async function sendGenericEmail(params) {
  let safeEmail = typeof params.to_email === 'string' ? params.to_email.trim() : '';
  if (!safeEmail || !safeEmail.includes('@')) return false;

  await loadEmailSDK();
  if (!window.emailjs) return false;

  const templateParams = {
    ...params,
    email: safeEmail,
    recipient_email: safeEmail
  };

  try {
    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log('Email Sent Successfully:', response.status);
    return true;
  } catch (error) {
    console.error('Email Failed:', error);
    return false;
  }
}

window.triggerEmail = triggerEmail;
window.sendNotification = sendNotification;
window.sendLoginEmail = sendLoginEmail;
window.sendDepositRequestEmail = sendDepositRequestEmail;
