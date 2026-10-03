import Link from "next/link";
import { getLegalPages } from "@/lib/legal";

export async function PolicyPage({ kind }: { kind: "terms" | "privacy" }) {
  const content = await getLegalPages();
  const policy = content[kind];
  const title = kind === "terms" ? "Terms of service" : "Privacy policy";
  return <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
    <Link href="/" className="text-brand-green-mid">← Sentry</Link>
    <h1 className="mt-10 mb-6 text-4xl font-semibold">{title}</h1>
    {policy?.published && policy.body ? <>
      <p className="mb-2 font-medium">{content.businessName}</p>
      <p className="mb-8 text-sm text-slate">Effective {policy.effectiveDate?.slice(0, 10)}</p>
      <div className="space-y-5 leading-7">{policy.body.split(/\n\s*\n/).map((paragraph, i) => <p key={i} className="whitespace-pre-line">{paragraph}</p>)}</div>
      <p className="mt-10">Contact: <a className="underline" href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a></p>
    </> : <p className="leading-7 text-slate">This policy is being prepared. Please contact the Sentry team through the <Link href="/#contact" className="underline">contact section</Link> before signing up.</p>}
  </main>;
}
