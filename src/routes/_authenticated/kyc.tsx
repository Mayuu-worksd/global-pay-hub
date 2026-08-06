import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/dashboard/page-header";
import { useKyc, useSubmitKyc } from "@/hooks/use-account";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({
    meta: [
      { title: "Identity Verification — Nexus Pay" },
      { name: "description", content: "Complete KYC onboarding to unlock wallets and payouts." },
      { property: "og:title", content: "Identity Verification — Nexus Pay" },
      { property: "og:description", content: "Complete KYC to unlock the full platform." },
    ],
  }),
  component: KycPage,
});

const STEPS = ["Personal", "Address", "Identity", "Occupation", "Business"] as const;

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(60),
  last_name: z.string().trim().min(1, "Last name is required").max(60),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().trim().min(2, "Nationality is required").max(60),
  phone: z.string().trim().min(6, "Phone number is required").max(30),
  address_line1: z.string().trim().min(3, "Address is required").max(120),
  address_line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1, "City is required").max(60),
  state: z.string().trim().max(60).optional(),
  postal_code: z.string().trim().min(2, "Postal code is required").max(20),
  country: z.string().trim().min(2, "Country is required").max(60),
  id_document_type: z.string().trim().min(2, "Document type is required").max(40),
  id_document_number: z.string().trim().min(3, "Document number is required").max(60),
  id_document_url: z.string().trim().max(400).optional(),
  occupation: z.string().trim().min(2, "Occupation is required").max(80),
  employment_status: z.string().trim().max(60).optional(),
  source_of_funds: z.string().trim().max(120).optional(),
  business_name: z.string().trim().max(120).optional(),
  business_registration_number: z.string().trim().max(60).optional(),
  business_country: z.string().trim().max(60).optional(),
  business_website: z.string().trim().max(200).optional(),
});

type Values = Record<string, string>;

function KycPage() {
  const navigate = useNavigate();
  const { data: kyc } = useKyc();
  const submit = useSubmitKyc();
  const [step, setStep] = useState(0);
  const [isBusiness, setIsBusiness] = useState(false);
  const [values, setValues] = useState<Values>({});

  const status = (kyc as { status?: string } | null | undefined)?.status;

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit() {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please complete all required fields");
      return;
    }
    try {
      await submit.mutateAsync({ ...parsed.data, is_business: isBusiness });
      toast.success("Verification submitted for review");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit verification");
    }
  }

  if (status === "pending" || status === "approved") {
    return (
      <div className="space-y-8">
        <PageHeader title="Identity verification" description="Your submission status." />
        <div className="rounded-2xl glass-tile p-10 text-center">
          <Check className="mx-auto size-8 text-success" />
          <p className="mt-4 font-display text-xl font-bold text-foreground">
            {status === "approved" ? "Verification approved" : "Under review"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {status === "approved"
              ? "All platform features are unlocked, including virtual accounts and payouts."
              : "Reviews usually complete within one business day. We'll email you the outcome."}
          </p>
          <Button className="mt-6 rounded-full px-6" onClick={() => navigate({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Identity verification"
        description="Regulation requires us to verify who is moving money. It takes about three minutes."
      />

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
              i === step
                ? "border-primary bg-primary-soft text-primary"
                : i < step
                  ? "border-border bg-card text-muted-foreground"
                  : "border-border bg-card text-muted-foreground",
            )}
          >
            <span className="font-mono text-xs">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-border bg-card p-7">
        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="first_name" label="First name" onChange={set("first_name")} value={values["first_name"]} />
            <Field id="last_name" label="Last name" onChange={set("last_name")} value={values["last_name"]} />
            <Field id="date_of_birth" label="Date of birth" type="date" onChange={set("date_of_birth")} value={values["date_of_birth"]} />
            <Field id="nationality" label="Nationality" onChange={set("nationality")} value={values["nationality"]} />
            <Field id="phone" label="Phone number" onChange={set("phone")} value={values["phone"]} />
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="address_line1" label="Address line 1" onChange={set("address_line1")} value={values["address_line1"]} />
            <Field id="address_line2" label="Address line 2 (optional)" onChange={set("address_line2")} value={values["address_line2"]} />
            <Field id="city" label="City" onChange={set("city")} value={values["city"]} />
            <Field id="state" label="State / region" onChange={set("state")} value={values["state"]} />
            <Field id="postal_code" label="Postal code" onChange={set("postal_code")} value={values["postal_code"]} />
            <Field id="country" label="Country" onChange={set("country")} value={values["country"]} />
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="id_document_type" label="Document type (passport, ID card…)" onChange={set("id_document_type")} value={values["id_document_type"]} />
            <Field id="id_document_number" label="Document number" onChange={set("id_document_number")} value={values["id_document_number"]} />
            <div className="sm:col-span-2">
              <Field id="id_document_url" label="Document link (secure upload URL)" onChange={set("id_document_url")} value={values["id_document_url"]} />
              <p className="mt-2 text-xs text-muted-foreground">
                Paste a secure link to your document. Direct file upload arrives with the KYC
                provider integration.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="occupation" label="Occupation" onChange={set("occupation")} value={values["occupation"]} />
            <Field id="employment_status" label="Employment status" onChange={set("employment_status")} value={values["employment_status"]} />
            <div className="sm:col-span-2">
              <Field id="source_of_funds" label="Source of funds" onChange={set("source_of_funds")} value={values["source_of_funds"]} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="font-medium text-foreground">I'm onboarding a business</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Business accounts unlock virtual accounts and higher payout limits.
                </p>
              </div>
              <Switch checked={isBusiness} onCheckedChange={setIsBusiness} />
            </div>
            {isBusiness && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="business_name" label="Legal business name" onChange={set("business_name")} value={values["business_name"]} />
                <Field id="business_registration_number" label="Registration number" onChange={set("business_registration_number")} value={values["business_registration_number"]} />
                <Field id="business_country" label="Country of incorporation" onChange={set("business_country")} value={values["business_country"]} />
                <Field id="business_website" label="Website" onChange={set("business_website")} value={values["business_website"]} />
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <Button
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-full"
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="rounded-full px-7">
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submit.isPending} className="rounded-full px-7">
              {submit.isPending ? "Submitting…" : "Submit for review"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value?: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value ?? ""} onChange={onChange} className="rounded-xl" />
    </div>
  );
}
