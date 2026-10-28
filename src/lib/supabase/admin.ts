import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server jobs (outbox worker, cron) only.
 * Bypasses RLS. Never import this from a page, component or server action.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY is not set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
