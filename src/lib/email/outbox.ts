import { createAdminClient } from "@/lib/supabase/admin";
import { renderEmail, renderTelegram } from "./templates";

type OutboxRow = {
  id: string;
  channel: "email" | "telegram";
  to_address: string | null;
  template: string;
  payload: Record<string, unknown>;
  attempts: number;
};

const MAX_ATTEMPTS = 5;

async function sendEmail(row: OutboxRow) {
  const rendered = renderEmail(row.template, row.payload);
  if (!rendered) throw new Error(`Unknown template ${row.template}`);
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error("Email is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": row.id,
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [row.to_address], subject: rendered.subject, text: rendered.text, html: rendered.html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = (await res.json()) as { id?: string };
  return body.id ?? null;
}

async function sendTelegram(row: OutboxRow) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return null; // Optional channel: skip quietly when not set up.
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: renderTelegram(row.template, row.payload), disable_web_page_preview: true }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}`);
  return null;
}

/**
 * Sends up to `limit` queued messages. Claims rows by flipping them to "sending" so two
 * overlapping runs don't send twice; failures back off exponentially.
 */
export async function flushOutbox(limit = 25) {
  const supabase = createAdminClient();
  const { data: queued } = await supabase
    .from("email_outbox")
    .select("id, channel, to_address, template, payload, attempts")
    .eq("status", "queued")
    .lte("send_after", new Date().toISOString())
    .order("created_at")
    .limit(limit);

  let sent = 0;
  let failed = 0;
  for (const row of (queued ?? []) as OutboxRow[]) {
    const { data: claimed } = await supabase
      .from("email_outbox")
      .update({ status: "sending", attempts: row.attempts + 1 })
      .eq("id", row.id)
      .eq("status", "queued")
      .select("id");
    if (!claimed?.length) continue;

    try {
      const providerId = row.channel === "telegram" ? await sendTelegram(row) : await sendEmail(row);
      await supabase
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: providerId, last_error: null })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      const attempts = row.attempts + 1;
      await supabase
        .from("email_outbox")
        .update({
          status: attempts >= MAX_ATTEMPTS ? "failed" : "queued",
          last_error: String(err instanceof Error ? err.message : err).slice(0, 500),
          send_after: new Date(Date.now() + 2 ** attempts * 60_000).toISOString(),
        })
        .eq("id", row.id);
      failed++;
    }
  }
  return { sent, failed };
}
