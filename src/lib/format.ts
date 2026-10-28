const TZ = "Asia/Kolkata";

export function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: TZ, ...opts }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
}

/** Parts for a calendar-style date tile. */
export function dateTile(value: string | null | undefined) {
  if (!value) return { day: "–", month: "TBA" };
  const d = new Date(value);
  return {
    day: new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: TZ }).format(d),
    month: new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: TZ }).format(d).toUpperCase(),
  };
}

/** True when the timestamp is now or earlier. */
export function isPast(value: string | null | undefined) {
  return Boolean(value) && new Date(value!).getTime() <= Date.now();
}

export function relativeTime(value: string) {
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(value);
}

/** Value for <input type="datetime-local"> in IST. */
export function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(new Date(value).getTime() + 330 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

/** Parses a datetime-local value entered in IST into an ISO string. */
export function fromLocalInput(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(`${value}:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const EVENT_TYPE_LABEL: Record<string, string> = {
  workshop: "Workshop",
  hackathon: "Hackathon",
  competition: "Competition",
  seminar: "Seminar",
  external: "External",
  meeting: "Meeting",
};

export const ROLE_LABEL: Record<string, string> = {
  vice_president: "Vice President",
  president: "President",
  faculty_coordinator: "Faculty Coordinator",
  admin: "Admin",
};

/** Public URL for a file in a public storage bucket, or the value itself if it is already a URL. */
export function storageUrl(path: string | null | undefined, bucket = "public-media") {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/${bucket}/${path}` : null;
}
