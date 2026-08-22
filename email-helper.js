// Simplified Direct Fetch Email Helper

export async function sendEmail(options) {
  try {
    const payload = typeof options === 'string' ? { message: options } : options;

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: payload.to || payload.email,
        subject: payload.subject,
        heading: payload.heading,
        message: payload.message || payload.body || '',
        name: payload.name || 'Valued Trader'
      })
    });

    const data = await response.json();
    console.log('Email Response:', data);
    return data;
  } catch (err) {
    console.error('Email Fetch Error:', err);
    return { ok: false, error: err.message };
  }
}

export async function sendNotification(data) {
  return await sendEmail(data);
}

export async function sendDepositApprovedEmail(email, name, amount, refNo) {
  return await sendEmail({
    to: email,
    name: name,
    subject: 'Deposit Approved — Buraq Markets',
    heading: 'Deposit Successfully Approved',
    message: `Your deposit request of $${amount} (Ref: ${refNo}) has been approved and credited to your trading account.`
  });
}

export async function sendDepositRejectedEmail(email, name, amount, refNo, reason) {
  return await sendEmail({
    to: email,
    name: name,
    subject: 'Deposit Unsuccessful — Buraq Markets',
    heading: 'Deposit Request Unsuccessful',
    message: `Your deposit request of $${amount} (Ref: ${refNo}) was rejected. ${reason ? 'Reason: ' + reason : ''}`
  });
}

if (typeof window !== 'undefined') {
  window.sendEmail = sendEmail;
  window.sendNotification = sendNotification;
  window.sendDepositApprovedEmail = sendDepositApprovedEmail;
  window.sendDepositRejectedEmail = sendDepositRejectedEmail;
}
