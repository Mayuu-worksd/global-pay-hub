import { createFileRoute, Link } from "@tanstack/react-router";
import { Bitcoin, Landmark, Repeat, Send, Wallet } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Wallets, Virtual Accounts & Payouts | GlobalPay" },
      {
        name: "description",
        content:
          "Fiat wallets, crypto wallets, virtual bank accounts, currency exchange and international payouts in one platform.",
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
      <div className="grid gap-6 lg:grid-cols-2">
        {PRODUCTS.map((product) => (
          <article 
            key={product.name} 
            className="border-4 border-black bg-white p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <span className="grid size-11 place-items-center bg-[#1677FF] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-5">
              <product.icon className="size-5" />
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight">{product.name}</h2>
            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-gray-600">{product.body}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {product.points.map((p) => (
                <li
                  key={p}
                  className="bg-gray-100 border-2 border-black px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider shadow-[1px_1px_0px_0px_#000]"
                >
                  {p}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* CTA Box */}
      <div className="mt-12 flex flex-col items-start gap-4 border-4 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-black uppercase tracking-tight">
            Open your first wallet today
          </h2>
          <p className="text-xs font-semibold text-gray-500">
            Verification takes minutes. No setup fee on Starter.
          </p>
        </div>
        <Link 
          to="/signup"
          className="bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-xs border-2 border-black py-3 px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
        >
          Get Started
        </Link>
      </div>
    </MarketingPage>
  );
}
