BURAQ MARKETS - SUPABASE SETUP

1) Open your Supabase project.
2) Go to SQL Editor.
3) Open/copy supabase-schema.sql and Run it once.
4) Upload/deploy this entire folder to your hosting.
5) Use HTTPS in production.

Integrated pages:
- open-account.html: Supabase Auth signup + profile metadata
- client-login.html: Supabase Auth email/password login
- client-dashboard.html: loads the logged-in user's profile, account and transactions
- contact.html: saves contact messages to public.contact_messages

Important:
- The browser only uses the Supabase publishable key. Never add a service-role/secret key to frontend files.
- If Supabase email confirmation is enabled, users must confirm their email before they can log in.
- Trading balances are initialized to 0. They should be updated by your trusted backend/admin/trading integration, not by the public browser.


DEPOSIT PAGE UPDATE
-------------------
The dashboard Deposit button now opens deposit.html.

Before testing deposits, run supabase-deposit-policy.sql once in Supabase SQL Editor.
This enables logged-in users to submit their own transaction/deposit requests.

Deposit requests are inserted into public.transactions with:
- type: Deposit - <payment method>
- amount: requested USD amount
- reference: supplied payment reference or generated DEP reference
- status: Pending

The page does NOT automatically increase the trading balance. An admin/backend review should approve a deposit before any balance is credited.


CLIENT VERIFICATION (KYC) UPDATE
---------------------------------
The dashboard now shows a "Verify Identity" link under Profile & KYC whenever
a client is not yet Verified. It opens verify-identity.html.

Before testing verification, run supabase-kyc-schema.sql once in the Supabase
SQL Editor. This creates:
- public.kyc_documents (stores each submission + its status)
- a private storage bucket "kyc-documents" (each user can only access their
  own folder inside it)

Client flow:
1. Client uploads an ID document (CNIC/Passport) and a selfie holding it.
2. Files are stored privately in Supabase Storage under kyc-documents/{user_id}/...
3. A row is created in kyc_documents with status "Pending".
4. The dashboard shows "Verification in progress" until you review it.

Admin flow (manual approval, done by you — not exposed to the browser):
1. Open Supabase Dashboard > Table Editor > kyc_documents.
2. Open the file paths in Storage > kyc-documents to view the uploaded ID/selfie.
3. Set that row's status to "Verified" or "Rejected" (add an admin_note if rejecting).
4. Also update the matching row in public.profiles > kyc_status to "Verified"
   or "Rejected" so the client's dashboard reflects the decision.

Note: there is no public "update" policy on kyc_documents or profiles.kyc_status,
so a client's own browser session can never approve or reject their own
verification — only you, working directly in the Supabase dashboard, can.
