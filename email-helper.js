// Robust and Error-Proof email-helper.js

export async function sendNotification(recipientEmail, recipientName, actionType, customMessage = '') {
  return await triggerEmail(recipientEmail, recipientName, actionType, customMessage);
}

export async function triggerEmail(recipientEmail, recipientName, actionType, customMessage = '') {
  // Convert any input to string safely to avoid .trim() errors
  let safeEmail = '';
  if (typeof recipientEmail === 'string') {
    safeEmail = recipientEmail.trim();
  } else if (recipientEmail && typeof recipientEmail === 'object') {
    safeEmail = String(recipientEmail.email || recipientEmail.to || '').trim();
  } else {
    safeEmail = String(recipientEmail || '').trim();
  }

  // Fallback email if empty or invalid
  if (!safeEmail || safeEmail === 'undefined' || safeEmail === '[object Object]') {
    safeEmail = 'yousaftariq2020@gmail.com';
  }

  const isApproved = String(actionType).toLowerCase() === 'approve';
  const emailSubject = isApproved ? 'Transaction Approved — Buraq Markets' : 'Transaction Rejected — Buraq Markets';
  const emailHeading = isApproved ? 'Transaction Successful' : 'Transaction Declined';
  
  const defaultMessage = isApproved 
    ? 'Your request has been successfully processed and approved. Thank you for trading with Buraq Markets.' 
    : 'Your request could not be processed at this time. Please contact support for further details.';

  const payload = {
    to: safeEmail,
    name: (typeof recipientName === 'string' && recipientName) ? recipientName : 'Valued Trader',
    subject: emailSubject,
    heading: emailHeading,
    message: customMessage || defaultMessage
  };

  try {
    const response = await fetch('https://buraq-markets-dark-dashboard.vercel.app/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.ok) {
      console.log('Email sent successfully!');
      return true;
    } else {
      console.error('Email API Error:', result);
      return false;
    }
  } catch (error) {
    console.error('Network Error sending email:', error);
    return false;
  }
}

// Global window fallbacks
window.sendNotification = sendNotification;
window.triggerEmail = triggerEmail;
