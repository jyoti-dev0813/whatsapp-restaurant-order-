# Project plan

The goal is a working multi-cafe billing MVP at no extra cost. Reports, paid subscriptions, inventory, and loyalty are out of the MVP.

Usage quota for this session was not exposed, so it was treated as unknown. Work stayed on the billing path.

## Phase A — Inspect

The workspace was empty. Node.js 22, npm 10, and Git were available. Next.js 16.4.3 was scaffolded with the App Router, TypeScript strict mode, and Tailwind CSS 4.

## Phase B — Foundation

Folder layout, Zod validation, Vitest, and a small local UI kit (buttons, fields, cards) were added. Cache Components from the Next.js template were turned off so tenant bills are not frozen into a static page.

## Phase C — Data and auth

Demo auth uses an HTTP-only HMAC cookie and a local JSON database. Supabase Auth, RLS, and security-definer billing functions are in `supabase/migrations/001_init.sql`. No Supabase project was created here because there were no credentials, and creating one would need your account.

## Phase D — Billing

Menu management, order entry, server-side paise math, bill numbers, history, print view, and PDF download.

## Phase E — WhatsApp

`wa.me` links with the cafe name, bill number, lines, and total. Status is `whatsapp_opened` only after the link is opened. There is no delivered state.

## Phase F — Checks

Unit tests, lint, typecheck, and production build. A production server was used to sign in, save a bill, open WhatsApp, and compare two cafes. Details are in [PROGRESS.md](PROGRESS.md).

## Defaults chosen without a prompt

- Product name: CafeBill
- Currency: INR, integer paise, India Standard Time bill dates
- Default tax: 5%, labeled "Tax", editable by the owner
- One cafe per user
- Staff can bill and cancel. Only the owner edits the menu, settings, and invites
- Phone is optional on a bill and required before WhatsApp
- UI kit is local Tailwind components rather than the shadcn CLI, to keep the install smaller on Tailwind 4
