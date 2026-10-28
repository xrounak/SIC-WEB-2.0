import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { updatePassword } from "@/lib/actions/auth";
import { ActionForm, SubmitButton, TextField } from "@/components/ui/form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  await requireViewer();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold">Choose a new password</h1>
      <ActionForm action={updatePassword}>
        <TextField name="password" label="New password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters." />
        <TextField name="confirm" label="Repeat password" type="password" autoComplete="new-password" />
        <SubmitButton size="lg">Save password</SubmitButton>
      </ActionForm>
    </div>
  );
}
