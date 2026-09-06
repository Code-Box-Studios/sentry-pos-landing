"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * The requestId is the only handle support has on the server-side log, so it is shown
 * whenever the API gave us one. `error.message` is safe to print: the API's exception filter
 * never puts internals in it.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const requestId = (error as { requestId?: string }).requestId;

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
      <Alert className="mt-4">{error.message || "An unexpected error occurred."}</Alert>
      {requestId ? (
        <p className="mt-3 font-mono text-xs text-steel">Reference: {requestId}</p>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
