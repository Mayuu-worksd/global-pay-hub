import { formatAmount, formatDate } from "@/lib/format";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warning/15 text-warning-foreground",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function TransactionTable({
  transactions,
  loading,
  emptyLabel = "No transactions yet.",
}: {
  transactions: Transaction[];
  loading?: boolean;
  emptyLabel?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading transactions…
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-secondary/60 text-left">
          <tr>
            {["Reference", "Type", "Amount", "Details", "Status", "Date"].map((h) => (
              <th key={h} className="px-5 py-3.5 font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-t border-border bg-card">
              <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{tx.reference}</td>
              <td className="px-5 py-3.5 capitalize text-foreground">{tx.type}</td>
              <td className="px-5 py-3.5 font-medium text-foreground">
                {formatAmount(Number(tx.amount), tx.currency)}
                {tx.to_currency && (
                  <span className="ml-1 text-muted-foreground">
                    → {formatAmount(Number(tx.to_amount ?? 0), tx.to_currency)}
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-muted-foreground">
                {tx.counterparty ?? tx.description ?? "—"}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    STATUS_STYLES[tx.status] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {tx.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-muted-foreground">{formatDate(tx.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
