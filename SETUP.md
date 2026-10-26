# Setup

CafeBill runs on your computer with Node.js. Supabase is optional. Nothing in this setup asks for a credit card.

Suggested contact for your own Supabase account, if you create one: jyotiagarwal.dev@gmail.com. The app does not sign in to that inbox.

## Requirements

- Node.js 22
- npm 10

Checked in this workspace: Node `v22.22.3`, npm `10.9.8`, Git `2.54.0.windows.1`.

## Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Demo mode starts automatically when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are empty. A banner says the bills are stored locally and are not written to Supabase.

Demo accounts:

| Cafe | Role | Email | Password |
| --- | --- | --- | --- |
| Hearth & Co. | Owner | owner@demo.local | owner-demo-123 |
| Hearth & Co. | Staff | staff@demo.local | staff-demo-123 |
| Riverbend Cafe | Owner | other@demo.local | other-demo-123 |

The local database file is `data/demo-db.json`. Delete that file and restart the dev server to restore the seed menu. Do not deploy demo mode to a public server. The demo passwords are in the source code.

`npm run dev` can sign demo sessions without `DEMO_SESSION_SECRET`. `npm start` uses production mode and refuses demo sign-in until that secret exists.

Create `.env.local` (this file is gitignored):

```bash
DEMO_SESSION_SECRET=replace-with-at-least-32-random-characters
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Connect Supabase Free

1. Create a project on the Supabase free plan. Do not upgrade and do not add a payment method.
2. In Project Settings → API, copy the project URL and the anon public key.
3. Put them in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Open the SQL editor and run `supabase/migrations/001_init.sql` once.
5. In Authentication → Providers → Email, you can turn off "Confirm email" for local testing. Supabase's own auth email is part of the free plan. This app does not add another email provider.
6. Restart `npm run dev`. The home page should say the app is connected to Supabase. Demo accounts will no longer work. Create a new account and a cafe.

The service-role key is not required. Do not put it in any `NEXT_PUBLIC_` variable or client component.

After changing environment variables, restart the server. Run `npm run build` again before `npm start`, because the marketing page is rendered per request but a stale production process will keep the old environment until restart.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

## Reset demo data

Stop the server, delete `data/demo-db.json`, and start again.
