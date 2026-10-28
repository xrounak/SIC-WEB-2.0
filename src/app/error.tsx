"use client";

import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="relative z-10 mx-auto flex min-h-[70dvh] max-w-xl flex-col items-start justify-center gap-6 px-4">
      <p className="font-mono text-sm text-danger">Error</p>
      <h1 className="text-4xl font-semibold">Something went wrong</h1>
      <p className="text-muted">The page couldn&apos;t load. Try again, and if it keeps happening, let the club know.</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go home
        </ButtonLink>
      </div>
    </main>
  );
}
