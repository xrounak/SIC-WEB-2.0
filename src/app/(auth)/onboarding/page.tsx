import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Your details" };

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : undefined);
  const first = !viewer.profile.onboarded_at;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{first ? "One quick step" : "Your details"}</h1>
        <p className="text-muted">
          {first
            ? "We ask once, so event organisers can reach you and we can confirm students for membership."
            : "Keep these up to date. Organisers use them to contact you about events."}
        </p>
      </div>
      <OnboardingForm profile={viewer.profile} next={next} />
    </div>
  );
}
