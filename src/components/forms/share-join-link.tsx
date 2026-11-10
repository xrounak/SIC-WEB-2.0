"use client";

import { useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/button";

/** The leader's join link with Copy, WhatsApp and (on phones) the system share sheet. */
export function ShareJoinLink({ url, teamName, eventTitle }: { url: string; teamName: string; eventTitle: string }) {
  const [copied, setCopied] = useState(false);
  // the share sheet exists on phones only; false while rendering on the server
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );
  const text = `Join ${teamName} for ${eventTitle} on the SIC website: ${url}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // older browsers: select the field so the person can copy it by hand
      (document.getElementById("join-link") as HTMLInputElement | null)?.select();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  const share = async () => {
    try {
      await navigator.share({ title: teamName, text, url });
    } catch {
      // cancelled, or not supported
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <input
        id="join-link"
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="h-11 w-full rounded-lg border border-line-strong bg-bg px-3 font-mono text-[0.8125rem] text-fg"
        aria-label="Team join link"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={buttonClass("primary")}>
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary")}
        >
          Share on WhatsApp
        </a>
        {canShare && (
          <button type="button" onClick={share} className={buttonClass("secondary")}>
            More…
          </button>
        )}
      </div>
    </div>
  );
}
