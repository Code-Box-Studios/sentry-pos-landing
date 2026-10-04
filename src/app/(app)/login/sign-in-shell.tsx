import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, ReceiptText, Users } from "lucide-react";
import type { ReactNode } from "react";

export function SignInShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-svh max-w-[1800px] bg-canvas min-[761px]:grid min-[761px]:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] min-[761px]:gap-4 min-[761px]:bg-surface min-[761px]:p-4 lg:gap-6 lg:p-6">
      <aside
        aria-label="Sentry"
        className="relative hidden min-w-0 flex-col overflow-hidden rounded-xl bg-brand-teal-deep px-12 py-10 text-white max-lg:p-8 min-[761px]:flex min-[1500px]:px-16 min-[1500px]:py-12"
      >
        <Link href="/" className="flex w-fit items-center gap-2.5 text-[25px] font-semibold tracking-[-.7px] text-white hover:text-white" aria-label="Sentry home">
          <Image src="/brand/sentry-mark-reverse.svg" alt="" width={38} height={38} priority />
          Sentry
        </Link>

        <div className="relative z-10 my-auto py-16 pb-[72px]">
          <p className="mb-[26px] flex items-center gap-[9px] text-xs font-semibold tracking-[1.8px] text-mist uppercase">
            <span aria-hidden="true" className="h-0.5 w-5 bg-brand-green" />
            Your business, connected
          </p>
          <h2 className="max-w-[520px] text-[clamp(44px,4.4vw,68px)] leading-[1.08] font-medium tracking-[-2.7px] max-lg:text-[45px] max-lg:tracking-[-1.7px]">
            Your business,<br />
            <span className="text-brand-green">always in sight.</span>
          </h2>
          <p className="mt-6 max-w-[350px] text-[17px] leading-[1.65] text-mist max-lg:text-[15px]">
            A clear view of your sales, stock, and team. All from one place.
          </p>
          <div className="mt-10 flex flex-wrap gap-6 text-[13px] text-white/85 max-lg:gap-4">
            <span className="flex items-center gap-2"><ReceiptText aria-hidden="true" size={17} className="text-brand-green" />Sales</span>
            <span className="flex items-center gap-2"><Package aria-hidden="true" size={17} className="text-brand-green" />Inventory</span>
            <span className="flex items-center gap-2"><Users aria-hidden="true" size={17} className="text-brand-green" />Your team</span>
          </div>
        </div>

        <Image
          src="/brand/sentry-mark-reverse.svg"
          alt=""
          width={560}
          height={560}
          className="pointer-events-none absolute -right-[175px] -bottom-40 h-[560px] w-[560px] max-w-none -rotate-12 opacity-[.025]"
        />
        <div className="relative z-10 flex justify-between gap-4 border-t border-white/12 pt-[22px] text-xs text-mist">
          <span>Made for Philippine businesses.</span>
          <span>© {new Date().getFullYear()} Sentry</span>
        </div>
      </aside>

      <section
        aria-labelledby="sign-in-title"
        className="flex min-w-0 flex-col rounded-xl bg-canvas px-8 pt-4 pb-2 max-lg:px-6 max-[761px]:min-h-svh max-[761px]:rounded-none max-[761px]:p-6"
      >
        <header className="flex min-h-10 items-center justify-end max-[761px]:justify-between">
          <Link href="/" className="hidden items-center gap-2.5 text-[23px] font-semibold tracking-[-.7px] text-ink hover:text-ink max-[761px]:inline-flex" aria-label="Sentry home">
            <Image src="/brand/sentry-mark.svg" alt="" width={32} height={32} priority />
            Sentry
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-[13px] text-steel hover:text-brand-green-dark max-[761px]:text-xs">
            <ArrowLeft aria-hidden="true" size={16} />Back to home
          </Link>
        </header>

        <div className="m-auto w-full max-w-[400px] py-14 max-[761px]:py-[60px]">
          <h1 id="sign-in-title" className="text-4xl leading-[1.2] font-semibold tracking-[-1.2px] text-ink max-[761px]:text-[32px]">
            Welcome back.
          </h1>
          <p className="mt-3 mb-8 text-[15px] leading-[1.6] text-steel">Sign in to your Sentry workspace.</p>
          {children}
        </div>

        <footer className="py-[18px] text-center text-[11px] text-steel max-[761px]:pt-4 max-[761px]:pb-2">
          Your business, always in sight.
        </footer>
      </section>
    </main>
  );
}
