// Dynamic Client Email Helper

export async function sendNotification(recipientEmail, recipientName, actionType, customMessage = '') {
  return await triggerEmail(recipientEmail, recipientName, actionType, customMessage);
}

export async function triggerEmail(recipientEmail, recipientName, actionType, customMessage = '') {
  let safeEmail = '';
  if (typeof recipientEmail === 'string') {
    safeEmail = recipientEmail.trim();
  } else if (recipientEmail && typeof recipientEmail === 'object') {
    safeEmail = String(recipientEmail.email || recipientEmail.to || '').trim();
  } else {
    safeEmail = String(recipientEmail || '').trim();
  }

  // Strict check: Agar client email missing ho to alert de, aap ki mail par na bheje
  if (!safeEmail || safeEmail === 'undefined' || safeEmail === '[object Object]') {
    console.error('Email Trigger Failed: Client email is missing in transaction data.');
    return false;
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (response.ok && result.ok) {
      console.log('Email sent successfully to client:', safeEmail);
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

window.sendNotification = sendNotification;
window.triggerEmail = triggerEmail;
