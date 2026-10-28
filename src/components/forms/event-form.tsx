"use client";

import { useState } from "react";
import { saveEvent } from "@/lib/actions/events";
import { ActionForm, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import { EVENT_TYPE_LABEL, toLocalInput } from "@/lib/format";
import type { Domain, SicEvent, Team } from "@/lib/types";

export function EventForm({ event, teams, domains }: { event?: SicEvent; teams: Team[]; domains: Domain[] }) {
  const [participation, setParticipation] = useState(event?.participation ?? "individual");

  return (
    <ActionForm action={saveEvent}>
      {event && <input type="hidden" name="event_id" value={event.id} />}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">The event</legend>
        <TextField name="title" label="Title" defaultValue={event?.title} maxLength={140} />
        <TextField name="summary" label="One-line summary" defaultValue={event?.summary} maxLength={300} hint="Shown on event cards." />
        <TextAreaField name="description" label="Description" rows={8} defaultValue={event?.description} hint="What will people do, learn or build? Who is it for? What should they bring?" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="event_type"
            label="Type"
            defaultValue={event?.event_type ?? "workshop"}
            options={Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
            hint="Hackathons, competitions and external events also need VP or President approval."
          />
          <SelectField
            name="visibility"
            label="Who can see it"
            defaultValue={event?.visibility ?? "public"}
            options={[
              { value: "public", label: "Everyone" },
              { value: "members", label: "Club members only" },
            ]}
          />
          <SelectField
            name="owner_team_id"
            label="Organising team"
            placeholder="Choose a team"
            defaultValue={event?.owner_team_id}
            options={teams.map((t) => ({ value: t.id, label: t.name }))}
            hint="This team's lead reviews the proposal."
          />
          <SelectField
            name="domain_id"
            label="Domain"
            required={false}
            placeholder="None"
            defaultValue={event?.domain_id}
            options={domains.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-6">
        <legend className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">When and where</legend>
        <TextField name="venue" label="Venue" defaultValue={event?.venue} placeholder="e.g. Seminar Hall 2" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="starts_at" label="Starts" type="datetime-local" defaultValue={toLocalInput(event?.starts_at)} hint="India time." />
          <TextField name="ends_at" label="Ends" type="datetime-local" required={false} defaultValue={toLocalInput(event?.ends_at)} />
          <TextField name="reg_opens_at" label="Registration opens" type="datetime-local" required={false} defaultValue={toLocalInput(event?.reg_opens_at)} hint="Leave empty to open on publish." />
          <TextField name="reg_closes_at" label="Registration closes" type="datetime-local" required={false} defaultValue={toLocalInput(event?.reg_closes_at)} hint="Leave empty to close at the start time." />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-6">
        <legend className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">Participation</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["individual", "team"] as const).map((v) => (
            <label
              key={v}
              className="flex cursor-pointer items-center justify-center rounded-lg border border-line-strong px-3 py-2.5 text-sm text-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
            >
              <input
                type="radio"
                name="participation"
                value={v}
                checked={participation === v}
                onChange={() => setParticipation(v)}
                className="sr-only"
              />
              {v === "individual" ? "Individuals" : "Teams"}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField name="capacity" label="Capacity" type="number" min={1} required={false} defaultValue={event?.capacity} hint="Seats, counted per person. Over 100 makes it a major event." />
          {participation === "team" && (
            <>
              <TextField name="team_min" label="Min team size" type="number" min={1} max={10} defaultValue={event?.team_min ?? 2} />
              <TextField name="team_max" label="Max team size" type="number" min={2} max={10} defaultValue={event?.team_max ?? 4} />
            </>
          )}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <SubmitButton name="intent" value="submit" pendingLabel="Saving…">
          Save and submit for review
        </SubmitButton>
        <SubmitButton name="intent" value="draft" variant="secondary" pendingLabel="Saving…">
          Save draft
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
