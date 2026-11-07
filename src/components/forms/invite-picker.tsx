"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { invitePeople, searchInvitees, type Invitee } from "@/lib/actions/events";
import { ActionForm, SubmitButton, inputClass, useFormState } from "@/components/ui/form";
import { Avatar } from "@/components/ui/primitives";

/**
 * Find people by name (or their full email) and invite them. Only people who have
 * signed in to the site show up; they get the invite in their portal.
 */
/** Empties the picked list once the invites have gone out. */
function ClearOnSuccess({ onOk }: { onOk: () => void }) {
  const state = useFormState();
  useEffect(() => {
    if (state.ok) onOk();
  }, [state, onOk]);
  return null;
}

export function InvitePicker({ teamId, slotsLeft }: { teamId: string; slotsLeft: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Invitee[]>([]);
  const [picked, setPicked] = useState<Invitee[]>([]);
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      startSearch(async () => setResults(await searchInvitees(teamId, q)));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, teamId]);

  const full = picked.length >= slotsLeft;
  const clearPicked = useCallback(() => setPicked([]), []);
  const add = (p: Invitee) => {
    if (full || picked.some((x) => x.id === p.id)) return;
    setPicked((v) => [...v, p]);
    setQuery("");
    setResults([]);
  };

  return (
    <ActionForm action={invitePeople}>
      <ClearOnSuccess onOk={clearPicked} />
      <input type="hidden" name="team_id" value={teamId} />
      {picked.map((p) => (
        <input key={p.id} type="hidden" name="user_id" value={p.id} />
      ))}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invite-search" className="text-sm font-medium">
          Invite teammates
        </label>
        <p className="text-[0.8125rem] text-subtle">
          Search by name, or type their full email. Only people who have signed in to the SIC website can be invited.
        </p>
        <div className="relative">
          <input
            id="invite-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={full}
            placeholder={full ? "Team is full" : "Start typing a name…"}
            className={inputClass}
            aria-controls="invite-results"
          />
          {query.trim().length >= 2 && (
            <ul id="invite-results" className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface shadow-2xl">
              {searching && results.length === 0 && <li className="p-3 text-sm text-subtle">Searching…</li>}
              {!searching && results.length === 0 && (
                <li className="p-3 text-sm text-subtle">No one found. They may not have signed in yet, or they're already registered for this event.</li>
              )}
              {results.map((p) => {
                const chosen = picked.some((x) => x.id === p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => add(p)}
                      disabled={chosen}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-primary/10 disabled:opacity-50"
                    >
                      <Avatar name={p.full_name} src={p.avatar_url} size={32} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{p.full_name}</span>
                        <span className="truncate text-[0.75rem] text-subtle">
                          {p.email_hint}
                          {p.college ? ` · ${p.college}` : ""}
                        </span>
                      </span>
                      <span className="text-[0.75rem] text-primary">{chosen ? "Added" : "Add"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {picked.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {picked.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-2 text-sm">
              <Avatar name={p.full_name} src={p.avatar_url} size={22} />
              {p.full_name}
              <button type="button" onClick={() => setPicked((v) => v.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.full_name}`} className="text-subtle hover:text-fg">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <SubmitButton variant="secondary" className="self-start" pendingLabel="Sending…">
        {picked.length > 1 ? `Send ${picked.length} invites` : "Send invite"}
      </SubmitButton>
    </ActionForm>
  );
}
