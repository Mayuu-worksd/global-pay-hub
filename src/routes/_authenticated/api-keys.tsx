import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useKyc } from "@/hooks/use-account";

export const Route = createFileRoute("/_authenticated/api-keys")({
  head: () => ({
    meta: [
      { title: "API Keys — Nexus Pay" },
      { name: "description", content: "Programmatic access to wallets, payouts and FX." },
      { property: "og:title", content: "API Keys — Nexus Pay" },
      { property: "og:description", content: "Programmatic access to the Nexus Pay platform." },
    ],
  }),
  component: ApiKeysPage,
});

const SCOPES = [
  { name: "wallets:read", description: "List wallets and balances" },
  { name: "wallets:write", description: "Create wallets and virtual accounts" },
  { name: "payments:write", description: "Initiate payouts and transfers" },
  { name: "fx:quote", description: "Fetch live FX quotes and lock rates" },
  { name: "webhooks:manage", description: "Register and rotate webhook endpoints" },
];

function ApiKeysPage() {
  const { data: kyc } = useKyc();
  const approved = (kyc as { status?: string } | null | undefined)?.status === "approved";

  return (
    <div className="space-y-8">
      <PageHeader
        title="API keys"
        description="Issue scoped credentials for server-to-server access to the Nexus Pay platform."
      />

      <div className="rounded-2xl glass-tile p-8">
        <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
          <KeyRound className="size-5" />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold text-foreground">
          {approved ? "Ready to issue keys" : "Verification required"}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {approved
            ? "Live keys are issued once your production banking partner is connected. Keys are shown once at creation and stored only as a hash."
            : "Complete identity verification before requesting API credentials. Regulated rails require an approved profile on file."}
        </p>
      </div>

      <section>
        <h2 className="font-display text-lg font-bold text-foreground">Available scopes</h2>
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {SCOPES.map((scope) => (
            <li key={scope.name} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-mono text-sm text-foreground">{scope.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{scope.description}</p>
              </div>
              <ShieldCheck className="size-4 shrink-0 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Secrets are never stored in the frontend. Provider credentials for banking and FX partners
        live in server-side environment variables and are read only inside server functions.
      </div>
    </div>
  );
}
