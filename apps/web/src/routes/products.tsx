import { createFileRoute, Link } from "@tanstack/react-router";
import { Bitcoin, Landmark, Repeat, Send, Wallet } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Wallets, Virtual Accounts & Payouts | Nexus Pay" },
      {
        name: "description",
        content:
          "Fiat wallets, crypto wallets, virtual bank accounts, currency exchange and international payouts in one platform.",
      },
      { property: "og:title", content: "Nexus Pay Products" },
      {
        property: "og:description",
        content: "Wallets, virtual accounts, FX and payouts on one hybrid payment platform.",
      },
    ],
  }),
  component: ProductsPage,
});

const PRODUCTS = [
  {
    icon: Wallet,
    name: "Fiat wallets",
    body: "USD and EUR balances on a double-entry ledger. Instant internal transfers, per-wallet statements and exportable audit trails.",
    points: ["Segregated balances", "Instant internal transfer", "Statement exports"],
  },
  {
    icon: Bitcoin,
    name: "Crypto wallets",
    body: "BTC, ETH and USDT wallets with dedicated deposit addresses per asset and network, plus one-click conversion to fiat.",
    points: ["Per-asset addresses", "TRC-20 & ERC-20 USDT", "Auto-convert on receipt"],
  },
  {
    icon: Landmark,
    name: "Virtual bank accounts",
    body: "Named collection accounts with real account and routing details, so your customers pay locally while you settle centrally.",
    points: ["USD ACH & wire", "EUR IBAN & SEPA", "Reconciliation references"],
  },
  {
    icon: Repeat,
    name: "Currency exchange",
    body: "Quote, lock and execute conversions across fiat and digital assets with a fully auditable rate on every trade.",
    points: ["Locked quotes", "Transparent spread", "Full conversion history"],
  },
  {
    icon: Send,
    name: "International payouts",
    body: "Pay beneficiaries into bank accounts or wallets across 60+ corridors, with status tracked from initiation to settlement.",
    points: ["Saved beneficiaries", "Batch payouts", "Webhook status updates"],
  },
];

function ProductsPage() {
  return (
    <MarketingPage
      eyebrow="Products"
      title="Hybrid money infrastructure, componentised"
      intro="Use one module or the whole stack. Every product shares the same ledger, the same compliance layer and the same API surface."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {PRODUCTS.map((product) => (
          <article key={product.name} className="rounded-2xl glass-tile p-7">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <product.icon className="size-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">{product.name}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{product.body}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {product.points.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                >
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-secondary/40 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Open your first wallet today
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verification takes minutes. No setup fee on Starter.
          </p>
        </div>
        <Button asChild className="rounded-full px-6">
          <Link to="/signup">Get Started</Link>
        </Button>
      </div>
    </MarketingPage>
  );
}
