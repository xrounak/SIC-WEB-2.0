import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Shown until Supabase keys are set, so empty pages are explained. */
export function SetupNotice() {
  if (isSupabaseConfigured()) return null;
  return (
    <div className="relative z-10 border-b border-warning/30 bg-[color-mix(in_oklab,var(--color-warning)_10%,var(--color-bg))]">
      <p className="mx-auto w-full max-w-content px-4 py-2 text-[0.8125rem] text-warning sm:px-6">
        Not connected to Supabase yet. Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to <code className="font-mono">.env.local</code>{" "}
        to load real data and enable sign-in.
      </p>
    </div>
  );
}
