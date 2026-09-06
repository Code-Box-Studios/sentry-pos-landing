import Link from "next/link";
import { ConfirmDelete } from "@/components/app/confirm-delete";
import { EmptyState } from "@/components/app/empty-state";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listBranches } from "@/lib/api/portal";
import { deleteBranchAction, saveBranchAction } from "./actions";
import { BranchForm } from "./branch-form";

export default async function BranchesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const branches = await listBranches(businessId);
  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Branches</h1>
        <p className="mt-1 text-sm text-steel">
          A branch code becomes part of every receipt number that branch issues
          (<span className="font-mono">MKT-T1-000318</span>), so it cannot be changed once the
          branch exists.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a branch</CardTitle>
        </CardHeader>
        <CardBody>
          <BranchForm action={saveBranchAction} businessId={businessId} />
        </CardBody>
      </Card>

      <Card>
        {branches.length === 0 ? (
          <EmptyState
            title="No branches yet"
            body="A terminal pairs to a branch, so add at least one before setting up a till."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Branch</TH>
                <TH className="w-24">Stock</TH>
                <TH className="w-40" />
              </TR>
            </THead>
            <TBody>
              {branches.map((branch) => (
                <TR key={branch.id}>
                  <TD>
                    <BranchForm
                      action={saveBranchAction}
                      businessId={businessId}
                      branch={branch}
                    />
                  </TD>
                  <TD>
                    <Link
                      href={`${base}/branches/${branch.id}/stock`}
                      className="text-sm text-brand-green-dark hover:underline"
                    >
                      Stock
                    </Link>
                  </TD>
                  <TD>
                    <ConfirmDelete
                      action={deleteBranchAction}
                      name={branch.name}
                      hidden={{ businessId, id: branch.id }}
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
