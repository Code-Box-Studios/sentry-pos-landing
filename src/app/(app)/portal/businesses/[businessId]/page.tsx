import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusiness, listBranches, listProducts } from "@/lib/api/portal";

function StatCard({
  title,
  value,
  href,
  linkLabel,
}: {
  title: string;
  value: number;
  href: string;
  linkLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="text-2xl font-semibold text-ink">{value}</p>
        <Link
          href={href}
          className="mt-2 inline-block text-sm text-brand-green-dark hover:underline"
        >
          {linkLabel}
        </Link>
      </CardBody>
    </Card>
  );
}

export default async function BusinessOverviewPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;
  const [business, products, branches] = await Promise.all([
    getBusiness(businessId),
    listProducts(businessId),
    listBranches(businessId),
  ]);

  const base = `/portal/businesses/${businessId}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{business.name}</h1>
        <p className="mt-1 text-sm text-steel">
          {business.type} · VAT {(Number(business.taxRate) * 100).toFixed(2)}%
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Products"
          value={products.length}
          href={`${base}/catalog`}
          linkLabel="Manage catalog"
        />
        <StatCard
          title="Branches"
          value={branches.length}
          href={`${base}/branches`}
          linkLabel="Manage branches"
        />
      </div>
    </div>
  );
}
