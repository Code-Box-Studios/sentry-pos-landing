import type { Metadata } from "next";
import { Figtree, Source_Code_Pro } from "next/font/google";
import "../globals.css";

// Same stand-ins the marketing site and the terminal use — design-spec names Euclid
// Circular A, whose licensing is pending. Source Code Pro carries every peso figure.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-scp",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sentry",
  // The authenticated app must never appear in a search index.
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${figtree.variable} ${sourceCodePro.variable} min-h-screen bg-surface font-sans text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
