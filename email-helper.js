// Updated email-helper.js with Fallback Email

export async function sendNotification(recipientEmail, recipientName, actionType, customMessage = '') {
  return await triggerEmail(recipientEmail, recipientName, actionType, customMessage);
}

export async function triggerEmail(recipientEmail, recipientName, actionType, customMessage = '') {
  // Fallback email agar table mein email missing ho
  const finalEmail = (recipientEmail && recipientEmail.trim() !== '' && recipientEmail !== 'undefined') 
    ? recipientEmail 
    : 'yousaftariq2020@gmail.com';

  const isApproved = String(actionType).toLowerCase() === 'approve';
  const emailSubject = isApproved ? 'Transaction Approved — Buraq Markets' : 'Transaction Rejected — Buraq Markets';
  const emailHeading = isApproved ? 'Transaction Successful' : 'Transaction Declined';
  
  const defaultMessage = isApproved 
    ? 'Your request has been successfully processed and approved. Thank you for trading with Buraq Markets.' 
    : 'Your request could not be processed at this time. Please contact support for further details.';

  const payload = {
    to: finalEmail,
    name: recipientName || 'Valued Trader',
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
      alert('Notification email sent successfully to ' + finalEmail + '!');
      return true;
    } else {
      console.error('Email API Error:', result);
      alert('Email failed: ' + (result.error || 'Unknown error'));
      return false;
    }
  } catch (error) {
    console.error('Network Error sending email:', error);
    alert('Failed to connect to email service.');
    return false;
  }
}

// Global backup
window.sendNotification = sendNotification;
window.triggerEmail = triggerEmail;
