import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sales — Nexus Pay" },
      {
        name: "description",
        content:
          "Talk to the Nexus Pay team about wallets, virtual accounts, FX pricing and enterprise onboarding.",
      },
      { property: "og:title", content: "Contact Nexus Pay" },
      {
        property: "og:description",
        content: "Reach the Nexus Pay team about pricing, onboarding and integrations.",
      },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "Tell us a little more").max(1000),
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Thanks — our team will reply within one business day.");
      event.currentTarget?.reset?.();
    }, 600);
  }

  return (
    <MarketingPage
      eyebrow="Contact"
      title="Talk to the team"
      intro="Tell us about your flows — corridors, volumes and currencies — and we will map them to the right configuration."
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" maxLength={100} placeholder="Ada Lovelace" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" name="email" type="email" maxLength={255} placeholder="ada@company.com" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" maxLength={120} placeholder="Company Ltd" />
          </div>
          <div className="mt-5 space-y-2">
            <Label htmlFor="message">How can we help?</Label>
            <Textarea id="message" name="message" rows={6} maxLength={1000} placeholder="We collect in EUR and pay out in USDT…" />
          </div>
          <Button type="submit" disabled={submitting} className="mt-6 rounded-full px-7">
            {submitting ? "Sending…" : "Send message"}
          </Button>
        </form>

        <aside className="space-y-4">
          {[
            { icon: Mail, label: "sales@nexuspay.io", note: "Sales & partnerships" },
            { icon: Phone, label: "+1 (415) 555-0148", note: "Mon–Fri, 9am–6pm ET" },
            { icon: MapPin, label: "8 Bridge Street, New York", note: "Headquarters" },
          ].map((item) => (
            <div key={item.label} className="flex gap-4 rounded-2xl glass-tile p-6">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <item.icon className="size-4.5" />
              </span>
              <div>
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </MarketingPage>
  );
}
