import { createFileRoute } from "@tanstack/react-router";
import { Building2, Globe2, ShoppingBag, Users } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions for Marketplaces, Platforms & Institutions | GlobalPay" },
      {
        name: "description",
        content:
          "How marketplaces, global platforms, payroll providers and institutions use GlobalPay for cross-border money movement.",
      },
    ],
  }),
  component: SolutionsPage,
});

const SOLUTIONS = [
  {
    icon: ShoppingBag,
    name: "Marketplaces",
    body: "Collect locally in USD and EUR, hold seller balances on ledger and pay out on your own schedule.",
    outcome: "Cut settlement time from days to minutes",
  },
  {
    icon: Globe2,
    name: "Global platforms",
    body: "Give every customer a wallet and a virtual account without becoming a licensed institution yourself.",
    outcome: "One integration for 60+ corridors",
  },
  {
    icon: Users,
    name: "Payroll & contractors",
    body: "Fund once, split into many payouts across fiat and stablecoins with beneficiary records retained.",
    outcome: "Bulk payouts with a single reference",
  },
  {
    icon: Building2,
    name: "Institutions",
    body: "Segregated ledger partitions, custom FX pricing and audit exports that satisfy internal controls.",
    outcome: "Controls your risk team will approve",
  },
];

function SolutionsPage() {
  return (
    <MarketingPage
      eyebrow="Solutions"
      title="Built for the businesses that move money for others"
      intro="The same infrastructure adapts to very different flows — collection-heavy marketplaces, payout-heavy platforms and treasury-heavy institutions."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {SOLUTIONS.map((s) => (
          <article 
            key={s.name} 
            className="border-4 border-black bg-white p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <span className="grid size-11 place-items-center bg-[#1677FF] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-5">
              <s.icon className="size-5" />
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight">{s.name}</h2>
            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-gray-600">{s.body}</p>
            <p className="mt-5 border-t border-gray-200 pt-4 font-mono text-xs font-extrabold uppercase text-[#1677FF] tracking-wider">
              → {s.outcome}
            </p>
          </article>
        ))}
      </div>
    </MarketingPage>
  );
}
