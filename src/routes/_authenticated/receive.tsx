import { createFileRoute } from "@tanstack/react-router";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { MoneyMovementForm } from "@/components/dashboard/money-movement-form";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { useCryptoWallets, useTransactions, useVirtualAccounts } from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/receive")({
  head: () => ({
    meta: [
      { title: "Receive Money — Nexus Pay" },
      { name: "description", content: "Share bank details and crypto addresses to get paid." },
      { property: "og:title", content: "Receive Money — Nexus Pay" },
      { property: "og:description", content: "Share payment details to get paid." },
    ],
  }),
  component: ReceivePage,
});

function ReceivePage() {
  const { data: accounts = [] } = useVirtualAccounts();
  const { data: crypto = [] } = useCryptoWallets();
  const { data: received = [] } = useTransactions("receive");

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Receive money"
        description="Share your payment details, or record a payment you've already received."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl glass-tile p-7">
          <h2 className="font-display text-base font-bold text-foreground">Bank details</h2>
          {accounts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Issue a virtual account to receive local bank transfers.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {accounts.map((a) => (
                <li key={a.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {a.currency} · {a.bank_name ?? "Partner bank"}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(a.account_number)}
                    className="mt-2 flex items-center gap-2 font-mono text-sm text-foreground hover:text-primary"
                  >
                    {a.account_number}
                    <Copy className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl glass-tile p-7">
          <h2 className="font-display text-base font-bold text-foreground">Crypto addresses</h2>
          {crypto.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Create a crypto wallet to generate a deposit address.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {crypto.map((w) => (
                <li key={w.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {w.asset} · {w.network ?? "mainnet"}
                  </p>
                  <button
                    type="button"
                    onClick={() => copy(w.deposit_address ?? "")}
                    className="mt-2 flex w-full items-center gap-2 truncate font-mono text-sm text-foreground hover:text-primary"
                  >
                    <span className="truncate">{w.deposit_address}</span>
                    <Copy className="size-3.5 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <MoneyMovementForm type="receive" submitLabel="Record payment" counterpartyLabel="Payer" />

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Payments received</h2>
        <TransactionTable transactions={received} emptyLabel="No incoming payments yet." />
      </section>
    </div>
  );
}
