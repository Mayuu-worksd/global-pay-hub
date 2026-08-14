import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { MarketingPage } from "@/components/marketing/marketing-page";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Sales — GlobalPay" },
      {
        name: "description",
        content:
          "Talk to the GlobalPay team about wallets, virtual accounts, FX pricing and enterprise onboarding.",
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
      <div className="grid gap-10 lg:grid-cols-[1fr_380px] items-start">
        
        {/* Contact Form */}
        <form 
          onSubmit={handleSubmit} 
          className="border-4 border-black bg-white p-7 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider">Full name</label>
              <input 
                id="name" 
                name="name" 
                required
                maxLength={100} 
                placeholder="Ada Lovelace" 
                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF]"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider">Work email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required
                maxLength={255} 
                placeholder="ada@company.com" 
                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF]"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider">Company</label>
            <input 
              id="company" 
              name="company" 
              maxLength={120} 
              placeholder="Company Ltd" 
              className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF]"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider">How can we help?</label>
            <textarea 
              id="message" 
              name="message" 
              required
              rows={6} 
              maxLength={1000} 
              placeholder="We collect in EUR and pay out in USDT…" 
              className="w-full bg-white border-2 border-black p-3 text-sm font-mono outline-none focus:border-[#1677FF] leading-relaxed"
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting} 
            className="bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-xs border-2 border-black py-3 px-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>

        {/* Side Info Cards */}
        <aside className="space-y-4 select-none">
          {[
            { icon: Mail, label: "sales@globalpay.io", note: "Sales & partnerships" },
            { icon: Phone, label: "+1 (415) 555-0148", note: "Mon–Fri, 9am–6pm ET" },
            { icon: MapPin, label: "8 Bridge Street, New York", note: "Headquarters" },
          ].map((item) => (
            <div 
              key={item.label} 
              className="flex gap-4 border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="grid size-10 shrink-0 place-items-center bg-[#1677FF] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <item.icon className="size-4.5" />
              </span>
              <div>
                <p className="font-bold text-sm text-black">{item.label}</p>
                <p className="mt-1 text-xs text-gray-500 font-semibold">{item.note}</p>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </MarketingPage>
  );
}
