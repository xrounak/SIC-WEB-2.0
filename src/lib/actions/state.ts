import type { ZodError } from "zod";
import { rpcErrorMessage } from "@/lib/rpc-errors";

/** Shape every form action returns to useActionState. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Echo of submitted values so fields keep their content after an error. */
  values?: Record<string, string>;
};

export const initialActionState: ActionState = {};

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  }
  return values;
}

export function fromZodError(error: ZodError, formData: FormData): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Check the highlighted fields.", fieldErrors, values: formValues(formData) };
}

export function fromRpcError(error: { message?: string }, formData?: FormData): ActionState {
  return { error: rpcErrorMessage(error), values: formData ? formValues(formData) : undefined };
}
