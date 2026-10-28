/**
 * Outbox templates. Each returns a subject and plain text; the HTML version is the
 * same text in a minimal branded wrapper. Payload fields come from the workflow RPCs.
 */

type Payload = Record<string, unknown>;
type Rendered = { subject: string; text: string };

const site = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function when(value: unknown) {
  if (!value) return "date to be announced";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(String(value)));
}

const s = (v: unknown) => (v == null ? "" : String(v));

export const TEMPLATES: Record<string, (p: Payload) => Rendered> = {
  "team-invite": (p) => ({
    subject: `${s(p.leader_name) || "A teammate"} invited you to team ${s(p.team_name)}`,
    text: `${s(p.leader_name) || "A teammate"} invited you to join team "${s(p.team_name)}" for ${s(p.event_title)} on ${when(p.event_starts_at)}.

Accept or decline here:
${site()}/invite/${s(p.token)}

Sign in with this email address to accept. If you weren't expecting this, you can ignore it.`,
  }),
  "team-created": (p) => ({
    subject: `Team ${s(p.team_name)} is registered for ${s(p.title)}`,
    text: `Your team "${s(p.team_name)}" is set up for ${s(p.title)}.

Your team needs at least ${s(p.team_min)} members, including you, before registration closes. Teams below the minimum are withdrawn automatically.

Manage your team: ${site()}/portal/registrations`,
  }),
  "team-incomplete-reminder": (p) => ({
    subject: `Team ${s(p.team_name)} still needs members`,
    text: `Registration for ${s(p.title)} closes ${when(p.closes_at)}. Team "${s(p.team_name)}" doesn't have ${s(p.team_min)} members yet and will be withdrawn if it's still short when registration closes.

Invite teammates: ${site()}/portal/registrations`,
  }),
  "registration-confirmed": (p) => ({
    subject: `You're registered: ${s(p.title)}`,
    text: `You're registered for ${s(p.title)}${p.team_name ? ` with team "${s(p.team_name)}"` : ""}.

When: ${when(p.starts_at)}
Where: ${s(p.venue) || "to be announced"}

Event page: ${site()}/events/${s(p.slug)}
Can't make it? Withdraw from ${site()}/portal/registrations so someone else can take your seat.`,
  }),
  "event-cancelled": (p) => ({
    subject: `Cancelled: ${s(p.title)}`,
    text: `${s(p.title)}, planned for ${when(p.starts_at)}, has been cancelled.

Reason from the organisers: ${s(p.reason)}

Sorry for the change of plans.`,
  }),
  "event-decision": (p) => ({
    subject:
      p.decision === "approved"
        ? `Approved: ${s(p.title)}`
        : p.decision === "changes_requested"
          ? `Changes requested: ${s(p.title)}`
          : `Not approved: ${s(p.title)}`,
    text: `Your event proposal "${s(p.title)}" got a decision at the ${p.stage === "final" ? "final" : "team lead"} review: ${s(p.decision).replace("_", " ")}.
${p.notes ? `\nNotes from the reviewer:\n${s(p.notes)}\n` : ""}
See it in your portal: ${site()}/portal/proposals/${s(p.event_id)}`,
  }),
  "application-received": (p) => ({
    subject: `We received your SIC application`,
    text: `Hi ${s(p.full_name)},

Thanks for applying in ${s(p.cycle_name)}. Reviewers will read your application and confirm your student details. You'll hear from us by email, and you can check the status any time:
${site()}/portal/applications`,
  }),
  "application-interview": (p) => ({
    subject: `Interview invitation: ${s(p.cycle_name)}`,
    text: `Good news: you've been shortlisted for an interview in ${s(p.cycle_name)}. The team will contact you with a time and place.

${site()}/portal/applications`,
  }),
  "application-outcome": (p) => ({
    subject: p.outcome === "selected" ? "Welcome to SIC" : `Your SIC application`,
    text:
      p.outcome === "selected"
        ? `Hi ${s(p.full_name)},

You've been selected as a member of the Science & Innovation Club. Member features are now open in your portal: propose events, submit projects and see your teams.

${site()}/portal`
        : p.outcome === "waitlisted"
          ? `You're on the waitlist for ${s(p.cycle_name)}. We'll let you know if a place opens up.`
          : `Thank you for applying in ${s(p.cycle_name)}. We weren't able to offer you a place this time. You're welcome to apply again next cycle and to keep joining our public events.`,
  }),
};

export function renderEmail(template: string, payload: Payload) {
  const render = TEMPLATES[template];
  if (!render) return null;
  const { subject, text } = render(payload);
  const escaped = text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const linked = escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#0b7895">$1</a>');
  const html = `<!doctype html><html><body style="margin:0;background:#f5f7f9;font-family:system-ui,sans-serif;color:#111820">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<p style="font-weight:600;font-size:15px;margin:0 0 20px">SIC · Science &amp; Innovation Club</p>
<div style="background:#fff;border:1px solid #dde3e9;border-radius:12px;padding:24px;font-size:15px;line-height:1.6;white-space:pre-line">${linked}</div>
<p style="color:#7f8b97;font-size:12px;margin:16px 0 0">You're getting this because of activity on your SIC account.</p>
</div></body></html>`;
  return { subject, text, html };
}

export function renderTelegram(template: string, p: Payload) {
  switch (template) {
    case "event-submitted":
      return `New event proposal: ${s(p.title)}\n${site()}/manage/events/${s(p.event_id)}`;
    case "application-submitted":
      return `New application in ${s(p.cycle_name)} from ${s(p.full_name)}\n${site()}/manage/recruitment`;
    default:
      return `${template}: ${JSON.stringify(p)}`;
  }
}
