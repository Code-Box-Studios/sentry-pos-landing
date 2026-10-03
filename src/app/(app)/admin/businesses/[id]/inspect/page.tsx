import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Table, THead, TBody, TH, TD, TR } from "@/components/ui/table";
import { Pagination } from "@/components/app/pagination";
import { inspectBusiness, type InspectorSection } from "@/lib/api/admin";
const sections: Record<InspectorSection, { label: string; columns: [string, string][] }> = {
  catalog: {
    label: "Catalog",
    columns: [
      ["name", "Name"],
      ["sku", "SKU"],
      ["price", "Price (centavos)"],
      ["cost", "Cost (centavos)"],
      ["active", "Active"],
      ["trackStock", "Tracks stock"],
      ["variants", "Variants"],
    ],
  },
  sales: {
    label: "Sales",
    columns: [
      ["receiptNo", "Receipt"],
      ["branchId", "Branch ID"],
      ["createdAt", "Created"],
      ["status", "Status"],
      ["total", "Total (centavos)"],
    ],
  },
  payments: {
    label: "Payments",
    columns: [
      ["saleId", "Sale ID"],
      ["method", "Method"],
      ["amount", "Amount (centavos)"],
    ],
  },
  shifts: {
    label: "Shifts",
    columns: [
      ["branchId", "Branch ID"],
      ["terminalId", "Terminal ID"],
      ["openedAt", "Opened"],
      ["closedAt", "Closed"],
      ["openingCash", "Opening cash (centavos)"],
      ["closingCash", "Closing cash (centavos)"],
      ["expectedCash", "Expected cash (centavos)"],
    ],
  },
  stock: {
    label: "Stock",
    columns: [
      ["branchId", "Branch ID"],
      ["productId", "Product ID"],
      ["variantId", "Variant ID"],
      ["qty", "Quantity"],
    ],
  },
  counts: {
    label: "Counts",
    columns: [
      ["branchId", "Branch ID"],
      ["status", "Status"],
      ["countedAt", "Counted"],
      ["postedAt", "Posted"],
      ["notes", "Notes"],
      ["items", "Items"],
    ],
  },
  terminals: {
    label: "Terminals",
    columns: [
      ["branchId", "Branch ID"],
      ["name", "Name"],
      ["code", "Code"],
      ["createdAt", "Created"],
      ["lastSeenAt", "Last seen"],
      ["deletedAt", "Deleted"],
      ["paired", "Paired"],
    ],
  },
};
function cell(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object")
    return (
      <details>
        <summary className="cursor-pointer text-brand-green-dark">
          View {Array.isArray(value) ? `${value.length} items` : "details"}
        </summary>
        <pre className="max-w-lg overflow-auto whitespace-pre-wrap text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    );
  return String(value);
}
export default async function BusinessInspectorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; page?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const section: InspectorSection =
    query.section && Object.hasOwn(sections, query.section)
      ? (query.section as InspectorSection)
      : "catalog";
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const report = await inspectBusiness(id, section, page);
  const config = sections[section];
  const base = `/admin/businesses/${id}/inspect`;
  return (
    <div className="space-y-6">
      <Link href={`/admin/businesses/${id}`} className="text-sm text-steel hover:underline">
        ← Business overview
      </Link>
      <h1 className="text-xl font-semibold">Business data</h1>
      <p className="text-sm text-steel">
        Read-only platform inspection. Monetary fields below are integer centavos.
      </p>
      <nav className="flex flex-wrap gap-4 text-sm">
        {Object.entries(sections).map(([key, value]) => (
          <Link
            key={key}
            href={`${base}?section=${key}`}
            aria-current={section === key ? "page" : undefined}
            className="text-brand-green-dark aria-[current=page]:font-semibold"
          >
            {value.label}
          </Link>
        ))}
      </nav>
      <Card>
        <CardBody>
          {!report.data.length ? (
            <p className="text-sm text-steel">No {config.label.toLowerCase()} records.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  {config.columns.map(([key, label]) => (
                    <TH key={key}>{label}</TH>
                  ))}
                </TR>
              </THead>
              <TBody>
                {report.data.map((row, index) => (
                  <TR key={String(row.id ?? index)}>
                    <TD className="font-mono text-xs">{cell(row.id)}</TD>
                    {config.columns.map(([key]) => (
                      <TD key={key}>{cell(row[key])}</TD>
                    ))}
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>
      <Pagination
        page={report.page}
        totalPages={report.totalPages}
        baseHref={base}
        query={{ section }}
      />
    </div>
  );
}
