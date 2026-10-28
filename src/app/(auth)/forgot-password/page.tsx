import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/ui/form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Reset your password</h1>
        <p className="text-muted">We&apos;ll email you a link to choose a new one.</p>
      </div>
      <ActionForm action={requestPasswordReset}>
        <TextField name="email" label="Email" type="email" autoComplete="email" />
        <SubmitButton size="lg" pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
      </ActionForm>
      <Link href="/login" className="text-sm text-muted hover:text-fg">
        ← Back to sign in
      </Link>
    </div>
  );
}
