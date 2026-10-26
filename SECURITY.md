# Security

## Authentication

Demo mode signs an HMAC session cookie named `cafebill_session`. The cookie is HTTP-only, `SameSite=Lax`, and marked Secure in production. The payload is the user id and an expiry. Passwords are stored as scrypt hashes in the local demo file.

In production demo mode the HMAC key must be `DEMO_SESSION_SECRET` with at least 32 characters. There is no fallback key. Development uses a built-in key so `npm run dev` works before you create a secret. Do not expose demo mode on the public internet. The demo passwords are in the repository.

Supabase mode uses Supabase Auth cookies through `@supabase/ssr`. The server calls `getUser()` and then loads `profiles`. A missing profile sends the person to onboarding.

`src/proxy.ts` only checks that a session cookie is present. Pages and actions call `requireUser()` or `requireActor()` again.

## Authorization

Server actions take the cafe id from the session. Order, menu, and settings payloads do not include a cafe id.

Staff cannot change the menu or settings. The demo store checks the role. Supabase policies check `current_role()` as well, so a request made with the anon key still cannot cross that line.

Orders and order items cannot be inserted or updated by the logged-in role directly. `place_order`, `mark_whatsapp_opened`, and `cancel_order` are security-definer functions. They price the bill from `menu_items` and copy those amounts onto the order. A trigger rejects later changes to bill totals, bill number, tax snapshot, and cafe name.

Profile updates cannot change `cafe_id` or `role`.

## Row level security

`supabase/migrations/001_init.sql` enables RLS on every tenant table. Policies compare `cafe_id` to `current_cafe_id()`, which reads the signed-in profile and bypasses RLS only for that lookup. Anonymous users have no policies and no grants.

This SQL has not been executed against a live Supabase project in this workspace. Run it yourself in the SQL editor before relying on it. After that, sign in as two cafes and confirm each one cannot see the other's menu or bills.

## Secrets

- `.env.local` is gitignored. `.env.example` has empty placeholders.
- The anon key is public by design and is still only read on the server in this app.
- Do not add the service-role key to client code. The MVP does not use it.
- Customer phone numbers are stored for the bill and the WhatsApp link. They are not written to application logs on purpose. Database errors are mapped to short messages before they reach the browser.

## Input

Zod validates form and order payloads. Phone numbers are reduced to digits and checked for length. Names and notes lose control characters so a customer name cannot add extra WhatsApp lines. React renders text, so menu names are not injected as HTML.

## WhatsApp

The wa.me link is not proof of delivery. The status label and the note on the bill say that CafeBill cannot confirm send or delivery.

## What this does not do

- No payment collection.
- No service-role bypass.
- No claim that a live RLS test has already been run.
- No public demo deployment.
