/**
 * Returns a same-site path to redirect to after sign-in, or the fallback.
 * Rejects absolute and protocol-relative URLs so ?next= cannot send users off-site.
 */
export function safeNext(next: string | null | undefined, fallback = "/portal") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
