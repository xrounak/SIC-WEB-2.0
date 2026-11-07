"use client";

import { useState } from "react";
import { FieldShell, inputClass, useField } from "@/components/ui/form";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/cn";

/** A Markdown text area with Write / Preview tabs, for event descriptions and rule books. */
export function MarkdownField({
  name,
  label,
  hint,
  defaultValue,
  rows = 14,
  maxLength,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  rows?: number;
  maxLength?: number;
}) {
  const { id, error, value } = useField(name, defaultValue);
  const [text, setText] = useState(value ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={false}>
      <div className="flex gap-1" role="tablist" aria-label={`${label} editor`}>
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1 text-[0.8125rem] capitalize transition-colors",
              tab === t ? "bg-primary/15 text-primary" : "text-muted hover:text-fg",
            )}
          >
            {t}
          </button>
        ))}
        {maxLength && <span className="ml-auto self-center font-mono text-[0.6875rem] text-subtle">{text.length.toLocaleString()} / {maxLength.toLocaleString()}</span>}
      </div>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={text}
        maxLength={maxLength}
        onChange={(e) => setText(e.target.value)}
        aria-invalid={Boolean(error)}
        hidden={tab !== "write"}
        className={cn(inputClass, "min-h-40 resize-y font-mono text-[0.8125rem] leading-relaxed")}
        placeholder={"## About\nWhat people will do…\n\n## Rules\n1. Teams of 2–4\n2. …\n\n## Judging\n| Criteria | Points |\n|---|---|\n| Idea | 30 |"}
      />
      {tab === "preview" && (
        <div className="min-h-40 rounded-lg border border-line bg-bg p-4">
          {text.trim() ? <Markdown source={text} /> : <p className="text-sm text-subtle">Nothing to preview yet.</p>}
        </div>
      )}
    </FieldShell>
  );
}
