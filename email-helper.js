// Clean Working Email Helper & Notification Utility

export async function sendEmail({ to, subject, heading, message, name }) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: to,
        subject: subject || 'Buraq Markets Notification',
        heading: heading || 'Account Update',
        message: message || '',
        name: name || 'Valued Trader'
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Email Error:', err);
    return { ok: false, error: err.message };
  }
}

export async function sendNotification(data) {
  if (typeof data === 'string') return await sendEmail({ message: data });
  return await sendEmail(data || {});
}

export async function sendDepositApprovedEmail(email, name, amount, refNo) {
  return await sendEmail({
    to: email,
    name: name,
    subject: 'Deposit Approved — Buraq Markets',
    heading: 'Deposit Approved',
    message: `Your deposit request of $${amount} (Ref: ${refNo}) has been approved.`
  });
}

export async function sendDepositRejectedEmail(email, name, amount, refNo, reason) {
  return await sendEmail({
    to: email,
    name: name,
    subject: 'Deposit Rejected — Buraq Markets',
    heading: 'Deposit Unsuccessful',
    message: `Your deposit request of $${amount} (Ref: ${refNo}) was rejected. ${reason ? 'Reason: ' + reason : ''}`
  });
}

if (typeof window !== 'undefined') {
  window.sendEmail = sendEmail;
  window.sendNotification = sendNotification;
  window.sendDepositApprovedEmail = sendDepositApprovedEmail;
  window.sendDepositRejectedEmail = sendDepositRejectedEmail;
}
