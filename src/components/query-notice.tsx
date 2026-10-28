import { Notice } from "@/components/ui/primitives";

const MESSAGES: Record<string, { tone: "success" | "warning" | "accent"; text: string }> = {
  registered: { tone: "success", text: "You're registered. A confirmation email is on its way." },
  "team-created": { tone: "success", text: "Team created. Invites are on their way to your teammates." },
  joined: { tone: "success", text: "You've joined the team." },
  withdrawn: { tone: "accent", text: "Registration withdrawn." },
  submitted: { tone: "success", text: "Submitted for review. You'll be notified of the decision." },
  saved: { tone: "success", text: "Saved." },
  deleted: { tone: "accent", text: "Draft deleted." },
  "members-only": { tone: "warning", text: "That area is for club members. Apply to join when recruitment opens." },
  "no-access": { tone: "warning", text: "You don't have access to the management area." },
  "password-updated": { tone: "success", text: "Password updated." },
};

/** Shows a one-off message passed as ?notice=… after a redirect. */
export async function QueryNotice({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { notice } = await searchParams;
  const m = typeof notice === "string" ? MESSAGES[notice] : undefined;
  if (!m) return null;
  return <Notice tone={m.tone}>{m.text}</Notice>;
}
