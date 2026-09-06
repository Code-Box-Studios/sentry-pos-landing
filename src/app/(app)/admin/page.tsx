import Link from "next/link";
import { OwnerStatusBadge } from "@/components/app/owner-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { listOwners } from "@/lib/api/admin";
import { formatManilaDate } from "@/lib/format";

export default async function AdminOwnersPage() {
  const owners = await listOwners();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Owners</h1>
          <p className="mt-1 text-sm text-steel">
            {owners.length} account{owners.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link href="/admin/owners/new" className={buttonVariants()}>
          Add owner
        </Link>
      </div>

      <Card>
        {owners.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-steel">
            No owners yet. Add the first one to send an invitation.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Status</TH>
                <TH>Businesses</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {owners.map((owner) => (
                <TR key={owner.id}>
                  <TD>
                    <Link
                      href={`/admin/owners/${owner.id}`}
                      className="font-medium text-brand-green-dark hover:underline"
                    >
                      {owner.name}
                    </Link>
                  </TD>
                  <TD className="text-steel">{owner.email}</TD>
                  <TD>
                    <OwnerStatusBadge status={owner.status} />
                  </TD>
                  <TD className="text-steel">up to {owner.maxBusinesses}</TD>
                  <TD className="text-steel">{formatManilaDate(owner.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
