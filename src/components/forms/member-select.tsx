"use client";

import { useState, useTransition } from "react";
import { searchMembers } from "@/lib/actions/projects";
import { inputClass } from "@/components/ui/form";
import { Avatar } from "@/components/ui/primitives";

type Result = Awaited<ReturnType<typeof searchMembers>>[number];

/** Name search over club members that submits the chosen id as `name`. */
export function MemberSelect({ name = "user_id", label = "Member" }: { name?: string; label?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [picked, setPicked] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = `${name}-search`;

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input type="hidden" name={name} value={picked?.id ?? ""} />
      <input
        id={inputId}
        value={picked ? picked.full_name : query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setPicked(null);
          if (v.trim().length < 2) return setResults([]);
          startTransition(async () => setResults(await searchMembers(v)));
        }}
        placeholder="Search by name"
        autoComplete="off"
        className={inputClass}
      />
      {!picked && results.length > 0 && (
        <ul className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface shadow-card">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  setPicked(r);
                  setResults([]);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <Avatar name={r.full_name} src={r.avatar_url} size={22} />
                <span className="flex-1 truncate">{r.full_name}</span>
                <span className="text-[0.75rem] text-subtle">{r.branch}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {pending && <span className="text-[0.75rem] text-subtle">Searching…</span>}
    </div>
  );
}
