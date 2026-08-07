import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { useTransactions } from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Nexus Pay" },
      { name: "description", content: "Search the full ledger across every wallet and rail." },
      { property: "og:title", content: "Transactions — Nexus Pay" },
      { property: "og:description", content: "Your full transaction ledger." },
    ],
  }),
  component: TransactionsPage,
});

const TYPES = ["all", "deposit", "withdrawal", "exchange", "send", "receive"];

function TransactionsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (!q) return true;
      return [t.reference, t.currency, t.counterparty, t.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [transactions, type, query]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Every movement across fiat, crypto and virtual accounts in one ledger."
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, currency or counterparty"
          className="rounded-xl sm:max-w-sm"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="rounded-xl sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t === "all" ? "All types" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TransactionTable
        transactions={filtered}
        emptyLabel={isLoading ? "Loading transactions…" : "No transactions match your filters."}
      />
    </div>
  );
}
