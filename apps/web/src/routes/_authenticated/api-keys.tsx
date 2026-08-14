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
        {!approved && (
          <div className="mt-5 p-4 border-2 border-[#1677FF] bg-[#1677FF]/5 max-w-xl">
            <p className="text-xs font-bold text-gray-700 leading-relaxed">
              💡 Testing your integration? You can access the separate GlobalPay Sandbox Console to generate sandbox test keys (gph_test_...) and test APIs immediately.
            </p>
            <a 
              href="/sandbox"
              className="inline-block mt-3 bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-[10px] px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Go to Sandbox Console
            </a>
          </div>
        )}
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
