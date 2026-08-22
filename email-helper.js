// Email Helper with Export Support for Buraq Markets

export async function sendEmail({ to, subject, heading, message, name }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        heading,
        message,
        name: name || 'Valued Trader'
      })
    });
    return await response.json();
  } catch (err) {
    console.error('Email Trigger Error:', err);
    return { ok: false, error: err.message };
  }
}

// Fixed: Required by deposit.html & admin panel
export async function sendNotification(data) {
  return await sendEmail({
    to: data.to || data.email,
    subject: data.subject || 'Notification — Buraq Markets',
    heading: data.heading || data.title || 'Account Notice',
    message: data.message || data.body || '',
    name: data.name || 'Valued Trader'
  });
}

export async function sendDepositApprovedEmail(clientEmail, clientName, amount, refNo) {
  return await sendEmail({
    to: clientEmail,
    name: clientName,
    subject: 'Deposit Request Approved — Buraq Markets',
    heading: 'Deposit Successfully Approved',
    message: `Your deposit request of $${amount} USD (Reference: ${refNo}) has been approved and credited to your trading account balance.`
  });
}

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

// Global window fallbacks
if (typeof window !== 'undefined') {
  window.sendEmail = sendEmail;
  window.sendNotification = sendNotification;
  window.sendDepositApprovedEmail = sendDepositApprovedEmail;
  window.sendDepositRejectedEmail = sendDepositRejectedEmail;
}
