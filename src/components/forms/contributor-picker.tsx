"use client";

import { useState, useTransition } from "react";
import { addContributor, searchMembers } from "@/lib/actions/projects";
import { ActionForm, SubmitButton, inputClass } from "@/components/ui/form";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type Result = Awaited<ReturnType<typeof searchMembers>>[number];

/** Search club members by name and add one as a contributor. */
export function ContributorPicker({ projectId, excludeIds }: { projectId: string; excludeIds: string[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [picked, setPicked] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  function search(value: string) {
    setQuery(value);
    setPicked(null);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const found = await searchMembers(value);
      setResults(found.filter((r) => !excludeIds.includes(r.id)));
    });
  }

  return (
    <ActionForm action={addContributor}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="member_id" value={picked?.id ?? ""} />
      <div className="relative flex flex-col gap-1.5">
        <label htmlFor="contributor-search" className="text-sm font-medium">
          Add a contributor
        </label>
        <input
          id="contributor-search"
          value={picked ? picked.full_name : query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search members by name"
          autoComplete="off"
          className={inputClass}
          aria-autocomplete="list"
          aria-controls="contributor-results"
        />
        {!picked && results.length > 0 && (
          <ul id="contributor-results" role="listbox" className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-card">
            {results.map((r) => (
              <li key={r.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(r);
                    setResults([]);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <Avatar name={r.full_name} src={r.avatar_url} size={24} />
                  <span className="flex-1 truncate">{r.full_name}</span>
                  <span className="text-[0.75rem] text-subtle">
                    {r.branch}
                    {r.academic_year ? ` · Y${r.academic_year}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {pending && <span className="text-[0.75rem] text-subtle">Searching…</span>}
      </div>
      <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end", !picked && "opacity-60")}>
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="contribution" className="text-sm font-medium">
            Their role <span className="font-normal text-subtle">optional</span>
          </label>
          <input id="contribution" name="contribution" maxLength={200} placeholder="e.g. Firmware, CAD, testing" className={inputClass} disabled={!picked} />
        </div>
        <SubmitButton variant="secondary" pendingLabel="Adding…">
          Add contributor
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
