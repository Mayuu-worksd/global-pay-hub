import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
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
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import heroImage from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus Pay — Global Hybrid Payment Infrastructure" },
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden surface-hero">
          <div className="absolute inset-0 grid-lines opacity-60" aria-hidden />
          <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
            <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Zap className="size-3.5" />
                Now supporting instant USDT settlement
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.06] text-foreground sm:text-5xl lg:text-6xl">
                Global Hybrid <span className="text-gradient">Payment Infrastructure</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Move money between fiat and digital assets on one compliant platform. Open wallets,
                issue virtual bank accounts, convert currencies and pay out worldwide — through a
                single dashboard and a single API.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7 shadow-glow">
                  <Link to="/signup">
                    Create an account <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                  <Link to="/developers">Read the API docs</Link>
                </Button>
              </div>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
                {[
                  ["$4.2B", "Processed annually"],
                  ["60+", "Payout corridors"],
                  ["99.99%", "API uptime"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-bold text-foreground">{value}</dt>
                    <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-3xl border border-border/70 shadow-elevated">
                <img
                  src={heroImage}
                  alt="GlobalPay dashboard showing multi-currency wallet balances and a payout flow"
                  className="w-full"
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-6 -left-4 hidden w-56 rounded-2xl glass-panel p-4 sm:block">
                <p className="text-xs text-muted-foreground">Settlement time</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">1.4s</p>
                <p className="mt-1 text-xs text-success">Median across all corridors</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Platform</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything a modern treasury needs
            </h2>
            <p className="mt-4 text-muted-foreground">
              Purpose-built primitives instead of a patchwork of banking partners, exchanges and
              spreadsheets.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="group rounded-2xl glass-tile p-6 transition-shadow hover:shadow-elevated"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Currencies */}
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-md">
                <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                  Supported currencies
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Fiat and digital assets settle on the same ledger, so a balance is a balance —
                  regardless of rail.
                </p>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
                {CURRENCIES.map((c) => (
                  <div
                    key={c.code}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-primary-soft font-mono text-xs font-semibold text-primary">
                      {c.code}
                    </span>
                    <span className="text-sm text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* API docs */}
        <section className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Developers
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                A REST API your engineers will actually enjoy
              </h2>
              <p className="mt-4 text-muted-foreground">
                Predictable resources, idempotency keys on every write, signed webhooks and
                sandbox parity with production.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Bearer-token authentication with scoped API keys",
                  "Webhooks for deposits, payouts and conversions",
                  "Sandbox environment with simulated settlement",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="mt-8 rounded-full px-6">
                <Link to="/developers">Explore documentation</Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-foreground/95 shadow-elevated">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-destructive/80" />
                <span className="size-2.5 rounded-full bg-warning/80" />
                <span className="size-2.5 rounded-full bg-success/80" />
                <span className="ml-2 font-mono text-xs text-background/60">POST /v1/payouts</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-background/90">
                {CODE_SAMPLE}
              </pre>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Pricing that scales with volume
              </h2>
              <p className="mt-4 text-muted-foreground">
                No setup fees. No minimums on Starter. Move to volume pricing whenever you need it.
              </p>
            </div>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
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
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-6 font-display text-4xl font-extrabold text-foreground">
                    {plan.price}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      {plan.note}
                    </span>
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
                    <Link to={plan.name === "Enterprise" ? "/contact" : "/signup"}>{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-5 py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-14 text-center sm:px-16">
            <div className="absolute inset-0 grid-lines opacity-20" aria-hidden />
            <div className="relative">
              <Globe2 className="mx-auto size-8 text-background/70" />
              <h2 className="mt-5 font-display text-3xl font-bold text-background sm:text-4xl">
                Launch your global money stack this week
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-background/70">
                Create an account, complete verification and open your first wallet in minutes.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="rounded-full px-7">
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                  <Link to="/contact">Contact sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto w-full max-w-7xl px-5 pb-20 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "SOC 2 Type II aligned controls" },
              { icon: Building2, label: "Regulated banking partners" },
              { icon: Banknote, label: "Segregated client funds" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4"
              >
                <item.icon className="size-5 text-primary" />
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
