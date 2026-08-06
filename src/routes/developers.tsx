import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage } from "@/components/marketing/marketing-page";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "API Documentation for Wallets & Payouts | Nexus Pay Developers" },
      {
        name: "description",
        content:
          "REST endpoints, authentication, webhooks and sandbox details for the Nexus Pay hybrid payments API.",
      },
      { property: "og:title", content: "Nexus Pay Developer Documentation" },
      {
        property: "og:description",
        content: "REST API reference for wallets, virtual accounts, conversions and payouts.",
      },
    ],
  }),
  component: DevelopersPage,
});

const ENDPOINTS = [
  { method: "POST", path: "/v1/wallets", desc: "Create a fiat or crypto wallet for a user." },
  { method: "GET", path: "/v1/wallets/:id", desc: "Fetch balance and metadata for a wallet." },
  {
    method: "POST",
    path: "/v1/virtual-accounts",
    desc: "Issue a named collection account in USD or EUR.",
  },
  { method: "POST", path: "/v1/conversions", desc: "Lock a rate and convert between currencies." },
  { method: "POST", path: "/v1/payouts", desc: "Send funds to a saved beneficiary." },
  { method: "GET", path: "/v1/transactions", desc: "Paginated ledger across every product." },
];

const WEBHOOKS = [
  "deposit.completed",
  "payout.settled",
  "payout.failed",
  "conversion.executed",
  "kyc.status_changed",
];

function DevelopersPage() {
  return (
    <MarketingPage
      eyebrow="Developers"
      title="Documentation"
      intro="Everything is a resource, every write is idempotent, and sandbox behaves exactly like production with simulated settlement."
    >
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">Core endpoints</h2>
          <div className="mt-5 overflow-hidden rounded-2xl border border-border">
            {ENDPOINTS.map((e) => (
              <div
                key={e.path}
                className="flex flex-col gap-1 border-b border-border bg-card px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="w-14 shrink-0 font-mono text-xs font-semibold text-primary">
                  {e.method}
                </span>
                <span className="w-64 shrink-0 font-mono text-sm text-foreground">{e.path}</span>
                <span className="text-sm text-muted-foreground">{e.desc}</span>
              </div>
            ))}
          </div>

          <h2 className="mt-12 font-display text-xl font-bold text-foreground">Authentication</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-foreground/95">
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-background/90">
              {`curl https://api.nexuspay.io/v1/wallets \\
  -H "Authorization: Bearer $NEXUS_API_KEY" \\
  -H "Idempotency-Key: 8f2c-41ab" \\
  -d currency=USD -d type=fiat`}
            </pre>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Keys are scoped per environment and can be rotated at any time from the dashboard.
          </p>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl glass-tile p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
              Webhook events
            </h3>
            <ul className="mt-4 space-y-2">
              {WEBHOOKS.map((w) => (
                <li key={w} className="font-mono text-sm text-muted-foreground">
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-primary">
              Environments
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Sandbox</dt>
                <dd className="font-mono text-foreground">api.sandbox.nexuspay.io</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Production</dt>
                <dd className="font-mono text-foreground">api.nexuspay.io</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </MarketingPage>
  );
}
