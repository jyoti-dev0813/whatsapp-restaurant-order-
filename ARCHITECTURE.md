# Architecture

CafeBill is a Next.js 16 App Router application. Authenticated pages render on each request so one cafe never receives another cafe's cached bill.

## Apps and folders

- `src/app` — pages. Public routes are `/`, `/login`, and `/signup`. Workspace routes live under `src/app/(app)/(workspace)`.
- `src/proxy.ts` — optimistic gate. It redirects anonymous visitors away from workspace URLs. Real authorization still happens on the server.
- `src/server` — session lookup and server actions.
- `src/lib/billing` — money math, bill numbers, dashboard totals, and WhatsApp text.
- `src/lib/demo` — local file database used only when Supabase is not configured.
- `src/lib/supabase` — user-scoped Supabase client and queries. No service-role key.
- `supabase/migrations/001_init.sql` — schema, row-level security, and billing functions.

## Tenancy

A user has at most one cafe. The cafe id comes from the signed-in profile, never from a form field.

- Demo mode stores `cafeId` on the user record and every query filters with that id.
- Supabase stores membership in `profiles`. `place_order` reads `auth.uid()` and ignores any cafe id in the payload. Policies use `current_cafe_id()`.

Orders copy the cafe name, item name, item price, tax rate, tax label, and receipt footer at save time. Later menu or tax edits do not change old bills.

## Money

Currency is INR. Amounts are integer paise. One rupee is 100 paise.

```
line = price_paise * quantity
subtotal = sum(lines)
discount cannot exceed subtotal
taxable = subtotal - discount
tax = floor((taxable * tax_rate_bps + 5000) / 10000)
total = taxable + tax
```

`tax_rate_bps` is the percent times 100. 5% is 500. The same expression is in `src/lib/billing/calculate.ts` and in `place_order`. Half a paise rounds up.

Display formatting uses `Intl` and is not used for calculations. Prices are capped at ₹1,00,000. A bill has at most 40 lines and a quantity of 1–99.

Bill numbers look like `BILL-20261026-0004`. The date is India Standard Time. The sequence is per cafe.

## Roles

| Action | Owner | Staff |
| --- | --- | --- |
| Create and view bills | Yes | Yes |
| Cancel a bill | Yes | Yes |
| Open WhatsApp | Yes | Yes |
| Edit menu | Yes | No |
| Edit settings and invites | Yes | No |

## WhatsApp now

The app builds `https://wa.me/<digits>?text=<message>` from the saved bill. A 10-digit number uses the cafe country code, default `91`. The status `whatsapp_opened` means a staff member opened that link. There is no status for sent or delivered.

## WhatsApp later

The official WhatsApp Business Platform is not integrated. A future version could let each cafe connect its own WhatsApp Business account:

- The cafe completes Meta business verification and registers a phone number.
- Templates and session messages go through Meta's Cloud API.
- Delivery receipts would come from Meta webhooks, not from the browser.
- Meta's pricing and template rules apply. That can cost money, so it is out of scope for this zero-budget app.
- CafeBill would store the cafe's phone number id and token on the server, never in the browser, and would still isolate them with `cafe_id`.

Until that exists, staff send the prepared message by hand.

## Demo mode

`isSupabaseConfigured()` is true only for `https://*.supabase.co` or a local Supabase URL on port 54321. Otherwise the app uses `data/demo-db.json`. The UI says so. Demo rows are not described as Supabase data.

## Cache Components

The Next.js template enables Cache Components. This app turns them off. Bill totals, menu prices, and tenant data must be read for the current user on each request. `getSessionUser()` also calls `connection()` so a signed-out redirect is not frozen into a static page.

## Subscriptions

Tables are already separated by `cafe_id`, which is the hook a future plan table would use. The MVP does not take payments or assign paid plans.
