// Dynamic Client Email Helper with Detailed Professional Template

export async function sendNotification(recipientEmail, recipientName, actionType, txDetails = {}) {
  return await triggerEmail(recipientEmail, recipientName, actionType, txDetails);
}

export async function triggerEmail(recipientEmail, recipientName, actionType, txDetails = {}) {
  let safeEmail = '';
  if (typeof recipientEmail === 'string') {
    safeEmail = recipientEmail.trim();
  } else if (recipientEmail && typeof recipientEmail === 'object') {
    safeEmail = String(recipientEmail.email || recipientEmail.to || '').trim();
  } else {
    safeEmail = String(recipientEmail || '').trim();
  }

  if (!safeEmail || safeEmail === 'undefined' || safeEmail === '[object Object]') {
    console.error('Email Trigger Failed: Client email is missing.');
    return false;
  }

  const isApproved = String(actionType).toLowerCase() === 'approve';
  const emailSubject = isApproved 
    ? 'Deposit Approved — Buraq Markets' 
    : 'Deposit Declined — Buraq Markets';
    
  const emailHeading = isApproved ? 'Transaction Approved' : 'Transaction Declined';
  
  // Extract transaction details or set defaults
  const amount = txDetails.amount ? `$${txDetails.amount}` : 'N/A';
  const reference = txDetails.reference || 'N/A';
  const txType = txDetails.type || 'Deposit';

  const defaultMessage = isApproved 
    ? `We are pleased to inform you that your request for <b>${txType} (${amount})</b> with Reference ID <b>${reference}</b> has been successfully verified and credited to your account.`
    : `We regret to inform you that your request for <b>${txType} (${amount})</b> with Reference ID <b>${reference}</b> could not be processed. If you believe this is an error, please reach out to our support team.`;

  const payload = {
    to: safeEmail,
    name: (typeof recipientName === 'string' && recipientName) ? recipientName : 'Valued Trader',
    subject: emailSubject,
    heading: emailHeading,
    message: defaultMessage
  };

  try {
    const response = await fetch('https://buraq-markets-dark-dashboard.vercel.app/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return response.ok && result.ok;
  } catch (error) {
    console.error('Network Error sending email:', error);
    return false;
  }
}

window.sendNotification = sendNotification;
window.triggerEmail = triggerEmail;
