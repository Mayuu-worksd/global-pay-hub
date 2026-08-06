import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
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
import { useBeneficiaries, useDeleteBeneficiary, useSaveBeneficiary } from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/beneficiaries")({
  head: () => ({
    meta: [
      { title: "Beneficiaries — Nexus Pay" },
      { name: "description", content: "Save bank and crypto recipients for faster payouts." },
      { property: "og:title", content: "Beneficiaries — Nexus Pay" },
      { property: "og:description", content: "Save recipients for faster payouts." },
    ],
  }),
  component: BeneficiariesPage,
});

function BeneficiariesPage() {
  const { data: beneficiaries = [] } = useBeneficiaries();
  const save = useSaveBeneficiary();
  const remove = useDeleteBeneficiary();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("bank");
  const [form, setForm] = useState<Record<string, string>>({});

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    const name = (form["name"] ?? "").trim();
    if (name.length < 2) {
      toast.error("Enter the recipient's name");
      return;
    }
    try {
      await save.mutateAsync({
        name: name.slice(0, 120),
        type,
        currency: form["currency"] ?? null,
        email: form["email"] ?? null,
        bank_name: form["bank_name"] ?? null,
        account_number: form["account_number"] ?? null,
        iban: form["iban"] ?? null,
        swift_bic: form["swift_bic"] ?? null,
        country: form["country"] ?? null,
        crypto_asset: form["crypto_asset"] ?? null,
        crypto_network: form["crypto_network"] ?? null,
        crypto_address: form["crypto_address"] ?? null,
      });
      setForm({});
      setOpen(false);
      toast.success("Beneficiary saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save beneficiary");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Beneficiaries"
        description="A saved directory of the people and businesses you pay."
        actions={
          <Button onClick={() => setOpen((v) => !v)} className="rounded-full px-5">
            <Plus className="mr-1 size-4" /> Add beneficiary
          </Button>
        }
      />

      {open && (
        <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank account</SelectItem>
                  <SelectItem value="crypto">Crypto address</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <TextField id="name" label="Full name / business" value={form["name"]} onChange={set("name")} />
            <TextField id="email" label="Email" value={form["email"]} onChange={set("email")} />
            <TextField id="country" label="Country" value={form["country"]} onChange={set("country")} />
            {type === "bank" ? (
              <>
                <TextField id="currency" label="Currency" value={form["currency"]} onChange={set("currency")} />
                <TextField id="bank_name" label="Bank name" value={form["bank_name"]} onChange={set("bank_name")} />
                <TextField id="account_number" label="Account number" value={form["account_number"]} onChange={set("account_number")} />
                <TextField id="iban" label="IBAN" value={form["iban"]} onChange={set("iban")} />
                <TextField id="swift_bic" label="SWIFT / BIC" value={form["swift_bic"]} onChange={set("swift_bic")} />
              </>
            ) : (
              <>
                <TextField id="crypto_asset" label="Asset (BTC, ETH, USDT)" value={form["crypto_asset"]} onChange={set("crypto_asset")} />
                <TextField id="crypto_network" label="Network" value={form["crypto_network"]} onChange={set("crypto_network")} />
                <div className="sm:col-span-2">
                  <TextField id="crypto_address" label="Wallet address" value={form["crypto_address"]} onChange={set("crypto_address")} />
                </div>
              </>
            )}
          </div>
          <Button type="submit" disabled={save.isPending} className="mt-6 rounded-full px-7">
            {save.isPending ? "Saving…" : "Save beneficiary"}
          </Button>
        </form>
      )}

      {beneficiaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No beneficiaries saved yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beneficiaries.map((b) => (
            <article key={b.id} className="rounded-2xl glass-tile p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold text-foreground">{b.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {b.type} {b.currency ? `· ${b.currency}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${b.name}`}
                  onClick={() => remove.mutate(b.id)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <p className="mt-4 truncate font-mono text-xs text-muted-foreground">
                {b.crypto_address ?? b.iban ?? b.account_number ?? b.email ?? "—"}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value ?? ""} onChange={onChange} className="rounded-xl" maxLength={120} />
    </div>
  );
}
