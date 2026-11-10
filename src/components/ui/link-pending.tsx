"use client";

import { useLinkStatus } from "next/link";

/**
 * Put inside a <Link>: a small spinner while that link's page is loading, so a tap
 * never looks ignored (filter links stay on the same page, so no page transition plays).
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={`ml-1.5 inline-block size-2.5 rounded-full border-2 border-current border-r-transparent align-[-1px] ${
        pending ? "animate-spin opacity-100" : "hidden"
      }`}
    />
  );
}
