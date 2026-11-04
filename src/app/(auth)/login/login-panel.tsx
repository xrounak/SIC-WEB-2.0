import { signInWithGoogle } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui/button";

/** Google is the only way in. New visitors get an account on first sign-in. */
export function LoginPanel({ next, initialError }: { next: string; initialError?: string }) {
  return (
    <div className="flex flex-col gap-5">
      {initialError && (
        <p role="alert" className="border-l-2 border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
          {initialError}
        </p>
      )}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={buttonClass("secondary", "lg", "w-full")}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
          </svg>
          Continue with Google
        </button>
      </form>

      <p className="text-[0.8125rem] text-subtle">
        First time here? Signing in creates your account. Use the Google account you want the club to reach you on.
      </p>
    </div>
  );
}
