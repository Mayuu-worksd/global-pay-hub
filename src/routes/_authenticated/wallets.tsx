import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { useCreateWallet, useCryptoWallets, useFiatWallets } from "@/hooks/use-account";
import { formatAmount, formatFiat, toUsd } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/wallets")({
  head: () => ({
    meta: [
      { title: "Wallets — Nexus Pay" },
      { name: "description", content: "Create and manage USD, EUR, BTC, ETH and USDT wallets." },
      { property: "og:title", content: "Wallets — Nexus Pay" },
      { property: "og:description", content: "Manage fiat and crypto wallets." },
    ],
  }),
  component: WalletsPage,
});

const FIAT_OPTIONS = ["USD", "EUR"];
const CRYPTO_OPTIONS = ["BTC", "ETH", "USDT"];

function WalletsPage() {
  const { data: fiat = [], isLoading } = useFiatWallets();
  const { data: crypto = [] } = useCryptoWallets();
  const create = useCreateWallet();

  async function handleCreate(kind: "fiat" | "crypto", code: string) {
    try {
      await create.mutateAsync({ kind, code });
      toast.success(`${code} wallet created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create wallet");
    }
  }

  const existingFiat = new Set(fiat.map((w) => w.currency));
  const existingCrypto = new Set(crypto.map((w) => w.asset));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Wallets"
        description="Hold balances in fiat and digital assets. Every wallet shares the same ledger and transaction history."
      />

      <section>
        <h2 className="font-display text-lg font-bold text-foreground">Fiat wallets</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fiat.map((w) => (
            <article key={w.id} className="rounded-2xl glass-tile p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft font-mono text-xs font-semibold text-primary">
                  {w.currency}
                </span>
                <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  Active
                </span>
              </div>
              <p className="mt-5 font-display text-2xl font-bold text-foreground">
                {formatAmount(Number(w.balance), w.currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                ≈ {formatFiat(toUsd(Number(w.balance), w.currency))}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <WalletAction to="/deposits" label="Deposit" />
                <WalletAction to="/withdrawals" label="Withdraw" />
                <WalletAction to="/send" label="Send" />
                <WalletAction to="/transactions" label="History" />
              </div>
            </article>
          ))}
          {FIAT_OPTIONS.filter((c) => !existingFiat.has(c)).map((code) => (
            <CreateCard
              key={code}
              code={code}
              disabled={create.isPending}
              onClick={() => handleCreate("fiat", code)}
            />
          ))}
        </div>
        {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading wallets…</p>}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-foreground">Crypto wallets</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crypto.map((w) => (
            <article key={w.id} className="rounded-2xl glass-tile p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-accent font-mono text-xs font-semibold text-accent-foreground">
                  {w.asset}
                </span>
                <span className="text-xs text-muted-foreground">{w.network}</span>
              </div>
              <p className="mt-5 font-display text-2xl font-bold text-foreground">
                {formatAmount(Number(w.balance), w.asset)}
              </p>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {w.deposit_address}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <WalletAction to="/receive" label="Receive" />
                <WalletAction to="/withdrawals" label="Withdraw" />
                <WalletAction to="/exchange" label="Exchange" />
                <WalletAction to="/transactions" label="History" />
              </div>
            </article>
          ))}
          {CRYPTO_OPTIONS.filter((c) => !existingCrypto.has(c)).map((code) => (
            <CreateCard
              key={code}
              code={code}
              disabled={create.isPending}
              onClick={() => handleCreate("crypto", code)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function WalletAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      {label}
    </Link>
  );
}

function CreateCard({
  code,
  onClick,
  disabled,
}: {
  code: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-primary-soft/50 disabled:opacity-60"
    >
      <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
        <Plus className="size-4.5" />
      </span>
      <span className="text-sm font-medium text-foreground">Create {code} wallet</span>
    </button>
  );
}
