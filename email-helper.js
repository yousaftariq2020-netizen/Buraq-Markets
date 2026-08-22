// Master Email Helper - Fixes Wallet Loading & Direct Email Sending

// Core Email Sender Function
export async function sendEmail(options) {
  try {
    const payload = typeof options === 'string' ? { message: options } : options;
    
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.to || payload.email || payload.recipient,
        subject: payload.subject || 'Notification — Buraq Markets',
        heading: payload.heading || payload.title || 'Account Notification',
        message: payload.message || payload.body || payload.text || '',
        name: payload.name || payload.user_name || 'Valued Trader'
      })
    });

    const data = await response.json();
    console.log('Email Status:', data);
    return data;
  } catch (err) {
    console.error('Email Error:', err);
    return { ok: false, error: err.message };
  }
}

// Function 1: Required by deposit.html (Module Export)
export async function sendNotification(data) {
  return await sendEmail(data);
}

// Function 2: Required for Deposit Approval
export async function sendDepositApprovedEmail(clientEmail, clientName, amount, refNo) {
  return await sendEmail({
    to: clientEmail,
    name: clientName,
    subject: 'Deposit Request Approved — Buraq Markets',
    heading: 'Deposit Successfully Approved',
    message: `Your deposit request of $${amount} USD (Reference: ${refNo}) has been approved and credited to your trading account balance.`
  });
}

// Function 3: Required for Deposit Rejection
export async function sendDepositRejectedEmail(clientEmail, clientName, amount, refNo, reason) {
  const customReason = reason ? `<br><br><strong>Reason:</strong> ${reason}` : '';
  return await sendEmail({
    to: clientEmail,
    name: clientName,
    subject: 'Deposit Request Unsuccessful — Buraq Markets',
    heading: 'Deposit Request Unsuccessful',
    message: `Your deposit request of $${amount} USD (Reference: ${refNo}) could not be processed at this time.${customReason}`
  });
}

// Global Attachments (So non-module scripts also work without crashing)
if (typeof window !== 'undefined') {
  window.sendEmail = sendEmail;
  window.sendNotification = sendNotification;
  window.sendDepositApprovedEmail = sendDepositApprovedEmail;
  window.sendDepositRejectedEmail = sendDepositRejectedEmail;
}
