import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bitcoin,
  Repeat,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import {
  useCryptoWallets,
  useFiatWallets,
  useKyc,
  useProfile,
  useTransactions,
} from "@/hooks/use-account";
import { REFERENCE_RATES, formatAmount, formatFiat, toUsd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nexus Pay" },
      { name: "description", content: "Balances, exchange rates and recent activity." },
      { property: "og:title", content: "Dashboard — Nexus Pay" },
      { property: "og:description", content: "Your balances and recent activity." },
    ],
  }),
  component: DashboardPage,
});

export function CurrencyIcon({ code }: { code: string }) {
  const upper = code.toUpperCase();
  if (upper === "USD") {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-lg border border-blue-500/20 shadow-sm" title="US Dollar">
        🇺🇸
      </span>
    );
  }
  if (upper === "EUR") {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-lg border border-indigo-500/20 shadow-sm" title="Euro">
        🇪🇺
      </span>
    );
  }
  if (upper === "GBP") {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-red-500/10 text-lg border border-red-500/20 shadow-sm" title="British Pound">
        🇬🇧
      </span>
    );
  }
  if (upper === "BTC") {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 font-bold text-sm border border-amber-500/20 shadow-sm" title="Bitcoin">
        ₿
      </span>
    );
  }
  if (upper === "ETH") {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 font-bold text-sm border border-purple-500/20 shadow-sm" title="Ethereum">
        Ξ
      </span>
    );
  }
  if (upper === "USDT") {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold text-xs border border-emerald-500/20 shadow-sm" title="Tether">
        ₮
      </span>
    );
  }
  return (
    <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft font-mono text-xs font-semibold text-primary border border-primary/20 shadow-sm">
      {code}
    </span>
  );
}

const QUICK_ACTIONS = [
  { label: "Deposit", to: "/deposits", icon: ArrowDownToLine },
  { label: "Withdraw", to: "/withdrawals", icon: ArrowUpFromLine },
  { label: "Exchange", to: "/exchange", icon: Repeat },
  { label: "Send", to: "/send", icon: Send },
] as const;

function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: kyc } = useKyc();
  const { data: fiat = [], isLoading: fiatLoading } = useFiatWallets();
  const { data: crypto = [] } = useCryptoWallets();
  const { data: transactions = [], isLoading: txLoading } = useTransactions();

  const fiatUsd = fiat.reduce((sum, w) => sum + toUsd(Number(w.balance), w.currency), 0);
  const cryptoUsd = crypto.reduce((sum, w) => sum + toUsd(Number(w.balance), w.asset), 0);
  const kycStatus = (kyc as { status?: string } | null | undefined)?.status ?? "not_started";

  const isKycApproved = kycStatus === "approved";

  const cards = [
    { label: "Total balance", value: formatFiat(fiatUsd + cryptoUsd), hint: "Across all wallets" },
    { label: "Fiat balance", value: formatFiat(fiatUsd), hint: `${fiat.length} wallets` },
    { label: "Crypto balance", value: formatFiat(cryptoUsd), hint: `${crypto.length} wallets` },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="A live view of balances, rates and money movement across your account."
        actions={
          <Button asChild className="rounded-full px-5">
            <Link to="/wallets">Manage wallets</Link>
          </Button>
        }
      />

      {kycStatus !== "approved" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/25 bg-primary-soft p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">
                {kycStatus === "pending" ? "Verification in review" : "Complete identity verification"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {kycStatus === "pending"
                  ? "We are reviewing your documents. Wallets stay in limited mode until approval."
                  : "KYC unlocks virtual accounts, higher limits and international payouts."}
              </p>
            </div>
          </div>
          {kycStatus !== "pending" && (
            <Button asChild className="rounded-full px-5">
              <Link to="/kyc">Start verification</Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="rounded-2xl glass-tile p-6"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-3 font-display text-3xl font-bold text-foreground">{card.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
          </motion.div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Your wallets</h2>
            <Link to="/wallets" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {fiatLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
          ) : fiat.length + crypto.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
              <Wallet className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No wallets yet — create your first USD or BTC wallet.
              </p>
              <Button asChild size="sm" className="mt-4 rounded-full">
                <Link to="/wallets">Create wallet</Link>
              </Button>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {fiat.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-3">
                    <CurrencyIcon code={w.currency} />
                    <span className="text-sm font-medium text-foreground">{w.label ?? `${w.currency} Wallet`}</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatAmount(Number(w.balance), w.currency)}
                  </span>
                </li>
              ))}
              {crypto.map((w) => (
                <li key={w.id} className="flex items-center justify-between py-3.5">
                  <span className="flex items-center gap-3">
                    <CurrencyIcon code={w.asset} />
                    <span className="text-sm font-medium text-foreground">{w.network ?? w.asset}</span>
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatAmount(Number(w.balance), w.asset)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold text-foreground">Quick actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const isKycApproved = kycStatus === "approved";
                if (!isKycApproved) {
                  return (
                    <button
                      key={action.label}
                      onClick={() => {
                        import("sonner").then(({ toast }) =>
                          toast.error("Identity verification (KYC) is required to access Quick Actions.")
                        );
                      }}
                      className="flex flex-col gap-2 rounded-xl border border-border p-4 text-left opacity-50 cursor-not-allowed transition-all hover:bg-destructive-soft"
                    >
                      <action.icon className="size-4.5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{action.label}</span>
                    </button>
                  );
                }
                return (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex flex-col gap-2 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft"
                  >
                    <action.icon className="size-4.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-bold text-foreground">Reference rates</h2>
            <ul className="mt-4 space-y-2.5">
              {["EUR", "BTC", "ETH", "USDT"].map((code) => (
                <li key={code} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">1 {code}</span>
                  <span className="font-mono text-foreground">
                    {formatFiat(REFERENCE_RATES[code] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Indicative rates. Live pricing arrives with the FX provider integration.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Recent transactions</h2>
          <Link to="/transactions" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <TransactionTable transactions={transactions.slice(0, 6)} loading={txLoading} />
      </section>
    </div>
  );
}
