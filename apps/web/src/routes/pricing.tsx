import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-page";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Transparent FX & Payout Fees | GlobalPay" },
      {
        name: "description",
        content:
          "Simple plans for wallets, virtual accounts and payouts. No setup fees, volume pricing available.",
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
      {/* Plans Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`border-4 border-black p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative ${
              plan.highlighted ? "bg-white border-[#1677FF] shadow-[4px_4px_0px_0px_#000]" : "bg-white"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3.5 left-6 bg-[#1677FF] text-white px-2.5 py-0.5 border border-black font-mono text-[9px] font-extrabold uppercase tracking-wider animate-pulse">
                Most popular
              </span>
            )}
            
            <div className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight">{plan.name}</h2>
              <p className="font-mono text-4xl font-black text-black mt-2">
                {plan.price}
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
                  / {plan.note}
                </span>
              </p>
              <ul className="space-y-2.5 border-t border-gray-200 pt-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs font-bold text-gray-600">
                    <Check className="mt-0.5 size-3.5 text-[#1677FF] stroke-[3px] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to={plan.name === "Enterprise" ? "/contact" : "/signup"}
              className={`w-full font-extrabold uppercase text-xs py-3 text-center border-2 border-black mt-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center ${
                plan.highlighted ? "bg-[#1677FF] text-white" : "bg-white text-black"
              }`}
            >
              {plan.name === "Enterprise" ? "Talk to sales" : "Get Started"}
            </Link>
          </div>
        ))}
      </div>

      {/* Fee Table Section */}
      <section className="mt-16 space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight">Fee detail</h2>
        <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                <th className="p-4 border-r border-black">Fee Category</th>
                <th className="p-4 border-r border-black">Starter</th>
                <th className="p-4 border-r border-black">Growth</th>
                <th className="p-4">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-semibold text-sm">
              {FEE_TABLE.map((row) => (
                <tr key={row[0]}>
                  <td className="p-4 border-r border-black font-bold">{row[0]}</td>
                  <td className="p-4 border-r border-black font-mono text-xs text-gray-600">{row[1]}</td>
                  <td className="p-4 border-r border-black font-mono text-xs text-gray-600">{row[2]}</td>
                  <td className="p-4 font-mono text-xs text-gray-600">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MarketingPage>
  );
}
