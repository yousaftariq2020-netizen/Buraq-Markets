// Email Helper with full functionality and Admin Panel Trigger

async function triggerEmail(recipientEmail, recipientName, actionType, customMessage = '') {
  if (!recipientEmail) {
    console.error('Email trigger failed: No recipient email provided.');
    return;
  }

  const isApproved = String(actionType).toLowerCase() === 'approve';
  const emailSubject = isApproved ? 'Transaction Approved — Buraq Markets' : 'Transaction Rejected — Buraq Markets';
  const emailHeading = isApproved ? 'Transaction Successful' : 'Transaction Declined';
  
  const defaultMessage = isApproved 
    ? 'Your request has been successfully processed and approved. Thank you for trading with Buraq Markets.' 
    : 'Your request could not be processed at this time. Please contact support for further details.';

  const payload = {
    to: recipientEmail,
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
      alert('Notification email sent to user!');
    } else {
      console.error('Email API Error:', result);
      alert('Email failed: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Network Error sending email:', error);
    alert('Failed to connect to email service.');
  }
}

// Window globally expose for admin-dashboard.html
window.triggerEmail = triggerEmail;
