BURAQ MARKETS — EMAIL FIX

Files changed:
- email-helper.js
- deposit.html
- withdraw.html
- verify-identity.html
- admin-dashboard.html

What was fixed:
1. EmailJS sends are now awaited before redirects/UI refreshes.
2. The helper now returns a real success/failure result and logs the EmailJS status.
3. Notification parameters now include to_email, to_name, subject, heading, message,
   plus name/email/title/time for compatibility with the existing EmailJS template.
4. Database actions still succeed even if an email fails; the browser console now shows
   exactly where the notification failed.

EmailJS dashboard requirement:
- Service ID: service_94w4z5q
- Template ID: template_ly4i099
- To Email: {{to_email}}
- Subject: {{subject}}
- Reply To: {{to_email}}
- Body can use {{heading}}, {{message}}, and optionally {{to_name}} / {{time}}.

Deployment:
1. Replace the project files in the GitHub repository with these files.
2. Push/commit the changes.
3. Vercel will automatically redeploy the connected project.
4. Hard-refresh the live site (Ctrl+Shift+R) before testing.
5. Submit one test deposit and check EmailJS History.
6. If the history says OK but the client still receives nothing, inspect the
   browser console for the exact recipient/status and check the recipient Gmail
   Spam/Promotions/All Mail folders.
