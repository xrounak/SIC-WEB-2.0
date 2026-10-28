import type { Metadata } from "next";
import Link from "next/link";
import { requireOnboarded } from "@/lib/auth";
import { updateProfile } from "@/lib/actions/portal";
import { ROLE_LABEL } from "@/lib/format";
import { ActionForm, CheckboxField, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { Avatar, Card, Meta, PageHeader, StatusBadge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const viewer = await requireOnboarded();
  const p = viewer.profile;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Profile" description="Your contact details stay private. Only your name, photo, branch and bio can be public, and only if you choose." />

      <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
        <Avatar name={p.full_name} src={p.avatar_url} size={64} />
        <div className="min-w-0 flex-1">
          <Meta
            items={[
              { label: "Email", value: p.email },
              { label: "Student status", value: <StatusBadge status={p.student_status} /> },
              { label: "Membership", value: <StatusBadge status={p.member_status} /> },
              { label: "Roles", value: viewer.roles.length ? viewer.roles.map((r) => ROLE_LABEL[r]).join(", ") : "None" },
              ...(p.roll_number ? [{ label: "Roll number", value: <span className="font-mono">{p.roll_number}</span> }] : []),
              ...(p.college_name ? [{ label: "College", value: p.college_name }] : []),
            ]}
          />
          <Link href="/onboarding?next=/portal/profile" className="mt-4 inline-block text-[0.8125rem] text-primary">
            Change college or roll number →
          </Link>
        </div>
      </Card>

      <Card className="p-5">
        <ActionForm action={updateProfile}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="full_name" label="Full name" defaultValue={p.full_name} />
            <TextField name="phone" label="Phone" type="tel" defaultValue={p.phone} />
            <TextField name="branch" label="Branch" required={false} defaultValue={p.branch} />
            <SelectField
              name="academic_year"
              label="Year"
              required={false}
              placeholder="Not set"
              defaultValue={p.academic_year?.toString()}
              options={[1, 2, 3, 4, 5].map((y) => ({ value: String(y), label: `Year ${y}` }))}
            />
          </div>
          <TextAreaField name="bio" label="Short bio" required={false} rows={3} defaultValue={p.bio} hint="Shown on your public profile, if enabled." />
          {viewer.isMember && (
            <CheckboxField
              name="public_profile"
              label="Show me on the public site"
              hint="Your name, photo, branch and bio can appear on team and leadership pages. Never your email or phone."
              defaultChecked={p.public_profile}
            />
          )}
          <SubmitButton className="self-start">Save profile</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}
