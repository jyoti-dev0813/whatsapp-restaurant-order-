# Deployment

Local development is the supported setup. Do not turn on a host, database, or add-on that asks for a credit card.

## Stay local

```bash
npm run build
npm start
```

Production demo mode needs `DEMO_SESSION_SECRET` in `.env.local`. See [SETUP.md](SETUP.md). Demo passwords are public in this repository, so do not put this mode on a public URL.

## Supabase

Use a free Supabase project and the SQL file in `supabase/migrations`. Before you depend on the free plan, read the current limits on https://supabase.com/pricing. Check, rather than assume:

- how many free projects you can keep
- database size, egress, and auth users
- whether an inactive project is paused
- whether auth emails are included and capped

Do not upgrade the project, enable a paid add-on, or enter billing details. If a feature in the dashboard says it needs Pro, skip it. This app does not need the service-role key, storage, or realtime.

The anon key may be public. The service-role key may not.

## App hosting

This repository does not deploy anywhere. A free application host can still pause, sleep, or change its terms. Read the current free-tier terms before using one. Vercel, Netlify, and similar hosts have had free tiers that are not a promise of permanent hosting, and some features or bandwidth past the free allowance can require a paid plan.

If you deploy later:

- Set the Supabase URL and anon key, or keep the app local.
- Set `DEMO_SESSION_SECRET` only if you intentionally run demo mode, and do not do that on a public site.
- Set `NEXT_PUBLIC_APP_URL` to the site origin.
- Do not set a service-role key in a public environment variable.
- Confirm the host will not enable billing automatically.

CafeBill does not call a paid AI, SMS, email, or WhatsApp API.

## WhatsApp

Click-to-chat is free and manual. The official WhatsApp Business Platform can charge for conversations and templates. It is not part of this deployment.
