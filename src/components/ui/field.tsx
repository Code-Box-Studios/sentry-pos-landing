import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Label } from "./label";

export interface FieldProps {
  /** Must match the control's `name`; it is also the id the label points at. */
  name: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

/**
 * Label, control and error text, wired together by id.
 *
 * The control is cloned to receive `id`, `aria-invalid` and `aria-describedby` so callers
 * cannot forget them — an unlabelled input and an error only sighted users can see are the
 * two failures that show up over and over in hand-wired forms.
 */
export function Field({ name, label, error, hint, children }: FieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: name,
        "aria-invalid": error ? "true" : undefined,
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {control}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-steel">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
