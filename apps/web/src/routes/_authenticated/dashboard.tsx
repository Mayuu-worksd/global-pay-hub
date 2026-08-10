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
  useExchangeRates,
} from "@/hooks/use-account";
import { REFERENCE_RATES, formatAmount, formatFiat, toUsd, rateBetween } from "@/lib/format";

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
      <svg viewBox="0 0 36 36" className="size-9 rounded-lg border border-blue-500/20 shadow-sm" title="US Dollar">
        <rect width="36" height="36" fill="#bf0a30"/>
        <rect width="36" height="2.7" y="2.7" fill="#fff"/>
        <rect width="36" height="2.7" y="8.1" fill="#fff"/>
        <rect width="36" height="2.7" y="13.5" fill="#fff"/>
        <rect width="36" height="2.7" y="18.9" fill="#fff"/>
        <rect width="36" height="2.7" y="24.3" fill="#fff"/>
        <rect width="36" height="2.7" y="29.7" fill="#fff"/>
        <rect width="18" height="19.3" fill="#002868"/>
        <g fill="#fff">
          <circle cx="3" cy="3" r="0.6"/>
          <circle cx="9" cy="3" r="0.6"/>
          <circle cx="15" cy="3" r="0.6"/>
          <circle cx="6" cy="6.5" r="0.6"/>
          <circle cx="12" cy="6.5" r="0.6"/>
          <circle cx="3" cy="10" r="0.6"/>
          <circle cx="9" cy="10" r="0.6"/>
          <circle cx="15" cy="10" r="0.6"/>
          <circle cx="6" cy="13.5" r="0.6"/>
          <circle cx="12" cy="13.5" r="0.6"/>
          <circle cx="3" cy="17" r="0.6"/>
          <circle cx="9" cy="17" r="0.6"/>
          <circle cx="15" cy="17" r="0.6"/>
        </g>
      </svg>
    );
  }
  if (upper === "EUR") {
    return (
      <svg viewBox="0 0 36 36" className="size-9 rounded-lg border border-indigo-500/20 shadow-sm" title="Euro">
        <rect width="36" height="36" fill="#003399"/>
        <g fill="#ffcc00">
          <circle cx="18" cy="7" r="1.1"/>
          <circle cx="18" cy="29" r="1.1"/>
          <circle cx="7" cy="18" r="1.1"/>
          <circle cx="29" cy="18" r="1.1"/>
          <circle cx="12.5" cy="9" r="1.1"/>
          <circle cx="23.5" cy="9" r="1.1"/>
          <circle cx="12.5" cy="27" r="1.1"/>
          <circle cx="23.5" cy="27" r="1.1"/>
          <circle cx="8" cy="13" r="1.1"/>
          <circle cx="28" cy="13" r="1.1"/>
          <circle cx="8" cy="23" r="1.1"/>
          <circle cx="28" cy="23" r="1.1"/>
        </g>
      </svg>
    );
  }
  if (upper === "GBP") {
    return (
      <svg viewBox="0 0 36 36" className="size-9 rounded-lg border border-red-500/20 shadow-sm" title="British Pound">
        <rect width="36" height="36" fill="#012169"/>
        <path d="M-5,-5 L41,41 M41,-5 L-5,41" stroke="#fff" strokeWidth="4.5"/>
        <path d="M-5,-5 L41,41 M41,-5 L-5,41" stroke="#C8102E" strokeWidth="2.2"/>
        <path d="M18,-5 L18,41 M-5,18 L41,18" stroke="#fff" strokeWidth="7.5"/>
        <path d="M18,-5 L18,41 M-5,18 L41,18" stroke="#C8102E" strokeWidth="4.5"/>
      </svg>
    );
  }
  if (upper === "BTC") {
    return (
      <svg viewBox="0 0 32 32" className="size-9 rounded-lg border border-amber-500/20 shadow-sm" title="Bitcoin">
        <circle cx="16" cy="16" r="16" fill="#F7931A"/>
        <path d="M19 13.7c.3-1.8-.7-2.8-2.6-3.4l.5-2.1h-1.3l-.5 2c-.3 0-.7.1-1 .2l.5-2h-1.3l-.5 2.1c-.3 0-.7 0-1-.1L11.3 9l-.8 3.2s1 .2 1 .2c.5.1.8.4.7.9l-.7 2.9c.1 0 .2.1.2.1l-.2-.1-.8 3.3c0 .3-.3.6-.8.5 0 0-1-.2-1-.2l-1.3 2.9 2 .5c.4.1.8.2 1.1.2l-.5 2.1h1.3l.5-2c.4.1.7.1 1.1.1l-.5 2h1.3l.5-2c2.2.4 3.9.2 4.6-1.7.6-1.5.1-2.4-.9-2.9 1-.3 1.7-1.1 1.5-2.6zm-2.7 5.7c-.4 1.6-3.2.8-4.1.6l.7-2.9c.9.2 3.8.6 3.4 2.3zm.4-5.8c-.4 1.5-2.7.7-3.5.5l.7-2.7c.8.2 3.2.5 2.8 2.2z" fill="#FFF"/>
      </svg>
    );
  }
  if (upper === "ETH") {
    return (
      <svg viewBox="0 0 32 32" className="size-9 rounded-lg border border-purple-500/20 shadow-sm" title="Ethereum">
        <circle cx="16" cy="16" r="16" fill="#627EEA"/>
        <path d="M16 4.5l6.5 10.7-6.5 3-6.5-3z" fill="#FFF" fillOpacity="0.8"/>
        <path d="M16 4.5v10.7l6.5-3z" fill="#FFF" fillOpacity="0.5"/>
        <path d="M16 19.3l6.5-3.8-6.5 9-6.5-9z" fill="#FFF" fillOpacity="0.8"/>
        <path d="M16 19.3V24.5l6.5-9z" fill="#FFF" fillOpacity="0.5"/>
        <path d="M16 15.2l6.5-3-6.5-3-6.5 3z" fill="#FFF" fillOpacity="0.6"/>
      </svg>
    );
  }
  if (upper === "USDT") {
    return (
      <svg viewBox="0 0 32 32" className="size-9 rounded-lg border border-emerald-500/20 shadow-sm" title="Tether">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M17.9 13.9v-2.8h4.5v-2.3H9.6v2.3h4.5v2.8c-3.1.2-5.4.8-5.4 1.6s2.3 1.4 5.4 1.6v6.2h3.8v-6.2c3.1-.2 5.4-.8 5.4-1.6s-2.3-1.4-5.4-1.6zm0 1.2c-.1 0-1 .1-1.9.1s-1.8 0-1.9-.1c-2.4-.1-4.2-.5-4.2-1s1.8-.9 4.2-1c.1 0 1-.1 1.9-.1s1.8 0 1.9.1c2.4.1 4.2.5 4.2 1s-1.8.9-4.2 1z" fill="#FFF"/>
      </svg>
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

  const { data: liveRates } = useExchangeRates();
  const rates = liveRates ?? REFERENCE_RATES;

  const fiatUsd = fiat.reduce((sum, w) => sum + toUsd(Number(w.balance), w.currency, rates), 0);
  const cryptoUsd = crypto.reduce((sum, w) => sum + toUsd(Number(w.balance), w.asset, rates), 0);
  const kycStatus = (kyc as { status?: string } | null | undefined)?.status ?? "not_started";

  const isKycApproved = kycStatus === "approved";

  const cards = [
    { label: "Total balance", value: formatFiat(fiatUsd + cryptoUsd), hint: "Combined portfolio value" },
    { label: "Fiat balance", value: formatFiat(fiatUsd), hint: `${fiat.length} wallet${fiat.length === 1 ? "" : "s"}` },
    { label: "Crypto balance", value: formatFiat(cryptoUsd), hint: `${crypto.length} wallet${crypto.length === 1 ? "" : "s"}` },
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
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Reference rates</h2>
              {liveRates ? (
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">LIVE</span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">LOADING…</span>
              )}
            </div>
            <ul className="mt-4 divide-y divide-border">
              {(["EUR", "GBP", "BTC", "ETH", "USDT"] as const).map((code) => (
                <li key={code} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-2">
                    <CurrencyIcon code={code} />
                    <span className="text-sm font-medium text-foreground">{code} / USD</span>
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatFiat(rateBetween(code, "USD", rates))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-muted-foreground">Powered by CoinGecko &amp; Frankfurter · updates every 60s</p>
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
