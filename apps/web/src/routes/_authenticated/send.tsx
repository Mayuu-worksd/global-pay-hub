import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { MoneyMovementForm } from "@/components/dashboard/money-movement-form";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { useTransactions } from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/send")({
  head: () => ({
    meta: [
      { title: "Send Money — Nexus Pay" },
      { name: "description", content: "Send fiat and crypto to beneficiaries worldwide." },
      { property: "og:title", content: "Send Money — Nexus Pay" },
      { property: "og:description", content: "Send money to beneficiaries worldwide." },
    ],
  }),
  component: SendPage,
});

function SendPage() {
  const { data: sends = [] } = useTransactions("send");
  return (
    <div className="space-y-8">
      <PageHeader
        title="Send money"
        description="Pay a saved beneficiary or a one-off recipient from any wallet."
      />
      <MoneyMovementForm type="send" submitLabel="Send payment" counterpartyLabel="Recipient" />
      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Payments sent</h2>
        <TransactionTable transactions={sends} emptyLabel="You haven't sent any payments yet." />
      </section>
    </div>
  );
}
