import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import {
  useCryptoWallets,
  useExchange,
  useFiatWallets,
  useTransactions,
} from "@/hooks/use-account";
import { convert, formatAmount, rateBetween } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/exchange")({
  head: () => ({
    meta: [
      { title: "Currency Exchange — Nexus Pay" },
      { name: "description", content: "Convert between fiat and crypto at transparent rates." },
      { property: "og:title", content: "Currency Exchange — Nexus Pay" },
      { property: "og:description", content: "Convert between fiat and crypto." },
    ],
  }),
  component: ExchangePage,
});

function ExchangePage() {
  const { data: fiat = [] } = useFiatWallets();
  const { data: crypto = [] } = useCryptoWallets();
  const { data: history = [] } = useTransactions("exchange");
  const exchange = useExchange();

  const wallets = useMemo(
    () => [
      ...fiat.map((w) => ({ code: w.currency, balance: Number(w.balance) })),
      ...crypto.map((w) => ({ code: w.asset, balance: Number(w.balance) })),
    ],
    [fiat, crypto],
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");

  const fromCode = from || wallets[0]?.code || "";
  const toCode = to || wallets.find((w) => w.code !== fromCode)?.code || "";
  const value = Number(amount) || 0;
  const rate = fromCode && toCode ? rateBetween(fromCode, toCode) : 0;
  const converted = fromCode && toCode ? convert(value, fromCode, toCode) : 0;
  const balance = wallets.find((w) => w.code === fromCode)?.balance ?? 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!fromCode || !toCode || fromCode === toCode) {
      toast.error("Choose two different wallets");
      return;
    }
    if (value <= 0) {
      toast.error("Enter an amount to convert");
      return;
    }
    if (value > balance) {
      toast.error("Insufficient balance");
      return;
    }
    try {
      await exchange.mutateAsync({ from: fromCode, to: toCode, amount: value });
      setAmount("");
      toast.success("Exchange completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Exchange failed");
    }
  }

  if (wallets.length < 2) {
    return (
      <div className="space-y-8">
        <PageHeader title="Exchange" description="Convert between the currencies you hold." />
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          You need at least two wallets to exchange. Create one from the Wallets page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Exchange"
        description="Convert between fiat and digital assets at a transparent mid-market reference rate."
      />

      <form onSubmit={handleSubmit} className="rounded-2xl glass-tile p-7">
        <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>From</Label>
              <Select value={fromCode} onValueChange={setFrom}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.code} — {w.balance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchange-amount">Amount</Label>
              <Input
                id="exchange-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Available {formatAmount(balance, fromCode)}
              </p>
            </div>
          </div>

          <div className="grid size-11 shrink-0 place-items-center justify-self-center rounded-full border border-border bg-card text-primary">
            <ArrowLeftRight className="size-4" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Select value={toCode} onValueChange={setTo}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wallets
                    .filter((w) => w.code !== fromCode)
                    .map((w) => (
                      <SelectItem key={w.code} value={w.code}>
                        {w.code} — {w.balance}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">You receive</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">
                {formatAmount(converted, toCode)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            1 {fromCode} ={" "}
            <span className="font-medium text-foreground">
              {rate.toLocaleString(undefined, { maximumFractionDigits: 8 })} {toCode}
            </span>{" "}
            · 0% platform fee on your first $10,000
          </p>
          <Button type="submit" disabled={exchange.isPending} className="rounded-full px-7">
            {exchange.isPending ? "Converting…" : "Confirm exchange"}
          </Button>
        </div>
      </form>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-foreground">Exchange history</h2>
        <TransactionTable transactions={history} emptyLabel="No conversions yet." />
      </section>
    </div>
  );
}
