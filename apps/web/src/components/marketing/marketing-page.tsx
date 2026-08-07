import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export function MarketingPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden surface-hero border-b border-border">
          <div className="absolute inset-0 grid-lines opacity-50" aria-hidden />
          <div className="relative mx-auto w-full max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">{intro}</p>
          </div>
        </section>
        <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8 lg:py-20">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
