import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <main id="main" className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-6 px-4">
      <Logo />
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="text-4xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="text-muted">It may have moved, or the event or project isn&apos;t published yet.</p>
      <div className="flex gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/events" variant="secondary">
          Browse events
        </ButtonLink>
      </div>
    </main>
  );
}
