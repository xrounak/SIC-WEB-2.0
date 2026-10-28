"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { passwordAuth, sendEmailCode, signInWithGoogle, verifyEmailCode } from "@/lib/actions/auth";
import { initialActionState } from "@/lib/actions/state";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { cn } from "@/lib/cn";

function Message({ error, message }: { error?: string; message?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  if (message)
    return (
      <p role="status" className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
        {message}
      </p>
    );
  return null;
}

export function LoginPanel({ next, initialError }: { next: string; initialError?: string }) {
  const [tab, setTab] = useState<"email" | "password">("email");
  const [sendState, sendAction, sending] = useActionState(sendEmailCode, initialActionState);
  const [verifyState, verifyAction, verifying] = useActionState(verifyEmailCode, initialActionState);
  const [pwState, pwAction, pwPending] = useActionState(passwordAuth, initialActionState);
  const codeSent = Boolean(sendState.ok);
  const sentTo = sendState.values?.email ?? "";

  return (
    <div className="flex flex-col gap-6">
      {initialError && <Message error={initialError} />}

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={buttonClass("secondary", "lg", "w-full")}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
          </svg>
          Continue with Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-[0.75rem] text-subtle">
        <span className="h-px flex-1 bg-line" />
        or use your email
        <span className="h-px flex-1 bg-line" />
      </div>

      <div role="tablist" aria-label="Email sign-in method" className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface p-1">
        {(["email", "password"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md py-1.5 text-sm transition-colors",
              tab === t ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
            )}
          >
            {t === "email" ? "Link or code" : "Password"}
          </button>
        ))}
      </div>

      {tab === "email" &&
        (!codeSent ? (
          <form action={sendAction} className="flex flex-col gap-3">
            <input type="hidden" name="next" value={next} />
            <label htmlFor="otp-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="otp-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={sendState.values?.email}
              placeholder="you@gmail.com"
              className={inputClass}
            />
            {sendState.fieldErrors?.email && <p className="text-[0.8125rem] text-danger">{sendState.fieldErrors.email}</p>}
            <Message error={sendState.fieldErrors ? undefined : sendState.error} />
            <button type="submit" disabled={sending} className={buttonClass("primary", "lg")}>
              {sending ? "Sending…" : "Email me a sign-in link"}
            </button>
            <p className="text-[0.8125rem] text-subtle">No password needed. New here? This creates your account.</p>
          </form>
        ) : (
          <form action={verifyAction} className="flex flex-col gap-3">
            <Message message={sendState.message} />
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="email" value={sentTo} />
            <label htmlFor="otp-code" className="text-sm font-medium">
              6-digit code
            </label>
            <input
              id="otp-code"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              placeholder="123456"
              className={cn(inputClass, "font-mono text-lg tracking-[0.4em]")}
            />
            <Message error={verifyState.fieldErrors?.token ?? verifyState.error} />
            <button type="submit" disabled={verifying} className={buttonClass("primary", "lg")}>
              {verifying ? "Checking…" : "Sign in"}
            </button>
            <p className="text-[0.8125rem] text-subtle">Or just click the link in the email on this device.</p>
          </form>
        ))}

      {tab === "password" && (
        <form action={pwAction} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="pw-email" className="text-sm font-medium">
            Email
          </label>
          <input id="pw-email" name="email" type="email" autoComplete="email" required defaultValue={pwState.values?.email} className={inputClass} />
          {pwState.fieldErrors?.email && <p className="text-[0.8125rem] text-danger">{pwState.fieldErrors.email}</p>}
          <div className="flex items-center justify-between">
            <label htmlFor="pw-password" className="text-sm font-medium">
              Password
            </label>
            <Link href="/forgot-password" className="text-[0.8125rem] text-muted hover:text-primary">
              Forgot password?
            </Link>
          </div>
          <input id="pw-password" name="password" type="password" autoComplete="current-password" required minLength={8} className={inputClass} />
          {pwState.fieldErrors?.password && <p className="text-[0.8125rem] text-danger">{pwState.fieldErrors.password}</p>}
          <Message error={pwState.fieldErrors ? undefined : pwState.error} message={pwState.ok ? pwState.message : undefined} />
          <div className="grid grid-cols-2 gap-2">
            <button type="submit" name="intent" value="sign-in" disabled={pwPending} className={buttonClass("primary", "lg")}>
              Sign in
            </button>
            <button type="submit" name="intent" value="sign-up" disabled={pwPending} className={buttonClass("secondary", "lg")}>
              Create account
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
