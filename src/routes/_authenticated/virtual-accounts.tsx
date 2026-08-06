import { createFileRoute } from "@tanstack/react-router";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import {
  useCreateVirtualAccount,
  useTransactions,
  useVirtualAccounts,
} from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/virtual-accounts")({
  head: () => ({
    meta: [
      { title: "Virtual Accounts — Nexus Pay" },
      {
        name: "description",
        content: "Named USD and EUR collection accounts with local bank details.",
      },
      { property: "og:title", content: "Virtual Accounts — Nexus Pay" },
      { property: "og:description", content: "Local collection accounts in USD and EUR." },
    ],
  }),
  component: VirtualAccountsPage,
});

function VirtualAccountsPage() {
  const { data: accounts = [], isLoading } = useVirtualAccounts();
  const { data: deposits = [] } = useTransactions("deposit");
  const create = useCreateVirtualAccount();

  async function handleCreate(currency: string) {
    try {
      await create.mutateAsync(currency);
      toast.success(`${currency} virtual account issued`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not issue account");
    }
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  }

  const existing = new Set(accounts.map((a) => a.currency));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Virtual accounts"
        description="Give customers local bank details to pay into. Funds land directly in the matching fiat wallet."
        actions={
          <>
            {["USD", "EUR"]
              .filter((c) => !existing.has(c))
              .map((c) => (
                <Button
                  key={c}
                  onClick={() => handleCreate(c)}
                  disabled={create.isPending}
                  className="rounded-full px-5"
                >
                  <Plus className="mr-1 size-4" /> Issue {c} account
                </Button>
              ))}
          </>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No virtual accounts yet. Issue a USD or EUR account to start collecting locally.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {accounts.map((account) => {
            const rows = [
              ["Account name", account.account_name],
              ["Account number", account.account_number],
              account.routing_number ? ["Routing number", account.routing_number] : null,
              account.iban ? ["IBAN", account.iban] : null,
              ["SWIFT / BIC", account.swift_bic],
              ["Bank", account.bank_name],
              ["Bank address", account.bank_address],
            ].filter(Boolean) as [string, string][];

            return (
              <article key={account.id} className="rounded-2xl glass-tile p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft font-mono text-xs font-semibold text-primary">
                    {account.currency}
                  </span>
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success capitalize">
                    {account.status}
                  </span>
                </div>
                <dl className="mt-6 space-y-3">
                  {rows.map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="flex items-center gap-2 text-right">
                        <span className="font-mono text-sm text-foreground">{value}</span>
                        <button
                          type="button"
                          aria-label={`Copy ${label}`}
                          onClick={() => copy(value)}
                          className="text-muted-foreground transition-colors hover:text-primary"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">
          Incoming transactions
        </h2>
        <TransactionTable
          transactions={deposits}
          emptyLabel="No incoming payments into your virtual accounts yet."
        />
      </section>
    </div>
  );
}
