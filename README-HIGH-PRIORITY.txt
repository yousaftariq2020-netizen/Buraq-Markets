BURAQ MARKETS — HIGH PRIORITY FEATURES SETUP
=============================================

1) FORGOT PASSWORD
------------------
- New page: forgot-password.html
- Login page pe "Forgot Password?" link add ho chuka hai
- Supabase Dashboard → Authentication → URL Configuration
  Redirect URLs mein add karo:
  https://your-vercel-url.vercel.app/**
  https://your-vercel-url.vercel.app/client-login.html

- Email templates: Authentication → Email Templates → Reset Password


2) ADMIN PANEL
--------------
A) Supabase SQL Editor mein run karo:
   supabase-admin-setup.sql

B) Apne admin account ko role do (SQL Editor):
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL@example.com');

C) Admin panel open karo:
   https://your-site.vercel.app/admin-dashboard.html

   Same login use hoga (client-login). Agar role=admin hai to admin panel chalega.

Admin panel se aap kar sakte ho:
- Pending Deposit / Withdraw approve ya reject
- Approve pe balance auto update
- KYC Verify / Reject
- Clients list
- Accounts balance manually set


3) LIVE BALANCE (REALTIME)
--------------------------
Client dashboard ab automatically refresh hota hai jab:
- trading_accounts change ho
- transactions change ho
- profiles change ho

Supabase mein Realtime enable karo:
  Database → Replication → supabase_realtime
  Tables: trading_accounts, transactions, profiles
  (ya SQL):
  alter publication supabase_realtime add table public.trading_accounts;
  alter publication supabase_realtime add table public.transactions;
  alter publication supabase_realtime add table public.profiles;


4) EMAIL NOTIFICATIONS
----------------------
Supabase free tier pe built-in Auth emails kaam karte hain (signup, reset password).

Custom emails (deposit approved etc.) ke liye:
- Supabase Edge Functions + Resend/SendGrid
- Ya manually admin se email bhejo abhi

Auth emails enable:
  Authentication → Providers → Email → enabled


FILES ADDED / UPDATED
---------------------
- forgot-password.html          (NEW)
- client-login.html             (updated - forgot link)
- admin-dashboard.html          (NEW)
- supabase-admin-setup.sql      (NEW)
- client-dashboard.html         (realtime)
- README-HIGH-PRIORITY.txt      (this file)
