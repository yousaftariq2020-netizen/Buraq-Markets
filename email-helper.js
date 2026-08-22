// Complete Email Helper with Fallback Parameters Support

export async function sendEmail(options) {
  try {
    // Standardize object params
    const payload = {
      to: options.to || options.email || options.recipient,
      subject: options.subject || 'Notification — Buraq Markets',
      heading: options.heading || options.title || 'Account Notification',
      message: options.message || options.body || options.text || '',
      name: options.name || options.user_name || 'Valued Trader'
    };

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Email Server Response:', data);
    return data;
  } catch (err) {
    console.error('Email Trigger Error:', err);
    return { ok: false, error: err.message };
  }
}

export async function sendNotification(data) {
  if (typeof data === 'string') {
    return await sendEmail({ message: data });
  }
  return await sendEmail(data || {});
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

// Attach to global window
if (typeof window !== 'undefined') {
  window.sendEmail = sendEmail;
  window.sendNotification = sendNotification;
  window.sendDepositApprovedEmail = sendDepositApprovedEmail;
  window.sendDepositRejectedEmail = sendDepositRejectedEmail;
}
