import type { FormState } from "@/lib/forms/form-state";
export interface OperationState extends FormState {
  uncertain?: true;
}
