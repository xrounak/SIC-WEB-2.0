import type { Metadata } from "next";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { getDomains, getTeams } from "@/lib/data";
import { ProjectForm } from "@/components/forms/project-form";
import { PageHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Submit a project" };

export default async function NewProjectPage() {
  await requireMember();
  const [teams, domains] = await Promise.all([getTeams(), getDomains()]);
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <Link href="/portal/projects" className="text-sm text-muted hover:text-fg">
        ← Projects
      </Link>
      <PageHeader title="Submit a project" description="Save a draft first to add contributors and images, then submit it for review." />
      <ProjectForm teams={teams} domains={domains} />
    </div>
  );
}
