import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import type {
  Beneficiary,
  CryptoWallet,
  FiatWallet,
  Profile,
  Transaction,
  UserSettings,
  VirtualAccount,
} from "@/types";
import {
  serverSubmitKyc,
  serverCreateVirtualAccount,
  serverExchange,
  serverRecordMovement,
  serverSaveBeneficiary,
} from "@/services/server-functions";

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

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
          const res = await fetch(`${backendUrl}/api/kyc/status/${userId}`, {
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
            },
          });
          if (res.ok) {
            const backendKyc = await res.json();
            return {
              ...data,
              status: backendKyc.status || data?.status || "not_started",
              rejection_reason: backendKyc.rejection_reason || null,
            };
          }
        }
      } catch (e) {
        console.warn("Could not fetch KYC status from backend:", e);
      }
      return data;
    },
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      const res = await fetch(`${backendUrl}/api/kyc/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit KYC");
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["fiat_wallets"] });
      qc.invalidateQueries({ queryKey: ["crypto_wallets"] });
      qc.invalidateQueries({ queryKey: ["virtual_accounts"] });
      router.invalidate();
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

      // Check KYC status before creating wallet
      const { data: kyc, error: kycErr } = await supabase
        .from("kyc")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

      if (kycErr) throw kycErr;
      if (!kyc || kyc.status !== "approved") {
        throw new Error("KYC verification must be approved before you can create wallets.");
      }

      if (kind === "fiat") {
        const { error } = await supabase
          .from("fiat_wallets")
          .insert({ user_id: userId, currency: code, label: `${code} wallet` });
        if (error) throw error;
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        
        // Call backend to generate real Tatum address
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"}/api/crypto/address`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ asset: code, userId }),
        });
        if (!res.ok) throw new Error("Failed to generate crypto address");
        const { address, network } = await res.json();
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
      return await serverCreateVirtualAccount({ data: currency });
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
      if (type) query = query.eq("type", type as Transaction["type"]);
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
  counterparty?: string | undefined;
  description?: string | undefined;
}

export function useRecordMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MovementInput) => {
      return await serverRecordMovement({ data: input });
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
    }) => {
      return await serverExchange({ data: input });
    },
    onSuccess: () => invalidateMoney(qc),
  });
}

async function applyBalance(code: string, delta: number) {
  const upper = code.toUpperCase();
  if (["USD", "EUR", "GBP"].includes(upper)) {
    const { data } = await supabase
      .from("fiat_wallets")
      .select("id, balance")
      .eq("currency", upper)
      .maybeSingle();
    if (!data) return;
    const next = Math.max(0, Number(data.balance) + delta);
    await supabase
      .from("fiat_wallets")
      .update({ balance: next, available_balance: next })
      .eq("id", data.id);
    return;
  }
  const { data } = await supabase
    .from("crypto_wallets")
    .select("id, balance")
    .eq("asset", upper)
    .maybeSingle();
  if (!data) return;
  const next = Math.max(0, Number(data.balance) + delta);
  await supabase.from("crypto_wallets").update({ balance: next }).eq("id", data.id);
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
    mutationFn: async (values: { name: string } & Record<string, unknown>) => {
      return await serverSaveBeneficiary({ data: values });
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
