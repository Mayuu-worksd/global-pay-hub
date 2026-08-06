import { useState } from "react";
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
import { useCryptoWallets, useFiatWallets, useRecordMovement } from "@/hooks/use-account";
import type { MovementInput } from "@/hooks/use-account";

export function MoneyMovementForm({
  type,
  submitLabel,
  counterpartyLabel,
}: {
  type: MovementInput["type"];
  submitLabel: string;
  counterpartyLabel: string;
}) {
  const { data: fiat = [] } = useFiatWallets();
  const { data: crypto = [] } = useCryptoWallets();
  const movement = useRecordMovement();

  const options = [
    ...fiat.map((w) => ({ code: w.currency, balance: Number(w.balance) })),
    ...crypto.map((w) => ({ code: w.asset, balance: Number(w.balance) })),
  ];
  const [currency, setCurrency] = useState(options[0]?.code ?? "");
  const [amount, setAmount] = useState("");
  const [counterparty, setCounterparty] = useState("");

  const selected = options.find((o) => o.code === currency);
  const outgoing = type === "withdrawal" || type === "send";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!currency) {
      toast.error("Create a wallet first");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (outgoing && selected && value > selected.balance) {
      toast.error("Insufficient balance in this wallet");
      return;
    }
    try {
      await movement.mutateAsync({
        type,
        amount: value,
        currency,
        counterparty: counterparty.trim().slice(0, 120) || undefined,
      });
      setAmount("");
      setCounterparty("");
      toast.success(`${submitLabel} recorded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  if (!options.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Create a wallet before you can {submitLabel.toLowerCase()}.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Wallet</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select wallet" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.code} value={o.code}>
                  {o.code} — {o.balance}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Label htmlFor="counterparty">{counterpartyLabel}</Label>
        <Input
          id="counterparty"
          value={counterparty}
          maxLength={120}
          onChange={(e) => setCounterparty(e.target.value)}
          className="rounded-xl"
        />
      </div>
      <Button type="submit" disabled={movement.isPending} className="mt-6 rounded-full px-7">
        {movement.isPending ? "Processing…" : submitLabel}
      </Button>
    </form>
  );
}
