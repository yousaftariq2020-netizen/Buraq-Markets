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

  const recipientName = params.to_name || safeEmail.split('@')[0] || 'Valued Trader';
  const heading = params.email_heading || 'Notification';
  const statusTitle = params.status_title || 'Buraq Markets';
  const txType = params.tx_type || '';
  const amountStr = params.amount && params.amount !== '-' ? `$${params.amount} USD` : '';
  const refStr = params.reference_id && params.reference_id !== 'N/A' ? params.reference_id : '';
  const baseMessage = params.custom_message || '';

  // Formatted HTML for Server Nodemailer
  let detailsHtml = '';
  if (txType || amountStr || refStr || statusTitle) {
    detailsHtml = `
      <table style="width:100%; border-collapse:collapse; margin-top:14px; font-size:13px; border-top:1px solid rgba(214,169,59,0.2); padding-top:10px;">
        ${txType ? `<tr><td style="padding:6px 0; color:#8fa0b2; width:130px;">Transaction Type:</td><td style="padding:6px 0; font-weight:700; color:#ffffff;">${txType}</td></tr>` : ''}
        ${amountStr ? `<tr><td style="padding:6px 0; color:#8fa0b2;">Amount:</td><td style="padding:6px 0; font-weight:700; color:#d6a93b; font-size:15px;">${amountStr}</td></tr>` : ''}
        ${refStr ? `<tr><td style="padding:6px 0; color:#8fa0b2;">Reference ID:</td><td style="padding:6px 0; font-family:monospace; color:#ffffff;">${refStr}</td></tr>` : ''}
        ${statusTitle ? `<tr><td style="padding:6px 0; color:#8fa0b2;">Status:</td><td style="padding:6px 0; font-weight:700; color:#16b873;">${statusTitle}</td></tr>` : ''}
      </table>
    `;
  }
  const fullHtmlMessage = `<div style="line-height:1.6; color:#e1e7e8;">${baseMessage}</div>${detailsHtml}`;

  // Formatted Plain Text for EmailJS fallback
  const plainTextMessage = `${baseMessage}${txType ? `\n\n• Type: ${txType}` : ''}${amountStr ? `\n• Amount: ${amountStr}` : ''}${refStr ? `\n• Reference: ${refStr}` : ''}${statusTitle ? `\n• Status: ${statusTitle}` : ''}`;

  // 1. Try server-side Nodemailer first (Active with Gmail SMTP)
  try {
    const serverRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: safeEmail,
        name: recipientName,
        subject: `[${statusTitle}] ${heading} — Buraq Markets`,
        heading: heading,
        message: fullHtmlMessage
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

  // 2. Try EmailJS client-side fallback
  try {
    await loadEmailSDK();
    if (!window.emailjs) return false;

    const templateParams = {
      ...params,
      email: safeEmail,
      recipient_email: safeEmail,
      to_email: safeEmail,
      to_name: recipientName,
      message: plainTextMessage,
      amount: params.amount || '-',
      reference_id: refStr || '-',
      tx_type: txType || 'Notification',
      status: statusTitle
    };

    const response = await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    console.log('EmailJS dispatched successfully:', response?.status);
    return true;
  } catch (error) {
    // Graceful non-blocking catch
    console.warn('Email dispatch notice:', error?.text || error?.message || 'Email delivery completed');
    return false;
  }
}

// 4. Welcome / New Account Registration Email
export async function sendWelcomeEmail(recipientEmail, recipientName, accountDetails = {}) {
  return await sendGenericEmail({
    to_email: recipientEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: 'WELCOME',
    email_heading: 'Welcome to Buraq Markets',
    tx_type: 'Account Registration',
    amount: '-',
    reference_id: accountDetails.account_number || 'N/A',
    custom_message: `Welcome to Buraq Markets! Your trading profile has been created successfully. You can now access your dashboard, complete KYC verification, and fund your account via JazzCash, Easypaisa, UBL Bank Transfer, or Crypto.`
  });
}

// 5. Verification OTP Code Email (Sent via EmailJS)
export async function sendVerificationOtpEmail(recipientEmail, recipientName, otpCode) {
  return await sendGenericEmail({
    to_email: recipientEmail,
    to_name: recipientName || 'Valued Trader',
    status_title: 'VERIFICATION CODE',
    email_heading: 'Verify Your Email Address',
    tx_type: 'Email Verification OTP',
    amount: otpCode,
    reference_id: `OTP: ${otpCode}`,
    custom_message: `Aapka Buraq Markets account verification code hai: ${otpCode}. Is code ko form mein enter karke apna trading account verify karein. Yeh code 10 minutes tak valid hai. Kisi ke sath share na karein.`
  });
}

window.triggerEmail = triggerEmail;
window.sendNotification = sendNotification;
window.sendLoginEmail = sendLoginEmail;
window.sendDepositRequestEmail = sendDepositRequestEmail;
window.sendWithdrawalRequestEmail = sendWithdrawalRequestEmail;
window.sendWelcomeEmail = sendWelcomeEmail;
window.sendVerificationOtpEmail = sendVerificationOtpEmail;

