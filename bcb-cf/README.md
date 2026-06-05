# BCB Landing — Cloudflare Workers + D1

A static landing page (`/`) plus a separate tester application page (`/apply`)
served from a single Cloudflare Worker. Form submissions are stored in a
Cloudflare D1 database. There is **no savings calculator** — the page collects a
packet sample and you measure compression offline, then reply by email.

## Layout

```
src/worker.ts      Worker: serves static assets + POST /api/lead -> D1
src/landing.tsx    Landing page (entry: index.html)
src/apply.tsx      Application form, opens in a new window (entry: apply.html)
src/bcbContent.tsx Bilingual (KO/EN) copy + logo
src/index.css      Styles
migrations/        D1 schema (SQLite)
wrangler.jsonc     Worker config (ASSETS + D1 bindings, observability)
```

## One-time setup

```bash
# 1. Install deps
pnpm install            # or: npm install

# 2. Log in to Cloudflare
npx wrangler login

# 3. Create the D1 database (already wired up: wrangler.jsonc has the bcb-leads
#    database_id). Only needed when standing up a fresh database:
npx wrangler d1 create bcb-leads
#   -> copy "database_id": "..." into the d1_databases block in wrangler.jsonc

# 4. Apply migrations on the REMOTE database (creates `leads` + `lead_samples`)
npx wrangler d1 migrations apply bcb-leads --remote

# 5. (optional) owner notification webhook (Slack/Discord incoming webhook URL)
npx wrangler secret put NOTIFY_WEBHOOK_URL
```

### Owner email notifications (SEND_EMAIL)

New leads also email the owner (`jahyag@gmail.com`) via the `SEND_EMAIL` binding
declared in `wrangler.jsonc`. Cloudflare's `send_email` binding has two
**preconditions** — until both are met the send fails (it is caught and logged,
so the lead is still saved, but no mail arrives):

1. The recipient (`destination_address`, `jahyag@gmail.com`) must be a **verified
   destination** in Cloudflare **Email Routing** (Dashboard → the zone → Email →
   Email Routing → Destination addresses → add & confirm).
2. The sender domain (`leads@bcb-lab.com` → `bcb-lab.com`) must have **Email
   Routing enabled**.

The webhook (`NOTIFY_WEBHOOK_URL`) and email run as independent channels; either
can be configured without the other.

## Deploy

```bash
npm run deploy          # vite build  ->  wrangler deploy
```

Wrangler uploads the Worker and the built `dist/` assets together. To attach a
custom domain, add a Custom Domain/route to the Worker in the Cloudflare
dashboard (Workers & Pages → your worker → Settings → Domains & Routes).

## Local development

```bash
npm run db:migrate:local   # create the table in the local D1
npm run preview            # wrangler dev (local Worker + assets + D1)
# open http://127.0.0.1:8787  and  http://127.0.0.1:8787/apply
```

## Reading leads

```bash
# Contact / meta (PII) lives in `leads`:
npx wrangler d1 execute bcb-leads --remote \
  --command "SELECT created_at, email, company, use_case, lang FROM leads ORDER BY created_at DESC LIMIT 50;"

# Packet samples live in `lead_samples`, one row per data item, joined by lead_id:
npx wrangler d1 execute bcb-leads --remote \
  --command "SELECT lead_id, type, label, value FROM lead_samples ORDER BY created_at DESC LIMIT 50;"
```

Packet samples are stored in the **`lead_samples`** table (one row per
`{type, label, value}` item the applicant added via the dropdown), kept separate
from the contact details in `leads`. The legacy `leads.data_sample` column is
retained for backward-compat but is **no longer written** by new submissions.

## API

`POST /api/lead`

```json
{
  "email": "you@company.com",
  "company": "Acme IoT",
  "useCase": "IoT",
  "lang": "KO",
  "dataItems": [
    { "type": "int_telemetry", "label": "정수 텔레메트리", "value": "0x1A2B" }
  ]
}
```

Response: `{ "ok": true, "id": "<uuid>" }` on success, or `{ "ok": false, "error": "..." }`
with a 4xx/5xx status. `email` is the only required field.

## Notes on the migration from the old stack

This project **replaces** the previous Node/tRPC + MySQL (Drizzle) server. The
savings-estimate backend (`savings.ts`, the result page, `computeSavings`,
`getResult`/`requestConsult`) is intentionally **not carried over** — it no longer
exists. The old `server/` directory can be archived or deleted.
