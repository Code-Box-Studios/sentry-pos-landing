import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { BusinessSwitcher } from "@/components/app/business-switcher";
import { NotFoundError } from "@/lib/api/errors";
import { getBusiness, listBusinesses } from "@/lib/api/portal";

export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  let business;
  try {
    business = await getBusiness(businessId);
  } catch (error) {
    // A business belonging to someone else reads as absent — the API scopes it away.
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const businesses = await listBusinesses();
  const base = `/portal/businesses/${businessId}`;

  return (
    <AppShell
      title={business.name}
      // Each section is added here by the task that creates its route — a nav entry
      // pointing at a page that does not exist yet is just a link to a 404.
      nav={[
        { href: base, label: "Overview" },
        { href: `${base}/catalog`, label: "Products" },
        { href: `${base}/categories`, label: "Categories" },
        { href: `${base}/modifiers`, label: "Modifiers" },
        { href: `${base}/discounts`, label: "Discounts" },
        { href: `${base}/settings`, label: "Settings" },
        { href: "/portal", label: "← All businesses" },
      ]}
      aside={
        <BusinessSwitcher
          businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
          current={businessId}
        />
      }
    >
      {children}
    </AppShell>
  );
}
