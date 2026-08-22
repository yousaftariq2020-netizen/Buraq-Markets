// Complete Fixed EmailJS Helper (No CDN Import Crash)

const EMAILJS_SERVICE_ID = 'service_9w4z5q';
const EMAILJS_TEMPLATE_ID = 'template_ly4i099';
const EMAILJS_PUBLIC_KEY = 'srCNMfHCpU7OtJ4hJ';

// Dynamically load EmailJS script safely
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

export async function sendNotification(recipientEmail, recipientName, actionType, txDetails = {}) {
  return await triggerEmail(recipientEmail, recipientName, actionType, txDetails);
}

export async function triggerEmail(recipientEmail, recipientName, actionType, txDetails = {}) {
  let safeEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';

  if (!safeEmail || !safeEmail.includes('@')) {
    console.error('Email Trigger Failed: Invalid client email.');
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
    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log('EmailJS Success:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('EmailJS Failed:', error);
    return false;
  }
}

window.sendNotification = sendNotification;
window.triggerEmail = triggerEmail;
