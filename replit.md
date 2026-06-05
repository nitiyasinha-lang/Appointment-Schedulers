# Appointa — WhatsApp Appointment Reminder

A front-desk scheduling tool that books appointments and automatically sends WhatsApp/SMS confirmation messages via Twilio.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Messaging: Twilio WhatsApp/SMS (with simulation fallback)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/appointments.ts` — Appointments table schema
- `artifacts/api-server/src/routes/appointments.ts` — Appointment CRUD + messaging routes
- `artifacts/api-server/src/lib/messaging.ts` — Twilio WhatsApp/SMS integration
- `artifacts/appointments/src/` — React frontend (form + dashboard)

## Architecture decisions

- OpenAPI-first: all API contracts defined in `lib/api-spec/openapi.yaml`, types/hooks generated via Orval
- Twilio integration uses native `fetch` (no SDK), with graceful simulation fallback when credentials are absent — server logs will show `[SIMULATED]` messages
- WhatsApp sender number prefix (`whatsapp:`) is handled automatically in `messaging.ts`
- Phone numbers are auto-normalized to E.164 format in `messaging.ts`
- Stats endpoint uses PostgreSQL `filter` aggregates (single query, no N+1)

## Product

- Booking form: customer name, phone, appointment date/time, optional notes
- Sends WhatsApp/SMS confirmation immediately on booking via Twilio
- Dashboard with stats bar (total, upcoming, past, confirmations sent, reminders sent)
- Per-appointment "Send Reminder" button for manual reminders
- Color-coded upcoming/past status with relative time display

## Twilio Setup

Set these secrets to enable real message sending:
- `TWILIO_ACCOUNT_SID` — from Twilio console (starts with AC...)
- `TWILIO_AUTH_TOKEN` — from Twilio console
- `TWILIO_PHONE_NUMBER` — WhatsApp sender (e.g. `whatsapp:+14155238886` for sandbox)

Without credentials, the app logs `[SIMULATED]` messages to the server console — all other features work normally.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After spec changes, always re-run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Twilio WhatsApp sandbox requires recipients to opt-in first (send "join <sandbox-keyword>" to the sandbox number)
- `TWILIO_PHONE_NUMBER` must be prefixed with `whatsapp:` for WhatsApp, or use a plain number for SMS

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
