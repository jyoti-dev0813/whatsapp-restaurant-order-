# CafeBill

CafeBill is a multi-cafe billing app for cafes and restaurants. Staff sign in, build a bill from that cafe's menu, save it, print or download a receipt, and open WhatsApp with the bill already written. The staff member still presses Send.

Each cafe has its own menu, tax settings, staff, customers, and bills. One cafe cannot read another cafe's data.

No paid service is required to run it locally.

## What works now

- Email and password sign-in, with protected pages.
- Demo mode when Supabase is not configured. Data is stored in `data/demo-db.json` on this computer and is labeled as demo data.
- Supabase Auth, Postgres, and row-level security when you add a free Supabase project. That path is implemented and has not been run against a live project in this workspace.
- Menu categories and items, including price and availability.
- Orders with customer name and phone, quantity, discount, tax, and total.
- Server-side prices and totals. The browser cannot set the item price.
- Unique bill numbers such as `BILL-20261026-0002`.
- Order history, bill status, print view, and a PDF download.
- WhatsApp click-to-chat. Opening the link records "WhatsApp opened". It does not mean the message was sent or delivered.
- Owner and staff roles. Staff can bill. Only the owner edits the menu, settings, and invites.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and sign in with a demo account:

| Cafe | Role | Email | Password |
| --- | --- | --- | --- |
| Hearth & Co. | Owner | owner@demo.local | owner-demo-123 |
| Hearth & Co. | Staff | staff@demo.local | staff-demo-123 |
| Riverbend Cafe | Owner | other@demo.local | other-demo-123 |

`npm start` after a production build needs `DEMO_SESSION_SECRET` in `.env.local`. See [SETUP.md](SETUP.md).

## Docs

- [SETUP.md](SETUP.md) — install, demo mode, and Supabase
- [ARCHITECTURE.md](ARCHITECTURE.md) — app structure, money, and tenancy
- [SECURITY.md](SECURITY.md) — auth, RLS, and secrets
- [DEPLOYMENT.md](DEPLOYMENT.md) — optional free hosting and its limits
- [PROJECT_PLAN.md](PROJECT_PLAN.md) — how the work was phased
- [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md) — what is done and what is not
- [PROGRESS.md](PROGRESS.md) — current status and how to continue

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
