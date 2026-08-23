// Updated EmailJS Integration Helper

const EMAILJS_SERVICE_ID = 'service_94w4z5q';
const EMAILJS_PUBLIC_KEY = 'srCNMfHCpU7OtJ4hJ';

// Template IDs
const TEMPLATE_STATUS = 'template_ly4i099'; // Admin Approval/Decline/Request
const TEMPLATE_LOGIN = 'template_5mlh8in';   // Login Notification

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

// 1. Admin Approve / Reject Email Trigger
export async function triggerEmail(recipientEmail, recipientName, actionType, txDetails = {}) {
  let safeEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';

  if (!safeEmail || !safeEmail.includes('@')) {
    console.error('Email Trigger Failed: Invalid client email.', recipientEmail);
    return false;
  }

  await loadEmailSDK();

  if (!window.emailjs) {
    console.error('EmailJS SDK Failed to Load.');
    return false;
  }

  const isApproved = String(actionType).toLowerCase() === 'approve';

  const templateParams = {
    to_email: safeEmail,
    email: safeEmail,
    recipient_email: safeEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: isApproved ? 'APPROVED' : 'DECLINED',
    email_heading: isApproved ? 'Transaction Successful' : 'Transaction Declined',
    tx_type: txDetails.type || 'Deposit',
    amount: txDetails.amount || '0',
    reference_id: txDetails.reference || 'N/A',
    custom_message: isApproved 
      ? 'Your request has been successfully processed and credited to your trading account.' 
      : 'Your request could not be processed at this time. Please contact support for further details.'
  };

  try {
    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_STATUS, templateParams);
    console.log('Status Email Sent:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('EmailJS Failed:', error);
    return false;
  }
}

// 2. Client Login Email Trigger
export async function sendLoginEmail(recipientEmail, recipientName) {
  let safeEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';
  if (!safeEmail || !safeEmail.includes('@')) return false;

  await loadEmailSDK();

  const templateParams = {
    to_email: safeEmail,
    email: safeEmail,
    to_name: recipientName || 'Valued Trader',
    login_time: new Date().toLocaleString()
  };

  try {
    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_LOGIN, templateParams);
    console.log('Login Email Sent:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('Login Email Failed:', error);
    return false;
  }
}

// 3. Client Deposit Request Submitted Email Trigger
export async function sendDepositRequestEmail(recipientEmail, recipientName, amount, reference, type = 'Deposit') {
  let safeEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';
  if (!safeEmail || !safeEmail.includes('@')) return false;

  await loadEmailSDK();

  const templateParams = {
    to_email: safeEmail,
    email: safeEmail,
    recipient_email: safeEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: 'PENDING',
    email_heading: 'Deposit Request Received',
    tx_type: type,
    amount: amount || '0',
    reference_id: reference || 'N/A',
    custom_message: 'Your deposit request has been received and is currently pending review. Our team will verify and credit your account shortly.'
  };

  try {
    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_STATUS, templateParams);
    console.log('Deposit Request Email Sent:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('Deposit Request Email Failed:', error);
    return false;
  }
}

window.triggerEmail = triggerEmail;
window.sendLoginEmail = sendLoginEmail;
window.sendDepositRequestEmail = sendDepositRequestEmail;
