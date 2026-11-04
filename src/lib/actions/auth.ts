"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/safe-next";
import { fromRpcError, fromZodError, type ActionState } from "./state";

/** Where Google should send the visitor back to: the address they are actually using. */
async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

const NOT_CONFIGURED: ActionState = {
  error: "Sign-in isn't available yet: the site is not connected to Supabase.",
};

export async function signInWithGoogle(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/login?error=not_configured");
  const next = safeNext(formData.get("next")?.toString());
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect(`/login?error=oauth&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

const onboardingSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name.").max(120),
    phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/, "Enter a phone number with 8 to 16 digits."),
    is_our_student: z.enum(["yes", "no"], { message: "Choose one." }),
    college_name: z.string().trim().max(200).optional(),
    branch: z.string().trim().max(100).optional(),
    academic_session: z.string().trim().regex(/^[0-9]{4}-[0-9]{2}$/, "Choose your session.").optional(),
    roll_number: z.string().trim().max(40).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.is_our_student === "yes") {
      if (!v.branch) ctx.addIssue({ code: "custom", path: ["branch"], message: "Choose your branch." });
      if (!v.academic_session) ctx.addIssue({ code: "custom", path: ["academic_session"], message: "Choose your session." });
      if (!v.roll_number || v.roll_number.length < 3)
        ctx.addIssue({ code: "custom", path: ["roll_number"], message: "Enter your registration number." });
    } else if (!v.college_name || v.college_name.length < 2) {
      ctx.addIssue({ code: "custom", path: ["college_name"], message: "Enter your college name." });
    }
  });

export async function completeOnboarding(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string" && v !== "").map(([k, v]) => [k, v]),
  );
  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_full_name: v.full_name,
    p_phone: v.phone,
    p_is_our_student: v.is_our_student === "yes",
    p_college_name: v.college_name ?? null,
    p_branch: v.branch ?? null,
    p_academic_session: v.academic_session ?? null,
    p_roll_number: v.roll_number ?? null,
  });
  if (error) return fromRpcError(error, formData);
  redirect(safeNext(formData.get("next")?.toString()));
}
