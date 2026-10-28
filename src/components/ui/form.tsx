"use client";

import { createContext, useActionState, useContext, useId, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { initialActionState, type ActionState } from "@/lib/actions/state";
import { buttonClass } from "./button";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<ActionState>(initialActionState);

/**
 * Form bound to a server action through useActionState.
 * Shows the action's error or success message and feeds field errors to <Field>.
 */
export function ActionForm({
  action,
  children,
  className,
  successMessage,
  hideMessages,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  successMessage?: string;
  hideMessages?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <FormStateContext value={state}>
      <form action={formAction} className={cn("flex flex-col gap-4", className)} noValidate>
        {!hideMessages && state.error && (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        {!hideMessages && state.ok && (state.message || successMessage) && (
          <p role="status" className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
            {state.message ?? successMessage}
          </p>
        )}
        {children}
      </form>
    </FormStateContext>
  );
}

export function useFormState() {
  return useContext(FormStateContext);
}

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-bg px-3 py-2 text-sm text-fg placeholder:text-subtle transition-colors hover:border-subtle focus:border-primary focus:outline-none aria-[invalid=true]:border-danger";

type FieldProps = {
  name: string;
  label: string;
  hint?: ReactNode;
  className?: string;
  required?: boolean;
};

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {!required && <span className="ml-1.5 font-normal text-subtle">optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[0.8125rem] text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[0.8125rem] text-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function useField(name: string, defaultValue?: string | number | null) {
  const id = useId();
  const state = useFormState();
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? (defaultValue == null ? undefined : String(defaultValue));
  return { id, error, value };
}

export function TextField({
  name,
  label,
  hint,
  className,
  required = true,
  defaultValue,
  ...input
}: FieldProps & Omit<ComponentProps<"input">, "name" | "defaultValue"> & { defaultValue?: string | number | null }) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        key={value}
        defaultValue={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass}
        {...input}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  className,
  required = true,
  defaultValue,
  rows = 5,
  ...input
}: FieldProps & Omit<ComponentProps<"textarea">, "name" | "defaultValue"> & { defaultValue?: string | null }) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        id={id}
        name={name}
        key={value}
        rows={rows}
        defaultValue={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(inputClass, "min-h-24 resize-y leading-relaxed")}
        {...input}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  className,
  required = true,
  defaultValue,
  options,
  placeholder,
}: FieldProps & {
  defaultValue?: string | null;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <select
        id={id}
        name={name}
        key={value}
        defaultValue={value ?? ""}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(inputClass, "h-10")}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

/** Group of checkboxes submitted under one name (read with formData.getAll). */
export function CheckboxGroup({
  name,
  label,
  hint,
  options,
  defaultValues = [],
  required = true,
}: FieldProps & { options: Array<{ value: string; label: string }>; defaultValues?: string[] }) {
  const state = useFormState();
  const error = state.fieldErrors?.[name];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">
        {label}
        {!required && <span className="ml-1.5 font-normal text-subtle">optional</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-bg px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
          >
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={defaultValues.includes(o.value)}
              className="accent-[var(--color-primary)]"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error ? <p className="text-[0.8125rem] text-danger">{error}</p> : hint && <p className="text-[0.8125rem] text-subtle">{hint}</p>}
    </fieldset>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 accent-[var(--color-primary)]"
      />
      <span className="flex flex-col">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-[0.8125rem] text-subtle">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={buttonClass(variant, size, className)}
    >
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}
