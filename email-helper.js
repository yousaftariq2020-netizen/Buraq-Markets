// Master Helper File for Email & Supabase Utility Support

async function sendEmail({ to, subject, heading, message, name }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        heading,
        message,
        name: name || 'Valued Trader',
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error triggering email helper:', error);
    return { ok: false, error: error.message };
  }
}

// Global Email Helpers
window.sendDepositApprovedEmail = async function(clientEmail, clientName, amount, refNo) {
  return await sendEmail({
    to: clientEmail,
    name: clientName,
    subject: 'Deposit Request Approved — Buraq Markets',
    heading: 'Deposit Successfully Approved',
    message: `We are pleased to inform you that your deposit request of <strong>$${amount} USD</strong> (Reference: <strong>${refNo}</strong>) has been approved and credited to your trading account balance.`
  });
};

window.sendDepositRejectedEmail = async function(clientEmail, clientName, amount, refNo, reason) {
  const customReason = reason ? `<br><br><strong>Reason:</strong> ${reason}` : '';
  return await sendEmail({
    to: clientEmail,
    name: clientName,
    subject: 'Deposit Request Unsuccessful — Buraq Markets',
    heading: 'Deposit Request Unsuccessful',
    message: `We regret to inform you that your deposit request of <strong>$${amount} USD</strong> (Reference: <strong>${refNo}</strong>) could not be processed at this time following review by our compliance team.${customReason}`
  });
};

window.sendEmail = sendEmail;

// Safe Wallet / User Session Fallback (Prevents Wallet Loading Freeze)
window.getLoggedInUser = window.getLoggedInUser || function() {
  try {
    const userStr = localStorage.getItem('buraq_user') || localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};
