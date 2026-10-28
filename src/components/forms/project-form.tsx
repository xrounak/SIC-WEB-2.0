import { saveProject } from "@/lib/actions/projects";
import { ActionForm, CheckboxGroup, SelectField, SubmitButton, TextAreaField, TextField } from "@/components/ui/form";
import type { Domain, Project, Team } from "@/lib/types";

export function ProjectForm({
  project,
  projectDomainIds = [],
  teams,
  domains,
}: {
  project?: Project;
  projectDomainIds?: string[];
  teams: Team[];
  domains: Domain[];
}) {
  return (
    <ActionForm action={saveProject}>
      {project && <input type="hidden" name="project_id" value={project.id} />}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">Overview</legend>
        <TextField name="title" label="Project name" defaultValue={project?.title} maxLength={140} />
        <TextField name="summary" label="One-line summary" defaultValue={project?.summary} maxLength={300} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="owner_team_id"
            label="Team"
            placeholder="Choose a team"
            defaultValue={project?.owner_team_id}
            options={teams.map((t) => ({ value: t.id, label: t.name }))}
            hint="This team's lead reviews the project."
          />
          <SelectField
            name="visibility"
            label="Who can see it"
            defaultValue={project?.visibility ?? "public"}
            options={[
              { value: "public", label: "Everyone" },
              { value: "members", label: "Club members only" },
            ]}
          />
        </div>
        <CheckboxGroup
          name="domains"
          label="Domains"
          required={false}
          defaultValues={projectDomainIds}
          options={domains.map((d) => ({ value: d.id, label: d.name }))}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-6">
        <legend className="mb-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-subtle">The build</legend>
        <TextAreaField name="problem" label="The problem" rows={4} defaultValue={project?.problem} />
        <TextAreaField name="solution" label="What you built" rows={5} defaultValue={project?.solution} />
        <TextAreaField name="hardware_details" label="Hardware" required={false} rows={3} defaultValue={project?.hardware_details} hint="Components, materials, fabrication." />
        <TextAreaField name="software_details" label="Software" required={false} rows={3} defaultValue={project?.software_details} hint="Stack, models, firmware." />
        <TextAreaField name="outcomes" label="Outcomes" required={false} rows={3} defaultValue={project?.outcomes} hint="Results, measurements, awards, what you'd do next." />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="repo_url" label="Source code link" type="url" required={false} defaultValue={project?.repo_url} placeholder="https://github.com/…" />
          <TextField name="demo_url" label="Demo link" type="url" required={false} defaultValue={project?.demo_url} placeholder="https://…" />
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
