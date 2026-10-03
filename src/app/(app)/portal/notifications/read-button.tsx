"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EMPTY_FORM_STATE } from "@/lib/forms/form-state";
import { readNotificationAction } from "./actions";
export function ReadButton({ id }: { id?: string }) {
  const [state, action, pending] = useActionState(readNotificationAction, EMPTY_FORM_STATE);
  return (
    <form action={action}>
      {id ? (
        <input type="hidden" name="id" value={id} />
      ) : (
        <input type="hidden" name="all" value="yes" />
      )}
      {state.message && <Alert>{state.message}</Alert>}
      <Button type="submit" size="sm" disabled={pending}>
        {id ? "Mark read" : "Mark all read"}
      </Button>
    </form>
  );
}
