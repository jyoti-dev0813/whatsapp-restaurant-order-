# Feature checklist

## Done

- [x] Next.js App Router, TypeScript strict, Tailwind CSS
- [x] Sign up, sign in, sign out, and protected pages
- [x] Demo mode with a visible banner and a local file database
- [x] Separate cafe records, menu, settings, customers, and orders
- [x] Owner and staff roles
- [x] Staff invite codes without email delivery
- [x] Menu create, edit, delete, categories, and availability
- [x] New order screen with quantities
- [x] Customer name and phone
- [x] Discount, tax, subtotal, and total in integer paise
- [x] Server-side prices and totals
- [x] Unique bill numbers and order ids
- [x] Price and tax snapshots on the bill
- [x] Order history, status, and bill detail
- [x] Print view and browser PDF download
- [x] WhatsApp click-to-chat with a prepared message
- [x] Status `whatsapp_opened` without a delivered claim
- [x] Duplicate submit protection with a client request id
- [x] Validation, loading text, empty states, and action errors
- [x] Responsive shell with a mobile menu button
- [x] Supabase schema, RLS policies, and server queries
- [x] Unit tests for money, tax, phone, sessions, tenant isolation, and idempotency
- [x] Lint, typecheck, and production build

## Not done, or not verified live

- [ ] A real Supabase project. Credentials were not available, and none were created.
- [ ] Executing the SQL migration on Supabase and signing in through Supabase Auth
- [ ] A live test that one Supabase user cannot read another cafe's rows. Demo mode isolation was tested
- [ ] Official WhatsApp Business API, templates, or delivery webhooks
- [ ] Paid subscriptions, inventory, loyalty, or advanced reports
- [ ] Email delivery for staff invites
- [ ] Pagination beyond the latest 500 bills in Supabase mode
- [ ] Public deployment

## Intentionally out of scope

- Payment processing
- Service-role keys in the app
- Marking a WhatsApp message as sent or delivered
