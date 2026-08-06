import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/page-header";
import { useProfile, useSettings, useUpdateProfile, useUpdateSettings } from "@/hooks/use-account";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Nexus Pay" },
      { name: "description", content: "Manage your profile, notifications and security." },
      { property: "og:title", content: "Settings — Nexus Pay" },
      { property: "og:description", content: "Profile, notification and security settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: settings } = useSettings();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();
  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const nameValue = fullName ?? profile?.full_name ?? "";
  const phoneValue = phone ?? profile?.phone ?? "";

  async function saveProfile() {
    try {
      await updateProfile.mutateAsync({
        full_name: nameValue.trim().slice(0, 120) || null,
        phone: phoneValue.trim().slice(0, 30) || null,
      });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    }
  }

  function toggle(key: "email_notifications" | "transaction_alerts" | "marketing_emails" | "two_factor_enabled") {
    return (checked: boolean) => {
      updateSettings.mutate({ [key]: checked });
    };
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Manage your account, alerts and security." />

      <section className="rounded-2xl border border-border bg-card p-7">
        <h2 className="font-display text-lg font-bold text-foreground">Profile</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={nameValue}
              maxLength={120}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phoneValue}
              maxLength={30}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile?.email ?? ""} readOnly disabled className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Base currency</Label>
            <Select
              value={settings?.base_currency ?? "USD"}
              onValueChange={(v) => updateSettings.mutate({ base_currency: v })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={saveProfile} disabled={updateProfile.isPending} className="mt-6 rounded-full px-7">
          {updateProfile.isPending ? "Saving…" : "Save changes"}
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-7">
        <h2 className="font-display text-lg font-bold text-foreground">Notifications & security</h2>
        <ul className="mt-5 divide-y divide-border">
          {[
            ["email_notifications", "Email notifications", "Account and product updates"],
            ["transaction_alerts", "Transaction alerts", "Every deposit, payout and exchange"],
            ["marketing_emails", "Product news", "Occasional launches and offers"],
            ["two_factor_enabled", "Two-factor authentication", "Require a second factor at sign-in"],
          ].map(([key, title, description]) => (
            <li key={key} className="flex items-center justify-between gap-6 py-4">
              <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={Boolean(settings?.[key as keyof typeof settings])}
                onCheckedChange={toggle(key as "email_notifications")}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-7">
        <h2 className="font-display text-lg font-bold text-foreground">Session</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign out of this device. You'll need to log in again to access your wallets.
        </p>
        <Button variant="outline" onClick={signOut} className="mt-5 rounded-full px-7">
          Sign out
        </Button>
      </section>
    </div>
  );
}
