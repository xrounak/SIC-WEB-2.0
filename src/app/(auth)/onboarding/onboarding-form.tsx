"use client";

import { useState } from "react";
import { completeOnboarding } from "@/lib/actions/auth";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/types";

const YEARS = [1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `Year ${y}` }));

export function OnboardingForm({ profile, next }: { profile: Profile; next: string }) {
  const verified = profile.student_status === "verified";
  const [student, setStudent] = useState<"yes" | "no">(profile.student_status === "external" ? "no" : "yes");

  return (
    <ActionForm action={completeOnboarding}>
      <input type="hidden" name="next" value={next} />
      <TextField name="full_name" label="Full name" autoComplete="name" defaultValue={profile.full_name} />
      <TextField
        name="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        defaultValue={profile.phone}
        hint="Only organisers of events you register for can see it."
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Are you a student of our college?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["yes", "no"] as const).map((v) => (
            <label
              key={v}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm transition-colors",
                student === v ? "border-primary bg-primary/10 text-primary" : "border-line-strong text-muted hover:text-fg",
                verified && v === "no" && "pointer-events-none opacity-40",
              )}
            >
              <input
                type="radio"
                name="is_our_student"
                value={v}
                checked={student === v}
                onChange={() => setStudent(v)}
                disabled={verified && v === "no"}
                className="sr-only"
              />
              {v === "yes" ? "Yes" : "No, another college"}
            </label>
          ))}
        </div>
      </fieldset>

      {student === "yes" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="branch" label="Branch" defaultValue={profile.branch} placeholder="e.g. Mechanical" className="sm:col-span-2" />
          <SelectField name="academic_year" label="Year" options={YEARS} placeholder="Choose" defaultValue={profile.academic_year?.toString()} />
          <TextField
            name="roll_number"
            label="Roll number"
            defaultValue={profile.roll_number}
            disabled={verified}
            hint={verified ? "Verified. Contact the club to change it." : "Needed to verify you for membership. Never public."}
          />
          {verified && <input type="hidden" name="roll_number" value={profile.roll_number ?? ""} />}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="college_name" label="College" defaultValue={profile.college_name} className="sm:col-span-2" />
          <TextField name="branch" label="Branch" required={false} defaultValue={profile.branch} />
          <SelectField name="academic_year" label="Year" required={false} options={YEARS} placeholder="Choose" defaultValue={profile.academic_year?.toString()} />
        </div>
      )}

      <SubmitButton size="lg" pendingLabel="Saving…">
        {profile.onboarded_at ? "Save details" : "Continue"}
      </SubmitButton>
    </ActionForm>
  );
}
