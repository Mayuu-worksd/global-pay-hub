import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { MoneyMovementForm } from "@/components/dashboard/money-movement-form";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { useTransactions } from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/deposits")({
  head: () => ({
    meta: [
      { title: "Deposits — Nexus Pay" },
      { name: "description", content: "Fund your wallets by bank transfer or crypto deposit." },
      { property: "og:title", content: "Deposits — Nexus Pay" },
      { property: "og:description", content: "Fund wallets by bank transfer or crypto." },
    ],
  }),
  component: DepositsPage,
});

function DepositsPage() {
  const { data: deposits = [] } = useTransactions("deposit");
  return (
    <div className="space-y-8">
      <PageHeader
        title="Deposits"
        description="Record an incoming transfer into any of your wallets. Bank rails settle in 1–2 business days."
      />
      <MoneyMovementForm type="deposit" submitLabel="Record deposit" counterpartyLabel="Sender / reference" />
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Deposit history</h2>
        <TransactionTable transactions={deposits} emptyLabel="No deposits yet." />
      </section>
    </div>
  );
}
