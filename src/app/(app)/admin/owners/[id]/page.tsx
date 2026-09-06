import Link from "next/link";
import { notFound } from "next/navigation";
import { OwnerStatusBadge } from "@/components/app/owner-status-badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { getOwner, listOwnerBusinesses } from "@/lib/api/admin";
import { NotFoundError } from "@/lib/api/errors";
import { formatManilaDateTime } from "@/lib/format";
import { reinstateOwnerAction, suspendOwnerAction } from "./actions";
import { StatusControls } from "./status-controls";

export default async function OwnerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invited?: string }>;
}) {
  const { id } = await params;
  const { invited } = await searchParams;

  let owner;
  try {
    owner = await getOwner(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const businesses = await listOwnerBusinesses(id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-steel hover:underline">
          ← Owners
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-ink">{owner.name}</h1>
          <OwnerStatusBadge status={owner.status} />
        </div>
        <p className="mt-1 text-sm text-steel">{owner.email}</p>
      </div>

      {invited ? (
        <Alert tone="info">
          An invitation has been emailed to {owner.email}. It expires in seven days. In
          development no mail is sent — read the link from the backend&apos;s console output.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="text-steel">
              Business limit: <span className="text-charcoal">{owner.maxBusinesses}</span>
            </p>
            <p className="text-steel">
              Created:{" "}
              <span className="text-charcoal">{formatManilaDateTime(owner.createdAt)}</span>
            </p>
            {owner.suspendedAt ? (
              <p className="text-steel">
                Suspended:{" "}
                <span className="text-charcoal">{formatManilaDateTime(owner.suspendedAt)}</span>
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
          </CardHeader>
          <CardBody>
            <StatusControls
              ownerId={owner.id}
              status={owner.status}
              suspendAction={suspendOwnerAction}
              reinstateAction={reinstateOwnerAction}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Businesses</CardTitle>
        </CardHeader>
        {businesses.length === 0 ? (
          <CardBody>
            <p className="text-sm text-steel">
              None yet. A demo business appears once the owner activates their account.
            </p>
          </CardBody>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Type</TH>
                <TH>Created</TH>
              </TR>
            </THead>
            <TBody>
              {businesses.map((business) => (
                <TR key={business.id}>
                  <TD>
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="font-medium text-brand-green-dark hover:underline"
                    >
                      {business.name}
                    </Link>
                    {business.isDemo ? (
                      <span className="ml-2 text-xs text-stone">demo</span>
                    ) : null}
                  </TD>
                  <TD className="text-steel">{business.type}</TD>
                  <TD className="text-steel">{formatManilaDateTime(business.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
