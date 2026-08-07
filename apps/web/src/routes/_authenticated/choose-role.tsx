import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { User, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/choose-role")({
  component: ChooseRolePage,
});

function ChooseRolePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelectRole(role: "individual" | "merchant") {
    setLoading(role);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError, data: updatedData } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id)
        .select();

      if (updateError) {
        // If it's a schema cache error, we want to know
        console.error("Update error:", updateError);
        throw new Error(updateError.message || "Failed to update role");
      }

      // If the profile row was completely missing (trigger failure on signup, or old account)
      if (!updatedData || updatedData.length === 0) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            role,
            email: user.email,
            full_name: user.user_metadata?.full_name || "User",
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error(insertError.message || "Failed to create profile");
        }
      }

      toast.success(`Role selected: ${role === "individual" ? "Individual" : "Merchant Business"}`);
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile role");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Choose your account type
          </h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Select how you plan to use Nexus Pay. You can complete verification after accessing your dashboard.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Individual Option */}
          <button
            onClick={() => handleSelectRole("individual")}
            disabled={!!loading}
            className="flex flex-col items-center justify-between rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-glow focus:outline-none"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-8" />
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="font-display text-xl font-bold text-foreground">Individual Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Store fiat and crypto assets, execute exchanges, and send payments globally.
              </p>
            </div>
            <Button
              className="mt-6 w-full rounded-xl"
              disabled={!!loading}
            >
              {loading === "individual" ? "Selecting..." : "Choose Individual"}
            </Button>
          </button>

          {/* Merchant Option */}
          <button
            onClick={() => handleSelectRole("merchant")}
            disabled={!!loading}
            className="flex flex-col items-center justify-between rounded-2xl border-2 border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-glow focus:outline-none"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
              <ShieldCheck className="size-8" />
            </div>
            <div className="mt-6 space-y-2">
              <h3 className="font-display text-xl font-bold text-foreground">Business Merchant</h3>
              <p className="text-sm text-muted-foreground">
                Incept virtual bank accounts, generate invoices, activate API key credentials, and deploy checkout integrations.
              </p>
            </div>
            <Button
              variant="default"
              className="mt-6 w-full bg-success hover:bg-success/90 rounded-xl"
              disabled={!!loading}
            >
              {loading === "merchant" ? "Selecting..." : "Choose Merchant"}
            </Button>
          </button>
        </div>
      </div>
    </div>
  );
}
