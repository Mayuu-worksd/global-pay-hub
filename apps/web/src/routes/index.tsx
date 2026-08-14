import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  Bitcoin,
  Building2,
  Check,
  Globe2,
  Landmark,
  Repeat,
  Send,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: "GlobalPay Hub — Global Hybrid Payment Infrastructure" },
      {
        name: "description",
        content:
          "One API for fiat wallets, crypto wallets, virtual bank accounts, currency exchange and international payouts.",
      },
      { property: "og:title", content: "GlobalPay — Global Hybrid Payment Infrastructure" },
      {
        property: "og:description",
        content:
          "Fiat and crypto wallets, virtual bank accounts, FX and payouts for global businesses.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Wallet,
    title: "Fiat wallets",
    body: "Hold and settle in USD and EUR with segregated balances, instant internal transfers and full ledger history.",
  },
  {
    icon: Bitcoin,
    title: "Crypto wallets",
    body: "BTC, ETH and USDT wallets with per-asset deposit addresses and automatic conversion into fiat balances.",
  },
  {
    icon: Landmark,
    title: "Virtual bank accounts",
    body: "Named collection accounts with real account and routing numbers, so customers pay you locally.",
  },
  {
    icon: Repeat,
    title: "Currency exchange",
    body: "Transparent mid-market conversion between fiat and digital assets with a locked rate per quote.",
  },
  {
    icon: Send,
    title: "International payouts",
    body: "Send to bank accounts and wallets across 60+ corridors with tracked status on every transfer.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance built in",
    body: "KYC onboarding, sanctions screening hooks and immutable audit trails on every money movement.",
  },
];

const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "BTC", name: "Bitcoin" },
  { code: "ETH", name: "Ethereum" },
  { code: "USDT", name: "Tether" },
];

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    note: "per month",
    description: "For teams validating cross-border flows.",
    features: ["2 fiat wallets", "1 crypto wallet", "1.0% FX spread", "Email support"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$499",
    note: "per month",
    description: "For scaling platforms with real volume.",
    features: [
      "Unlimited wallets",
      "Virtual accounts (USD & EUR)",
      "0.45% FX spread",
      "Webhooks & API keys",
      "Priority support",
    ],
    cta: "Get started",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "annual",
    description: "For regulated institutions and marketplaces.",
    features: [
      "Dedicated ledger partition",
      "Custom FX pricing",
      "SLA & named CSM",
      "SSO and audit exports",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

const CODE_SAMPLE = `curl https://api.globalpay.io/v1/payouts \\
  -H "Authorization: Bearer $GLOBALPAY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "source_wallet": "wal_usd_9f21",
    "amount": 4500.00,
    "currency": "USD",
    "beneficiary": "ben_28fa",
    "reference": "INV-10422"
  }'`;

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#1677FF] selection:text-white">
      <SiteHeader />

      <main className="divide-y-4 divide-black">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white grid-lines py-20 lg:py-28 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 font-mono text-xs font-bold border-2 border-black tracking-widest uppercase shadow-[2px_2px_0px_0px_#1677FF]">
                <Zap className="size-3.5 fill-white" />
                USDT SETTLEMENT ACTIVE
              </span>
              
              <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-tighter">
                GLOBAL HYBRID <br />
                <span className="text-[#1677FF]">PAYMENT STACK.</span>
              </h1>
              
              <p className="max-w-xl text-base sm:text-lg font-semibold leading-relaxed text-gray-700 border-l-4 border-[#1677FF] pl-4">
                Move money between fiat and digital assets on one compliant platform. Open wallets,
                issue virtual bank accounts, convert currencies and pay out worldwide — through a
                single dashboard and a single API.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  to="/signup"
                  className="bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-sm border-2 border-black py-4 px-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                >
                  Create an account
                  <ArrowRight className="size-4 stroke-[3px]" />
                </Link>
                <Link
                  to="/developers"
                  className="bg-white hover:bg-gray-50 text-black font-extrabold uppercase text-sm border-2 border-black py-4 px-8 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Read the API docs
                </Link>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-black">
                {[
                  ["$4.2B", "Processed annually"],
                  ["60+", "Payout corridors"],
                  ["99.99%", "API uptime"],
                ].map(([value, label]) => (
                  <div key={label} className="font-mono">
                    <dt className="text-xl sm:text-2xl font-black text-black">{value}</dt>
                    <dd className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wide mt-1">{label}</dd>
                  </div>
                ))}
              </div>
            </div>

            {/* Stylized Neo-Brutalist Logo Visual */}
            <div className="flex flex-col items-center justify-center py-6 select-none">
              <div className="relative grid size-48 place-items-center bg-[#1677FF] border-8 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:translate-x-1 duration-200">
                {/* Inner white square */}
                <div className="size-16 bg-white border-4 border-black" />
                {/* Upper-right white dot */}
                <div className="absolute right-5 top-5 size-7 rounded-full bg-white border-4 border-black" />
              </div>
              
              <div className="mt-8 text-center font-sans text-5xl lg:text-6xl font-black uppercase tracking-tighter">
                Global<span className="text-[#1677FF]">Pay</span>
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-20 lg:py-28 px-6">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl space-y-3">
              <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#1677FF] border-b-2 border-black pb-1">
                Platform features
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                EVERYTHING A TREASURY TEAM NEEDS
              </h2>
              <p className="text-sm font-semibold text-gray-500 leading-relaxed">
                Purpose-built API primitives instead of a patchwork of fragmented banking partners, local brokers, and manual ledger spreadsheets.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <span className="grid size-11 place-items-center bg-[#1677FF] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-5">
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight">{feature.title}</h3>
                  <p className="mt-2.5 text-xs font-semibold leading-relaxed text-gray-600">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Currencies Strip */}
        <section className="bg-gray-50 py-12 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_1.8fr] gap-8 items-center">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                SUPPORTED ASSETS
              </h2>
              <p className="text-xs font-semibold text-gray-500 max-w-sm leading-relaxed">
                Fiat balances and digital currencies settle on the exact same unified ledger, so balance management is seamless.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CURRENCIES.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-3 border-2 border-black bg-white p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <span className="font-mono text-xs font-black bg-[#1677FF] text-white px-2 py-0.5 border border-black">
                    {c.code}
                  </span>
                  <span className="text-xs font-bold text-gray-700 truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Docs & Code Strip */}
        <section className="bg-white py-20 lg:py-28 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <span className="font-mono text-xs font-extrabold uppercase tracking-widest text-[#1677FF] border-b-2 border-black pb-1">
                Developer tools
              </span>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-none">
                REST API DEVELOPERS LOVE
              </h2>
              <p className="text-sm font-semibold text-gray-600 leading-relaxed">
                Predictable endpoint layouts, webhook callbacks for real-time rails, idempotency keys, and full sandbox parity.
              </p>
              
              <ul className="space-y-3 font-semibold text-sm">
                {[
                  "Bearer-token authentication with scoped API keys",
                  "Webhooks for deposits, payouts and conversions",
                  "Sandbox environment with simulated settlement",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 text-[#1677FF] stroke-[3px] shrink-0" />
                    <span className="text-xs font-bold">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Link 
                to="/developers" 
                className="inline-block bg-white hover:bg-gray-50 text-black font-extrabold uppercase text-xs border-2 border-black py-3 px-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
              >
                Explore documentation
              </Link>
            </div>

            {/* Code Block Container */}
            <div className="border-4 border-black bg-black text-white shadow-[6px_6px_0px_0px_#1677FF] overflow-hidden">
              <div className="flex items-center gap-2 border-b-2 border-black bg-gray-900 px-4 py-3">
                <span className="size-2.5 rounded-full bg-red-500" />
                <span className="size-2.5 rounded-full bg-yellow-500" />
                <span className="size-2.5 rounded-full bg-green-500" />
                <span className="ml-2 font-mono text-[10px] text-gray-400">POST /v1/payouts</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-gray-200">
                {CODE_SAMPLE}
              </pre>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-gray-50 py-20 lg:py-28 px-6">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-2xl space-y-3 text-left">
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                PRICING SCALED BY VOLUME
              </h2>
              <p className="text-sm font-semibold text-gray-500 leading-relaxed">
                Zero setup fees. Zero minimums on Starter. Transition to custom volume pricing when you scale.
              </p>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`border-4 border-black p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between relative ${
                    plan.highlighted ? "bg-white border-[#1677FF] shadow-[4px_4px_0px_0px_#000]" : "bg-white"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3.5 left-6 bg-[#1677FF] text-white px-2.5 py-0.5 border border-black font-mono text-[9px] font-extrabold uppercase tracking-wider">
                      Most popular
                    </span>
                  )}
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-xs font-semibold text-gray-500 leading-relaxed">{plan.description}</p>
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
                    className={`w-full font-extrabold uppercase text-xs py-3 text-center border-2 border-black mt-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all ${
                      plan.highlighted ? "bg-[#1677FF] text-white" : "bg-white text-black"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-7xl mx-auto border-4 border-black p-8 sm:p-14 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-6 relative overflow-hidden">
            
            <div className="space-y-3 relative z-10">
              <Globe2 className="mx-auto size-9 text-[#1677FF]" />
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                LAUNCH YOUR GLOBAL PAYMENT STACK
              </h2>
              <p className="mx-auto max-w-xl text-xs sm:text-sm font-semibold text-gray-500 leading-relaxed">
                Create a sandbox developer workspace, provision virtual accounts, and test your payout endpoints within minutes.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link
                to="/signup"
                className="bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-xs border-2 border-black py-3 px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
              >
                Get Started
              </Link>
              <Link
                to="/contact"
                className="bg-white hover:bg-gray-50 text-black font-extrabold uppercase text-xs border-2 border-black py-3 px-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </section>

        {/* Security Compliance Strip */}
        <section className="bg-white py-12 px-6">
          <div className="max-w-7xl mx-auto grid gap-6 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "SOC 2 Type II controls aligned" },
              { icon: Building2, label: "Regulated banking providers" },
              { icon: Banknote, label: "Segregated client accounts" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 border-2 border-black bg-white px-5 py-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <item.icon className="size-5 text-[#1677FF] shrink-0" />
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
