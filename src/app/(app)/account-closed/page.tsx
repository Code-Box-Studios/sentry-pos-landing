import Link from "next/link";
import { AuthCard } from "@/components/app/auth-card";
import { formatManilaDate } from "@/lib/format";
export default async function AccountClosedPage({
  searchParams,
}: {
  searchParams: Promise<{ purgeAfter?: string }>;
}) {
  const { purgeAfter } = await searchParams;
  const validDate = purgeAfter && !Number.isNaN(Date.parse(purgeAfter));
  return (
    <AuthCard title="Account closed">
      <div className="space-y-4 text-sm">
        <p>Your sessions have ended. Keep your downloaded export in a safe place.</p>
        <p>
          {validDate
            ? `Account data is scheduled for deletion after ${formatManilaDate(purgeAfter)}.`
            : "Account data is retained for 90 days before scheduled deletion."}
        </p>
        <Link href="/" className="text-brand-green-dark hover:underline">
          Return to Sentry
        </Link>
      </div>
    </AuthCard>
  );
}
