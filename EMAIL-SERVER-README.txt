BURAQ MARKETS — SERVER EMAIL SETUP

This version replaces browser-side EmailJS sending with a Vercel serverless
function at /api/send-email.js using Nodemailer + Gmail SMTP.

1. Replace the existing GitHub project files with this ZIP and push/commit.
2. Vercel should redeploy the connected GitHub project.
3. In Vercel Project Settings -> Environment Variables, add:

   GMAIL_USER = buraqtrader43@gmail.com
   GMAIL_APP_PASSWORD = <your Google 16-character App Password>

   Set them for Production and Preview.

4. Google App Password:
   - Turn on 2-Step Verification for buraqtrader43@gmail.com.
   - Google Account -> Security -> App passwords.
   - Create an App Password and paste it ONLY into Vercel.
   - Never put the App Password in GitHub, HTML, JavaScript, or this ZIP.

5. Redeploy after adding/changing environment variables.

Email flow:
   Client browser -> /api/send-email -> Vercel -> Gmail SMTP -> Client email

The following notifications use the server endpoint:
- Deposit request received
- Withdrawal request received
- KYC documents received
- Deposit approved/rejected
- Withdrawal approved/rejected
- KYC verified/rejected

The database action is not rolled back if email delivery fails. The page logs
an email failure in the browser console, while the Vercel function logs the
server-side SMTP error.

IMPORTANT:
The Gmail account must allow App Password authentication. If Google does not
show the App passwords option, check the account's 2-Step Verification and
account/security restrictions.
