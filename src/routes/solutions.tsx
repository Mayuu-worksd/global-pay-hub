import { createFileRoute } from "@tanstack/react-router";
import { Building2, Globe2, ShoppingBag, Users } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions for Marketplaces, Platforms & Institutions | Nexus Pay" },
      {
        name: "description",
        content:
          "How marketplaces, global platforms, payroll providers and institutions use Nexus Pay for cross-border money movement.",
      },
      { property: "og:title", content: "Nexus Pay Solutions" },
      {
        property: "og:description",
        content: "Cross-border money movement for marketplaces, platforms and institutions.",
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
      <div className="grid gap-5 md:grid-cols-2">
        {SOLUTIONS.map((s) => (
          <article key={s.name} className="rounded-2xl border border-border bg-card p-7">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <s.icon className="size-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">{s.name}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            <p className="mt-5 border-t border-border pt-4 text-sm font-medium text-primary">
              {s.outcome}
            </p>
          </article>
        ))}
      </div>
    </MarketingPage>
  );
}
