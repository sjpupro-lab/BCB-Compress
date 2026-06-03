# BCB Labs — Landing Page & Lead Automation

This folder contains the BCB Labs marketing landing page and its automated
lead-response workflow. It is a self-contained web application and is independent
from the BCB compression library source in the repository root.

## What it does

1. Visitors fill in the contact form (work email + optional packet details).
2. The backend computes an **estimated savings** figure (compression ratio,
   monthly bandwidth saved, estimated monthly data-cost saved, hardware headroom).
3. The lead is stored in the database, with the language (`EN` / `KO`) recorded.
4. The project owner (sales team) is notified of every new lead.
5. The visitor lands on a result page and can click **Request a consultation**,
   which marks the lead as `interested` and sends a second owner notification.

## Tech stack

- React 19 + Vite + Tailwind CSS 4 (client)
- Express 4 + tRPC 11 (server)
- Drizzle ORM + MySQL/TiDB (database)
- Manus OAuth (auth), Manus owner notifications (sales alerts)

## Project layout

```
client/   React SPA — landing page, lead form, result page (EN/KO)
server/   tRPC procedures, savings calculation, lead persistence
  savings.ts        compression-ratio / savings calculation logic
  routers/leads.ts  submit / getResult / requestConsult procedures
drizzle/  database schema & migrations (leads table)
shared/   shared constants & types
```

## Local development

```bash
pnpm install
pnpm db:push   # apply database schema
pnpm dev       # start dev server
pnpm test      # run the vitest suite
```

Environment variables (database URL, OAuth, notification keys) are injected by the
hosting platform; see `server/_core/env.ts` for the list.

## Internationalisation

The page supports English (`EN`) and Korean (`KO`), switchable via the footer
toggle and the `?lang=` query parameter. The selected language is persisted and
stored on each lead so follow-up copy matches the visitor's language.
