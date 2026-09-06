import Link from "next/link";
import { NewOwnerForm } from "./new-owner-form";
import { createOwnerAction } from "./actions";

export default function NewOwnerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-steel hover:underline">
          ← Owners
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Add an owner</h1>
        <p className="mt-1 text-sm text-steel">
          Creates the account and emails an invitation. The owner sets their own password;
          nobody here ever sees it.
        </p>
      </div>
      <NewOwnerForm action={createOwnerAction} />
    </div>
  );
}
