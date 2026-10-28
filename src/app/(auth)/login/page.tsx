import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  link_invalid: "That sign-in link is invalid or has expired. Request a new one.",
  oauth: "Google sign-in didn't complete. Try again.",
  not_configured: "Sign-in isn't available yet: the site is not connected to Supabase.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  if (await getViewer()) redirect(next);
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Sign in to SIC</h1>
        <p className="text-muted">Register for events, accept team invites, apply to join and manage your projects.</p>
      </div>
      <LoginPanel next={next} initialError={error} />
    </div>
  );
}
