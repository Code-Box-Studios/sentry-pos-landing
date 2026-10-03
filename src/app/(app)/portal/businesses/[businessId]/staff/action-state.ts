import type { FormState } from "@/lib/forms/form-state";
import type { StaffMember } from "@/lib/api/staff";
export interface StaffState extends FormState {
  staff?: StaffMember;
  temporaryPin?: string;
}
export type StaffFormAction = (
  state: StaffState,
  data: FormData,
) => Promise<StaffState>;
