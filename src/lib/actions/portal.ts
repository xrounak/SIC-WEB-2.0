"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOnboarded, requireViewer } from "@/lib/auth";
import { fromZodError, type ActionState } from "./state";

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name.").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/, "Enter a phone number with 8 to 16 digits."),
  bio: z.string().trim().max(1000, "Keep it under 1000 characters.").optional(),
  branch: z.string().trim().max(100).optional(),
  academic_year: z.coerce.number().int().min(1).max(6).optional(),
  public_profile: z.boolean(),
});

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await requireOnboarded();
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    bio: formData.get("bio") || undefined,
    branch: formData.get("branch") || undefined,
    academic_year: formData.get("academic_year") || undefined,
    public_profile: formData.get("public_profile") === "on",
  });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.full_name,
      phone: v.phone,
      bio: v.bio ?? null,
      branch: v.branch ?? null,
      academic_year: v.academic_year ?? null,
      public_profile: v.public_profile,
    })
    .eq("id", viewer.id);
  if (error) return { error: "Couldn't save your profile. Try again." };
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function markAllNotificationsRead(): Promise<ActionState> {
  const viewer = await requireViewer();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", viewer.id)
    .is("read_at", null);
  revalidatePath("/portal", "layout");
  return { ok: true, message: "All caught up." };
}
