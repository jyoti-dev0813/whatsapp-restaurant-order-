# Progress

Last updated: 26 October 2026.

Current phase: MVP complete for local demo use. Supabase is implemented in code and SQL, and still needs your free project.

Usage quota was not exposed by the tools in this session. It is unknown. No token or credit numbers were estimated.

## Completed

- Next.js 16.4.3 app with TypeScript, Tailwind, auth, menu, billing, receipts, and WhatsApp links.
- Demo database at `data/demo-db.json` when Supabase env vars are empty.
- SQL migration at `supabase/migrations/001_init.sql`.
- Docs listed in the README.
- Code pushed to https://github.com/jyoti-dev0813/whatsapp-restaurant-order- on `main`. `.env.local` and `data/` were not included.

## Not deployed

The app was not put on a public host. Demo mode uses passwords that are in the repository, and its file database does not survive on a serverless host. [Vercel Hobby](https://vercel.com/docs/plans/hobby) is free and does not bill you, but it is limited to personal, non-commercial use. A cafe product would need Vercel Pro, which requires a card. No host account was signed in, and no payment method was entered.

## Checks actually run

| Check | Result |
| --- | --- |
| `npm test` | 21 passed |
| `npm run lint` | Passed, no warnings |
| `npm run typecheck` | Passed |
| `npm run build` | Passed. Authenticated routes are dynamic (`ƒ`) |

Browser check against `npm start` on http://localhost:3000, signed in as Hearth & Co. owner:

- Demo banner is visible.
- New order: 1 Filter Coffee, customer Asha, phone 9876543210, discount ₹10.
- Saved bill `BILL-20261026-0002`: subtotal ₹80.00, discount ₹10.00, tax ₹3.50, total ₹73.50. Status started as Billed.
- WhatsApp opened `https://wa.me/919876543210` with the bill text. A WhatsApp tab opened. Status became "WhatsApp opened" and the page says CafeBill cannot confirm send or delivery.
- Dashboard revenue for the day was ₹73.50. A cancelled bill stayed in the list and was not included in revenue.
- HTTP check: an anonymous request to `/dashboard` returned 307 to `/login`. With an owner session, the new-order page contained Filter Coffee and not Riverbend Special. The other cafe's session contained Riverbend Special and not Filter Coffee.
- `/api/health` returned `{ ok: true, mode: "demo", persistence: "local-file" }`.
- Menu page showed add, edit, and delete for the owner.
- A 390px-wide viewport showed the top bar, menu button, and stacked menu form.

The PDF button is on the bill page. The file download itself was not opened and inspected.

## Not done

- No Supabase project was created or queried.
- The SQL file was not applied to a database. A unit test only checks that the file enables RLS and contains the tax formula.

## If this session is interrupted

1. Read this file, [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md), and [SETUP.md](SETUP.md).
2. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
3. For local use, `npm run dev` and the demo accounts in the README.
4. To leave demo mode, create a free Supabase project, run the SQL migration, and fill `.env.local` as described in SETUP. Do not add a payment method.
5. Then sign up as two cafes and confirm each cafe cannot see the other's menu or bills.

## Known local data

`data/demo-db.json` may already contain the verification bill and an earlier cancelled bill. Delete that file to reset the seed. It is gitignored.

`.env.local` in this workspace contains a local `DEMO_SESSION_SECRET` so `npm start` can sign demo sessions. It is gitignored. Replace it if you share the machine.
