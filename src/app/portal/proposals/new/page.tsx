import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getDomains, getTeams } from "@/lib/data";
import { EventForm } from "@/components/forms/event-form";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Propose an event" };

export default async function NewProposalPage() {
  await requireMember();
  const [teams, domains] = await Promise.all([getTeams(), getDomains()]);
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Link href="/portal/proposals" className="text-sm text-muted hover:text-fg">
        ← Proposals
      </Link>
      <PageHeader title="Propose an event" description="Save a draft any time. Once submitted, you can only edit it if changes are requested." />
      <EventForm teams={teams} domains={domains} />
    </div>
  );
}
