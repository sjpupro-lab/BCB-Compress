/**
 * BCB landing Worker.
 *
 * Responsibilities:
 *  1. Serve the built static site (landing + apply form) via the ASSETS binding.
 *  2. Handle POST /api/lead — store a tester application in D1 and (optionally)
 *     notify the owner through a webhook.
 *
 * There is intentionally no savings calculator here: the page collects a packet
 * sample and we measure compression offline, then reply by email.
 */

import { EmailMessage } from "cloudflare:email";

interface Env {
  /** Static assets (Vite build output in ./dist). */
  ASSETS: Fetcher;
  /** D1 database holding tester leads. */
  DB: D1Database;
  /** Optional outbound webhook (Slack/Discord/etc). Set via `wrangler secret put`. */
  NOTIFY_WEBHOOK_URL?: string;
  /**
   * Outbound email for owner lead notifications (Cloudflare Email Routing).
   * Optional so the lead flow still works when email isn't configured.
   */
  SEND_EMAIL?: SendEmail;
}

interface DataItem {
  type: string;
  label: string;
  value: string;
}

interface LeadPayload {
  email: string;
  company?: string;
  useCase?: string;
  dataItems?: DataItem[];
  lang?: "EN" | "KO";
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
} as const;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Trim a string and cap its length; returns null for empty input. */
function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

/** Validate and normalize the incoming data items, capping count and size. */
function normalizeItems(input: unknown): DataItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, 50)
    .map((raw) => {
      const o = (raw ?? {}) as Record<string, unknown>;
      return {
        type: clean(o.type, 64) ?? "",
        label: clean(o.label, 64) ?? "",
        value: clean(o.value, 2000) ?? "",
      };
    })
    .filter((i) => i.value !== "");
}

/** Owner inbox that receives new-lead notifications. */
const OWNER_EMAIL = "jahyag@gmail.com";
/** Sender address — its domain must have Cloudflare Email Routing enabled. */
const EMAIL_FROM = "leads@bcb-lab.com";

/** Encode a header value as RFC 2047 base64 so non-ASCII (e.g. Korean) is safe. */
function encodeHeader(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Send the new-lead notification to the owner via the SEND_EMAIL binding.
 *
 * Cloudflare's `send_email` binding requires the recipient (OWNER_EMAIL) to be a
 * *verified destination* in Email Routing and the sender domain (EMAIL_FROM) to
 * have Email Routing enabled; otherwise `.send()` throws. Callers run this via
 * `ctx.waitUntil` + `catch`, so a misconfiguration never fails the lead save.
 */
async function sendOwnerEmail(sender: SendEmail, body: string, who: string): Promise<void> {
  const subject = encodeHeader(`[BCB 리드] ${who} 신규 신청`);
  const raw = [
    `From: BCB Leads <${EMAIL_FROM}>`,
    `To: ${OWNER_EMAIL}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    body,
  ].join("\r\n");
  await sender.send(new EmailMessage(EMAIL_FROM, OWNER_EMAIL, raw));
}

async function handleLead(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const email = clean(payload.email, 320);
  if (!email || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "A valid email is required" }, 400);
  }

  const company = clean(payload.company, 255);
  const useCase = clean(payload.useCase, 64);
  const lang = payload.lang === "KO" ? "KO" : "EN";
  const items = normalizeItems(payload.dataItems);

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Store contact/meta in `leads` and each packet sample as its own row in
  // `lead_samples` — PII is kept separate from the submitted data samples. The
  // legacy `data_sample` column is retained for backward-compat but no longer
  // written (new samples go to `lead_samples`). The batch commits atomically.
  try {
    const statements: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO leads (id, created_at, email, company, use_case, data_sample, lang, status)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 'new')`,
      ).bind(id, createdAt, email, company, useCase, lang),
      ...items.map((it) =>
        env.DB.prepare(
          `INSERT INTO lead_samples (id, lead_id, type, label, value, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(crypto.randomUUID(), id, it.type, it.label, it.value, createdAt),
      ),
    ];
    await env.DB.batch(statements);
  } catch (err) {
    console.error("[lead] D1 insert failed:", err);
    return json({ ok: false, error: "Storage error" }, 500);
  }

  // Owner notification content, shared by every channel below.
  const lines = [
    `[BCB 테스터] ${company || email} 신청 (${useCase || "-"})`,
    `• 이메일: ${email}`,
    `• 회사: ${company || "-"}`,
    `• 용도: ${useCase || "-"}`,
    `• 데이터 항목: ${items.length ? items.map((i) => `${i.label}=${i.value}`).join(", ") : "(없음)"}`,
    `• 언어: ${lang} · ${createdAt}`,
    `리드 ID: ${id}`,
  ];
  const text = lines.join("\n");

  // Channel 1 — webhook (Slack/Discord). Fire-and-forget, non-fatal.
  if (env.NOTIFY_WEBHOOK_URL) {
    ctx.waitUntil(
      fetch(env.NOTIFY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `text` is for Slack-style webhooks, `content` for Discord-style.
        body: JSON.stringify({ text, content: text }),
      }).catch((err) => console.warn("[lead] notify failed:", err)),
    );
  }

  // Channel 2 — owner email via SEND_EMAIL. Fire-and-forget, non-fatal: a mail
  // misconfiguration is logged but never affects the saved lead. See the
  // verified-destination precondition documented on `sendOwnerEmail`.
  if (env.SEND_EMAIL) {
    ctx.waitUntil(
      sendOwnerEmail(env.SEND_EMAIL, text, company || email).catch((err) =>
        console.warn("[lead] email notify failed:", err),
      ),
    );
  }

  return json({ ok: true, id });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/lead") {
      return handleLead(request, env, ctx);
    }
    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "Not found" }, 404);
    }

    // Everything else: static assets (landing + apply form).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
