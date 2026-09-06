import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTable } from "@/components/app/activity-table";
import { Pagination } from "@/components/app/pagination";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listBusinessActivity, listBusinessBranches } from "@/lib/api/admin";
import { NotFoundError } from "@/lib/api/errors";

export default async function AdminBusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  let branches;
  let activity;
  try {
    [branches, activity] = await Promise.all([
      listBusinessBranches(id),
      listBusinessActivity(id, { page, pageSize: 50 }),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-steel hover:underline">
          ← Owners
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-ink">Business</h1>
      </div>

      {/* Stated plainly, because there is deliberately nothing on this page to click. */}
      <Alert tone="info">
        Platform admins can read tenant data but never change it. Anything that needs editing
        must be done by the business owner in their own portal.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        {branches.length === 0 ? (
          <CardBody>
            <p className="text-sm text-steel">This business has no branches yet.</p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Code</TH>
                <TH>Address</TH>
              </TR>
            </THead>
            <TBody>
              {branches.map((branch) => (
                <TR key={branch.id}>
                  <TD className="font-medium text-charcoal">{branch.name}</TD>
                  <TD className="font-mono text-xs text-steel">{branch.code}</TD>
                  <TD className="text-steel">{branch.address}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <ActivityTable entries={activity.data} />
        <Pagination
          page={activity.page}
          totalPages={activity.totalPages}
          baseHref={`/admin/businesses/${id}`}
        />
      </Card>
    </div>
  );
}
