import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Transparent FX & Payout Fees | Nexus Pay" },
      {
        name: "description",
        content:
          "Simple plans for wallets, virtual accounts and payouts. No setup fees, volume pricing available.",
      },
      { property: "og:title", content: "Nexus Pay Pricing" },
      {
        property: "og:description",
        content: "Transparent plans and FX spreads for hybrid fiat and crypto payments.",
      },
    ],
  }),
  component: PricingPage,
});

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    note: "per month",
    features: ["2 fiat wallets", "1 crypto wallet", "1.0% FX spread", "$4 per payout", "Email support"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$499",
    note: "per month",
    features: [
      "Unlimited wallets",
      "USD & EUR virtual accounts",
      "0.45% FX spread",
      "$1.50 per payout",
      "Webhooks & API keys",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "annual",
    features: [
      "Dedicated ledger partition",
      "Negotiated FX pricing",
      "Interchange-level payout fees",
      "SLA & named CSM",
      "SSO and audit exports",
    ],
    highlighted: false,
  },
];

const FEE_TABLE = [
  ["Incoming ACH / SEPA", "Free", "Free", "Free"],
  ["Incoming wire", "$12", "$8", "Custom"],
  ["Crypto deposit", "Free", "Free", "Free"],
  ["FX spread", "1.00%", "0.45%", "Custom"],
  ["Outgoing payout", "$4.00", "$1.50", "Custom"],
];

function PricingPage() {
  return (
    <MarketingPage
      eyebrow="Pricing"
      title="Pay for movement, not for seats"
      intro="Every plan includes the full ledger, KYC onboarding and the complete API. You upgrade for volume pricing and virtual accounts, not for features you already need."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={
              plan.highlighted
                ? "relative rounded-2xl border border-primary/30 bg-card p-7 shadow-elevated"
                : "rounded-2xl border border-border bg-card p-7"
            }
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-5 font-display text-4xl font-extrabold text-foreground">
              {plan.price}
              <span className="ml-1 text-sm font-medium text-muted-foreground">{plan.note}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={plan.highlighted ? "default" : "outline"}
              className="mt-8 w-full rounded-full"
            >
              <Link to={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                {plan.name === "Enterprise" ? "Talk to sales" : "Get Started"}
              </Link>
            </Button>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold text-foreground">Fee detail</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-secondary/60 text-left">
              <tr>
                {["", "Starter", "Growth", "Enterprise"].map((h) => (
                  <th key={h} className="px-5 py-3.5 font-semibold text-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEE_TABLE.map((row) => (
                <tr key={row[0]} className="border-t border-border bg-card">
                  <td className="px-5 py-3.5 text-foreground">{row[0]}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row[1]}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row[2]}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MarketingPage>
  );
}
