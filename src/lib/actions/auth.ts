"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/safe-next";
import { formValues, fromRpcError, fromZodError, type ActionState } from "./state";

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

const NOT_CONFIGURED: ActionState = {
  error: "Sign-in isn't available yet: the site is not connected to Supabase.",
};

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");

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

/** Sends an email with both a sign-in link and a 6-digit code. */
export async function sendEmailCode(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const next = safeNext(formData.get("next")?.toString());

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { error: "We couldn't send the email. Wait a minute and try again.", values: formValues(formData) };
  return { ok: true, message: `We sent a link and a 6-digit code to ${parsed.data.email}.`, values: { email: parsed.data.email } };
}

export async function verifyEmailCode(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z
    .object({ email, token: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from the email.") })
    .safeParse({ email: formData.get("email"), token: formData.get("token") });
  if (!parsed.success) return fromZodError(parsed.error, formData);

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: "email" });
  if (error) return { error: "That code is wrong or has expired.", values: formValues(formData) };
  redirect(safeNext(formData.get("next")?.toString()));
}

const passwordSchema = z.object({
  email,
  password: z.string().min(8, "Use at least 8 characters."),
  intent: z.enum(["sign-in", "sign-up"]),
});

export async function passwordAuth(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = passwordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    intent: formData.get("intent"),
  });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const next = safeNext(formData.get("next")?.toString());
  const supabase = await createClient();
  const values = { email: parsed.data.email };

  if (parsed.data.intent === "sign-up") {
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) return { error: error.message, values };
    if (!data.session) return { ok: true, message: "Check your email to confirm your account.", values };
    redirect(next);
  }

  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: "Email or password is incorrect.", values };
  redirect(next);
}

export async function requestPasswordReset(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  // Same message either way, so the form doesn't reveal which emails have accounts.
  return { ok: true, message: "If an account uses that email, a reset link is on its way." };
}

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;
  const parsed = z
    .object({ password: z.string().min(8, "Use at least 8 characters."), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return fromZodError(parsed.error, formData);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Your reset link has expired. Request a new one." };
  redirect("/portal?notice=password-updated");
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
    academic_year: z.coerce.number().int().min(1).max(6).optional(),
    roll_number: z.string().trim().max(40).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.is_our_student === "yes") {
      if (!v.branch) ctx.addIssue({ code: "custom", path: ["branch"], message: "Enter your branch." });
      if (!v.academic_year) ctx.addIssue({ code: "custom", path: ["academic_year"], message: "Choose your year." });
      if (!v.roll_number || v.roll_number.length < 3)
        ctx.addIssue({ code: "custom", path: ["roll_number"], message: "Enter your roll number." });
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
    p_academic_year: v.academic_year ?? null,
    p_roll_number: v.roll_number ?? null,
  });
  if (error) return fromRpcError(error, formData);
  redirect(safeNext(formData.get("next")?.toString()));
}
