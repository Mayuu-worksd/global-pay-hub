import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { MoneyMovementForm } from "@/components/dashboard/money-movement-form";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { useTransactions } from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/withdrawals")({
  head: () => ({
    meta: [
      { title: "Withdrawals — Nexus Pay" },
      { name: "description", content: "Pay out to bank accounts or external crypto addresses." },
      { property: "og:title", content: "Withdrawals — Nexus Pay" },
      { property: "og:description", content: "Pay out to banks or crypto addresses." },
    ],
  }),
  component: WithdrawalsPage,
});

function WithdrawalsPage() {
  const { data: withdrawals = [] } = useTransactions("withdrawal");
  return (
    <div className="space-y-8">
      <PageHeader
        title="Withdrawals"
        description="Move funds out to a linked bank account or external wallet address."
      />
      <MoneyMovementForm
        type="withdrawal"
        submitLabel="Request withdrawal"
        counterpartyLabel="Destination account or address"
      />
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Withdrawal history</h2>
        <TransactionTable transactions={withdrawals} emptyLabel="No withdrawals yet." />
      </section>
    </div>
  );
}
