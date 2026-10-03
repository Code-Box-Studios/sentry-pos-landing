import { PolicyPage } from "@/components/landing/PolicyPage";
import { getLegalPages } from "@/lib/legal";
export async function generateMetadata() {
  const legal = await getLegalPages();
  return { title: "Terms of service — Sentry", alternates: { canonical: "/terms" }, robots: { index: Boolean(legal.terms?.published), follow: true } };
}
export default function TermsPage() { return <PolicyPage kind="terms" />; }
