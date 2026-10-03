import { PolicyPage } from "@/components/landing/PolicyPage";
import { getLegalPages } from "@/lib/legal";
export async function generateMetadata() {
  const legal = await getLegalPages();
  return { title: "Privacy policy — Sentry", alternates: { canonical: "/privacy" }, robots: { index: Boolean(legal.privacy?.published), follow: true } };
}
export default function PrivacyPage() { return <PolicyPage kind="privacy" />; }
