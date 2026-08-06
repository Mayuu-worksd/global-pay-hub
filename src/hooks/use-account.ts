import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Beneficiary,
  CryptoWallet,
  FiatWallet,
  Profile,
  Transaction,
  UserSettings,
  VirtualAccount,
} from "@/types";

async function requireUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useKyc() {
  return useQuery({
    queryKey: ["kyc"],
    queryFn: async () => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("kyc")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("kyc").upsert(
        {
          ...values,
          user_id: userId,
          status: "pending",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useFiatWallets() {
  return useQuery({
    queryKey: ["fiat_wallets"],
    queryFn: async (): Promise<FiatWallet[]> => {
      const { data, error } = await supabase
        .from("fiat_wallets")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FiatWallet[];
    },
  });
}

export function useCryptoWallets() {
  return useQuery({
    queryKey: ["crypto_wallets"],
    queryFn: async (): Promise<CryptoWallet[]> => {
      const { data, error } = await supabase
        .from("crypto_wallets")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CryptoWallet[];
    },
  });
}

function randomHex(length: number) {
  const chars = "0123456789abcdef";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

export function useCreateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ kind, code }: { kind: "fiat" | "crypto"; code: string }) => {
      const userId = await requireUserId();
      if (kind === "fiat") {
        const { error } = await supabase
          .from("fiat_wallets")
          .insert({ user_id: userId, currency: code, label: `${code} wallet` });
        if (error) throw error;
      } else {
        const network = code === "BTC" ? "Bitcoin" : code === "ETH" ? "Ethereum" : "TRC-20";
        const address = code === "BTC" ? `bc1q${randomHex(32)}` : `0x${randomHex(40)}`;
        const { error } = await supabase.from("crypto_wallets").insert({
          user_id: userId,
          asset: code,
          network,
          label: `${code} wallet`,
          deposit_address: address,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fiat_wallets"] });
      qc.invalidateQueries({ queryKey: ["crypto_wallets"] });
    },
  });
}

export function useVirtualAccounts() {
  return useQuery({
    queryKey: ["virtual_accounts"],
    queryFn: async (): Promise<VirtualAccount[]> => {
      const { data, error } = await supabase
        .from("virtual_accounts")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as VirtualAccount[];
    },
  });
}

export function useCreateVirtualAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (currency: string) => {
      const userId = await requireUserId();
      const isEur = currency === "EUR";
      const { error } = await supabase.from("virtual_accounts").insert({
        user_id: userId,
        currency,
        account_name: "Nexus Pay Collection Account",
        account_number: String(Math.floor(1e11 + Math.random() * 8e11)),
        routing_number: isEur ? null : "084009519",
        iban: isEur ? `DE89${Math.floor(1e17 + Math.random() * 8e17)}` : null,
        swift_bic: isEur ? "NEXUDEB2XXX" : "NEXUUS33XXX",
        bank_name: isEur ? "Nexus Pay Europe SA" : "Nexus Pay Trust NA",
        bank_address: isEur ? "12 Rue Neuve, 1000 Brussels, BE" : "8 Bridge St, New York, NY",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["virtual_accounts"] }),
  });
}

export function useTransactions(type?: string) {
  return useQuery({
    queryKey: ["transactions", type ?? "all"],
    queryFn: async (): Promise<Transaction[]> => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (type) query = query.eq("type", type);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export interface MovementInput {
  type: "deposit" | "withdrawal" | "send" | "receive";
  amount: number;
  currency: string;
  counterparty?: string;
  description?: string;
}

export function useRecordMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MovementInput) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type: input.type,
        amount: input.amount,
        currency: input.currency,
        status: "completed",
        counterparty: input.counterparty ?? null,
        description: input.description ?? null,
      });
      if (error) throw error;
      await applyBalance(input.currency, input.type === "deposit" || input.type === "receive" ? input.amount : -input.amount);
    },
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useExchange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      from: string;
      to: string;
      amount: number;
      converted: number;
      rate: number;
    }) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "exchange",
        amount: input.amount,
        currency: input.from,
        to_amount: input.converted,
        to_currency: input.to,
        rate: input.rate,
        status: "completed",
        description: `${input.from} → ${input.to}`,
      });
      if (error) throw error;
      await applyBalance(input.from, -input.amount);
      await applyBalance(input.to, input.converted);
    },
    onSuccess: () => invalidateMoney(qc),
  });
}

async function applyBalance(code: string, delta: number) {
  const upper = code.toUpperCase();
  const fiat = ["USD", "EUR", "GBP"].includes(upper);
  const table = fiat ? "fiat_wallets" : "crypto_wallets";
  const column = fiat ? "currency" : "asset";
  const { data } = await supabase.from(table).select("*").eq(column, upper).maybeSingle();
  if (!data) return;
  const next = Math.max(0, Number((data as { balance: number }).balance) + delta);
  const patch = fiat ? { balance: next, available_balance: next } : { balance: next };
  await supabase.from(table).update(patch).eq("id", (data as { id: string }).id);
}

function invalidateMoney(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["fiat_wallets"] });
  qc.invalidateQueries({ queryKey: ["crypto_wallets"] });
}

export function useBeneficiaries() {
  return useQuery({
    queryKey: ["beneficiaries"],
    queryFn: async (): Promise<Beneficiary[]> => {
      const { data, error } = await supabase
        .from("beneficiaries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Beneficiary[];
    },
  });
}

export function useSaveBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("beneficiaries").insert({ ...values, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beneficiaries"] }),
  });
}

export function useDeleteBeneficiary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("beneficiaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beneficiaries"] }),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<UserSettings | null> => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as UserSettings | null;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      const userId = await requireUserId();
      const { error } = await supabase
        .from("settings")
        .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const userId = await requireUserId();
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
