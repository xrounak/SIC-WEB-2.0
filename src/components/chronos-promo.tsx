"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Jersey_10, Silkscreen } from "next/font/google";

/**
 * Chronos 2026 on the SIC site, in the festival's own paper-cut look: a small board
 * that hangs from the header and sways, and a one-time pop-up. Both go away after the
 * festival. The pop-up stays closed for a few days once dismissed; the board only
 * hides until the next page change or refresh.
 */

const display = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });
const label = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

const CHRONOS_URL = "https://chronos.sic.gecp.in/?from=sic";
const STARTS = new Date("2026-12-11T09:00:00+05:30").getTime();
const ENDS = new Date("2026-12-14T00:00:00+05:30").getTime();
const POPUP_KEY = "sic-chronos-popup";
const SNOOZE_DAYS = 3;

const LETTERS: Array<[string, string]> = [
  ["#e2452b", "#fff3dc"],
  ["#2453b3", "#fff3dc"],
  ["#fff3dc", "#1d1813"],
  ["#1d1813", "#f4b536"],
  ["#1f9c86", "#fff3dc"],
  ["#f08aa0", "#1d1813"],
  ["#fff3dc", "#e2452b"],
];

function countdown(now: number) {
  if (now >= STARTS) return "Live now";
  const days = Math.ceil((STARTS - now) / 86_400_000);
  return days === 1 ? "Tomorrow" : `${days} days to go`;
}

function CutLetters({ small = false }: { small?: boolean }) {
  return (
    <span className={`cp-letters ${small ? "is-small" : ""}`} aria-hidden="true">
      {"CHRONOS".split("").map((ch, i) => (
        <span key={i} style={{ background: LETTERS[i][0], color: LETTERS[i][1], rotate: `${[-6, 4, -3, 7, -5, 3, -4][i]}deg` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export function ChronosPromo() {
  const [now, setNow] = useState<number | null>(null);
  const [popup, setPopup] = useState(false);
  const [board, setBoard] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const t = Date.now();
    setNow(t);
    if (t >= ENDS) return;
    let snoozedUntil = 0;
    try {
      snoozedUntil = Number(localStorage.getItem(POPUP_KEY) ?? 0);
    } catch {}
    if (t > snoozedUntil) {
      // Wait for the site's intro to finish, then give the page a moment.
      const html = document.documentElement;
      let id = 0;
      const arm = () => (id = window.setTimeout(() => setPopup(true), 2500));
      if (html.dataset.intro === "done") arm();
      const watch = new MutationObserver(() => {
        if (html.dataset.intro === "done" && !id) arm();
      });
      watch.observe(html, { attributes: true, attributeFilter: ["data-intro"] });
      return () => {
        watch.disconnect();
        clearTimeout(id);
      };
    }
  }, []);

  useEffect(() => {
    if (!popup) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePopup();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup]);

  const closePopup = () => {
    setPopup(false);
    try {
      localStorage.setItem(POPUP_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    } catch {}
  };
  // A closed board comes back on every page change (and on refresh, as state resets).
  useEffect(() => {
    setBoard(true);
  }, [pathname]);
  const hideBoard = () => setBoard(false);

  if (now === null || now >= ENDS) return null;
  const when = countdown(now);

  return (
    <div className={`${display.className} cp-root`} style={{ ["--cp-label" as string]: label.style.fontFamily }}>
      {board && !popup && (
        <div className="cp-board-wrap">
          <span className="cp-string cp-string-l" aria-hidden="true" />
          <span className="cp-string cp-string-r" aria-hidden="true" />
          <a href={CHRONOS_URL} className="cp-board" aria-label={`Chronos 2026, ${when}. Visit chronos.sic.gecp.in`}>
            <span className="cp-pin cp-pin-l" aria-hidden="true" />
            <span className="cp-pin cp-pin-r" aria-hidden="true" />
            <span className="cp-board-kicker">SIC presents</span>
            <CutLetters small />
            <span className="cp-board-when">{when}</span>
            <span className="cp-board-cta">Play the island →</span>
          </a>
          <button type="button" className="cp-board-close" onClick={hideBoard} aria-label="Hide the Chronos board">
            ×
          </button>
        </div>
      )}

      {popup && (
        <div className="cp-overlay" role="dialog" aria-modal="true" aria-labelledby="cp-title" onClick={(e) => e.target === e.currentTarget && closePopup()}>
          <div className="cp-card">
            <button type="button" className="cp-close" onClick={closePopup} aria-label="Close">
              ×
            </button>
            <p className="cp-kicker">Science &amp; Innovation Club presents</p>
            <h2 id="cp-title" className="sr-only">
              Chronos 2026
            </h2>
            <CutLetters />
            <p className="cp-strip">Earned, never given.</p>
            <p className="cp-text">
              Three days of talks, builds, races and robot fights at GEC Palamu. Drive a little rover round the 3D island to explore every event.
            </p>
            <p className="cp-meta">
              <span>11 – 13 Dec 2026</span>
              <span className="cp-dot" aria-hidden="true" />
              <span>{when}</span>
            </p>
            <div className="cp-actions">
              <a href={CHRONOS_URL} className="cp-btn" onClick={closePopup}>
                Visit Chronos →
              </a>
              <button type="button" className="cp-btn cp-btn-quiet" onClick={closePopup}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
