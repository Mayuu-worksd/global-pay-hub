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
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#1677FF] selection:text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1 divide-y-4 divide-black">
        {/* Marketing Hero Header */}
        <section className="relative overflow-hidden bg-white grid-lines py-16 px-6">
          <div className="relative mx-auto w-full max-w-7xl space-y-4">
            <span className="inline-block font-mono text-xs font-extrabold uppercase tracking-widest text-[#1677FF] border-b-2 border-black pb-1">
              {eyebrow}
            </span>
            <h1 className="max-w-3xl font-sans text-4xl sm:text-5xl font-black uppercase leading-[0.95] tracking-tighter">
              {title}
            </h1>
            <p className="max-w-2xl text-base font-semibold leading-relaxed text-gray-700 border-l-4 border-[#1677FF] pl-4">
              {intro}
            </p>
          </div>
        </section>
        
        {/* Main Content Area */}
        <section className="bg-white py-16 px-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
