// Complete Working Email Helper File

window.sendEmail = async function({ to, subject, heading, message, name }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: to,
        subject: subject,
        heading: heading,
        message: message,
        name: name || 'Valued Trader'
      })
    });
    return await response.json();
  } catch (err) {
    console.error('Email Trigger Error:', err);
    return { ok: false, error: err.message };
  }
};

window.sendDepositApprovedEmail = async function(clientEmail, clientName, amount, refNo) {
  return await window.sendEmail({
    to: clientEmail,
    name: clientName,
    subject: 'Deposit Request Approved — Buraq Markets',
    heading: 'Deposit Successfully Approved',
    message: `Your deposit request of $${amount} USD (Reference: ${refNo}) has been approved and credited to your trading account balance.`
  });
};

window.sendDepositRejectedEmail = async function(clientEmail, clientName, amount, refNo, reason) {
  const customReason = reason ? `<br><br><strong>Reason:</strong> ${reason}` : '';
  return await window.sendEmail({
    to: clientEmail,
    name: clientName,
    subject: 'Deposit Request Unsuccessful — Buraq Markets',
    heading: 'Deposit Request Unsuccessful',
    message: `Your deposit request of $${amount} USD (Reference: ${refNo}) could not be processed at this time.${customReason}`
  });
};
