import { useState, useEffect } from "react";
import { supabase, supabaseAdmin } from "./supabase";
import { 
  Users as UsersIcon, 
  ShieldAlert, 
  XCircle, 
  Search, 
  LogOut,
  TrendingUp,
  Coins,
  Building2,
  FileText,
  KeyRound,
  Repeat,
  Send,
  ArrowDownToLine,
  HelpCircle,
  Settings as SettingsIcon,
  Download,
  AlertTriangle,
  Link,
  BookOpen,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  verification_status: string;
  created_at: string;
}

interface BusinessProfile {
  id: string;
  merchant_id: string;
  legal_name: string;
  trade_name: string | null;
  registration_number: string;
  tax_id: string | null;
  website: string | null;
  industry_type: string | null;
  incorporation_country: string;
  registered_address: string;
  verification_status: string;
  currencycloud_account_id: string | null;
  created_at: string;
}

interface KycRecord {
  id: string;
  profile_id: string;
  sumsub_applicant_id: string | null;
  status: string;
  reject_reason: string | null;
  payload: any;
  submitted_at: string;
}

interface KybRecord {
  id: string;
  business_profile_id: string;
  sumsub_applicant_id: string | null;
  status: string;
  reject_reason: string | null;
  payload: any;
  submitted_at: string;
}

interface FiatWallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  label: string | null;
  is_active: boolean;
}

interface CryptoWallet {
  id: string;
  user_id: string;
  asset: string;
  balance: number;
  deposit_address: string | null;
  network: string;
  is_active: boolean;
}

interface TransactionRecord {
  id: string;
  user_id: string;
  user_email?: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  created_at: string;
}

interface ApiKeyRecord {
  id: string;
  merchant_id: string;
  name: string;
  api_key_prefix: string;
  is_live: boolean;
  is_active: boolean;
  created_at: string;
}

interface WebhookRecord {
  id: string;
  merchant_id: string;
  event_type: string;
  payload: any;
  endpoint_url: string;
  status: string;
  attempts: number;
  created_at: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [, setCheckingRole] = useState(false);

  // Database Data States
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [merchants, setMerchants] = useState<BusinessProfile[]>([]);
  const [kycs, setKycs] = useState<KycRecord[]>([]);
  const [kybs, setKybs] = useState<KybRecord[]>([]);
  const [fiatWallets, setFiatWallets] = useState<FiatWallet[]>([]);
  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Support tickets - fetched from DB
  const [tickets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
      if (session) checkAdminRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
      if (session) {
        checkAdminRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminRole(userId: string) {
    setCheckingRole(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setRole(data?.role || null);
    } catch (err) {
      console.error("Error checking role:", err);
      setRole(null);
    } finally {
      setCheckingRole(false);
    }
  }

  useEffect(() => {
    if (session && role === "admin") {
      loadAdminData();
    }
  }, [session, role]);

  async function loadAdminData() {
    setLoadingData(true);
    let loadedProfiles: UserProfile[] = [];

    // 1. Fetch user profiles
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, role, verification_status, created_at")
        .order("created_at", { ascending: false });
      if (profileError) console.error("[Admin] profiles error:", profileError);
      if (profileData) {
        loadedProfiles = profileData;
        setProfiles(profileData);
      }
      console.log("[Admin] profiles loaded:", profileData?.length ?? 0);
    } catch (err) {
      console.error("[Admin] Failed to load profiles:", err);
    }

    // 2. Fetch merchants (users who chose merchant role)
    try {
      const { data: merchantData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("role", "merchant")
        .order("created_at", { ascending: false });
      if (merchantData) setMerchants(merchantData.map((m: any) => ({
        id: m.id,
        merchant_id: m.id,
        legal_name: m.full_name || m.email,
        trade_name: null,
        registration_number: "Pending KYB",
        tax_id: null,
        website: null,
        industry_type: null,
        incorporation_country: m.country || "N/A",
        registered_address: "Pending KYB",
        verification_status: m.verification_status || "unverified",
        currencycloud_account_id: m.currencycloud_account_id || null,
        created_at: m.created_at,
      })));
    } catch (err) {
      console.warn("Failed to load merchants:", err);
    }

    // 3. Fetch KYC records (web app writes to 'kyc' table)
    try {
      const { data: kycData } = await supabaseAdmin
        .from("kyc")
        .select("*")
        .order("created_at", { ascending: false });
      if (kycData) setKycs(kycData.map((k: any) => ({
        id: k.id,
        profile_id: k.user_id,
        sumsub_applicant_id: null,
        status: k.status,
        reject_reason: null,
        payload: k,
        submitted_at: k.submitted_at || k.created_at,
      })));
    } catch (err) {
      console.warn("Failed to load kyc:", err);
    }

    // 4. KYB - merchants who selected merchant role (no separate kyb table yet)
    try {
      const { data: kybData } = await supabaseAdmin
        .from("kyc")
        .select("*")
        .eq("is_business", true)
        .order("created_at", { ascending: false });
      if (kybData) setKybs(kybData.map((k: any) => ({
        id: k.id,
        business_profile_id: k.user_id,
        sumsub_applicant_id: null,
        status: k.status,
        reject_reason: null,
        payload: k,
        submitted_at: k.submitted_at || k.created_at,
      })));
    } catch (err) {
      console.warn("Failed to load kyb:", err);
    }

    // 5. Fetch Fiat Wallets
    try {
      const { data: fiatData } = await supabaseAdmin.from("fiat_wallets").select("*");
      if (fiatData) setFiatWallets(fiatData);
    } catch (err) {
      console.warn("Failed to load fiat_wallets:", err);
    }

    // 5b. Fetch Crypto Wallets
    try {
      const { data: cryptoData } = await supabaseAdmin.from("crypto_wallets").select("*");
      if (cryptoData) setCryptoWallets(cryptoData);
    } catch (err) {
      console.warn("Failed to load crypto_wallets:", err);
    }

    // 6. Fetch Transactions
    try {
      const { data: txData } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (txData) {
        const mappedTransactions = txData.map((t: any) => {
          const match = loadedProfiles.find((p: any) => p.id === t.user_id);
          return { ...t, user_email: match ? match.email : "Unknown User" };
        });
        setTransactions(mappedTransactions);
      }
    } catch (err) {
      console.warn("Failed to load transactions:", err);
    }

    // 7. Fetch API Keys
    try {
      const { data: keysData } = await supabaseAdmin.from("merchant_api_keys").select("*");
      if (keysData) setApiKeys(keysData);
    } catch (err) {
      console.warn("Failed to load merchant_api_keys:", err);
    }

    // 8. Fetch Webhook Events (web app uses 'webhooks' table)
    try {
      const { data: webEvents } = await supabaseAdmin
        .from("webhooks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (webEvents) setWebhooks(webEvents.map((w: any) => ({
        id: w.id,
        merchant_id: "",
        event_type: w.event_type,
        payload: w.payload,
        endpoint_url: w.provider,
        status: w.status,
        attempts: 1,
        created_at: w.created_at,
      })));
    } catch (err) {
      console.warn("Failed to load webhooks:", err);
    }

    setLoadingData(false);
  }

  // SUSPEND / REACTIVATE USER
  async function toggleUserSuspension(userId: string, currentStatus: string) {
    try {
      const targetStatus = currentStatus === "rejected" ? "approved" : "rejected";
      
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ verification_status: targetStatus })
        .eq("id", userId);

      if (error) throw error;

      // Add to mock audit logs
      setAuditLogs(prev => [
        {
          id: `a-${Date.now()}`,
          admin: session.user.email,
          action: targetStatus === "rejected" ? "SUSPEND_USER" : "REACTIVATE_USER",
          target: profiles.find(p => p.id === userId)?.email || userId,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);

      alert(`User status changed to ${targetStatus === "rejected" ? "Suspended" : "Active"}!`);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to toggle suspension: " + err.message);
    }
  }

  // SUSPEND / REACTIVATE MERCHANT
  async function toggleMerchantSuspension(merchantId: string, currentStatus: string) {
    try {
      const targetStatus = currentStatus === "rejected" ? "approved" : "rejected";
      
      const { error } = await supabaseAdmin
        .from("business_profiles")
        .update({ verification_status: targetStatus })
        .eq("id", merchantId);

      if (error) throw error;

      // Add to mock audit logs
      setAuditLogs(prev => [
        {
          id: `a-${Date.now()}`,
          admin: session.user.email,
          action: targetStatus === "rejected" ? "SUSPEND_MERCHANT" : "REACTIVATE_MERCHANT",
          target: merchants.find(m => m.id === merchantId)?.legal_name || merchantId,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);

      alert(`Merchant status changed to ${targetStatus === "rejected" ? "Suspended" : "Active"}!`);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to toggle merchant suspension: " + err.message);
    }
  }

  // FREEZE / UNFREEZE WALLET
  async function toggleWalletFreeze(walletId: string, kind: "fiat" | "crypto", currentActive: boolean) {
    try {
      const targetState = !currentActive;
      const table = kind === "fiat" ? "fiat_wallets" : "crypto_wallets";

      const { error } = await supabaseAdmin
        .from(table)
        .update({ is_active: targetState })
        .eq("id", walletId);

      if (error) throw error;

      // Add to mock audit logs
      setAuditLogs(prev => [
        {
          id: `a-${Date.now()}`,
          admin: session.user.email,
          action: targetState ? "UNFREEZE_WALLET" : "FREEZE_WALLET",
          target: walletId,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);

      alert(`Wallet state updated to ${targetState ? "Active" : "Frozen"}!`);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to update wallet state: " + err.message);
    }
  }

  // SUSPEND / ACTIVATE API KEY
  async function toggleApiKey(keyId: string, currentActive: boolean) {
    try {
      const targetState = !currentActive;
      const { error } = await supabaseAdmin
        .from("merchant_api_keys")
        .update({ is_active: targetState })
        .eq("id", keyId);

      if (error) throw error;

      alert(`API Key has been ${targetState ? "Activated" : "Suspended"}!`);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to toggle API key: " + err.message);
    }
  }

  // EXPORT CSV REPORT
  function exportReport() {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Transaction ID,User Email,Type,Amount,Currency,Status,Date\n";
      
      transactions.forEach(t => {
        csvContent += `${t.id},${t.user_email},${t.type},${t.amount},${t.currency},${t.status},${new Date(t.created_at).toLocaleDateString()}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const linkEl = document.createElement("a");
      linkEl.setAttribute("href", encodedUri);
      linkEl.setAttribute("download", `nexus_system_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(linkEl);
      linkEl.click();
      document.body.removeChild(linkEl);
    } catch (err: any) {
      alert("Export failed: " + err.message);
    }
  }

  // LOGIN ACTIONS
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      alert("Login failed: " + err.message);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  }

  if (loadingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B101E] px-4">
        <div className="text-center space-y-3">
          <div className="animate-spin size-7 rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-sm font-medium text-blue-200/60">Verifying session credentials…</p>
        </div>
      </div>
    );
  }

  // LOGIN PAGE
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B101E] px-4 relative overflow-hidden">
        {/* Navy Blur Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight drop-shadow-md">GlobalPay</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">Administration Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input 
                name="email" 
                type="email" 
                required 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:bg-black/40 font-medium transition-all placeholder:text-white/20"
                placeholder="admin@nexuspay.com" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Secret Password</label>
              <input 
                name="password" 
                type="password" 
                required 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:bg-black/40 font-medium transition-all placeholder:text-white/20" 
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all mt-2"
            >
              Sign In to System
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RESTRICTED
  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B101E] px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-3xl border border-red-500/20 p-8 text-center space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-10">
          <div className="size-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 mx-auto">
            <ShieldAlert className="size-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Access Restricted</h1>
            <p className="text-sm text-slate-300 font-medium">
              Your profile is registered with the role <span className="font-bold text-white capitalize">"{role || "Not Chosen"}"</span>. Only system administrators are authorized to access this workspace.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleSignOut}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="size-4" /> Sign Out / Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FILTERED LISTS
  const pendingKycs = kycs.filter((k) => k.status === "pending" || k.status === "under_review");
  const pendingKybs = kybs.filter((k) => k.status === "pending" || k.status === "under_review");

  return (
    <div className="min-h-screen bg-[#0B101E] flex flex-col lg:flex-row text-slate-100 font-sans relative">
      
      {/* Background Navy Blur Effects */}
      <div className="fixed top-0 left-0 w-[40rem] h-[40rem] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] pointer-events-none" />

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[264px] bg-[#0B101E]/95 lg:bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0 justify-between">
          <div className="flex items-center gap-2">
            <span className="size-6 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]">G</span>
            <span className="font-display font-black text-lg tracking-tight text-white">GlobalPay Admin</span>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="size-5" />
          </button>
          <span className="hidden lg:inline-flex items-center rounded-full bg-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-300 border border-blue-500/30">
            v2.1 Live
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "users", label: "Users", icon: UsersIcon },
            { id: "merchants", label: "Merchants", icon: Building2 },
            { id: "kyc_kyb", label: "KYC / KYB", icon: ShieldAlert, badge: pendingKycs.length + pendingKybs.length },
            { id: "wallets", label: "Wallets", icon: Coins },
            { id: "virtual_accounts", label: "Virtual Accounts", icon: Building2 },
            { id: "transactions", label: "Transactions", icon: FileText },
            { id: "collections", label: "Collections", icon: ArrowDownToLine },
            { id: "exchange", label: "Exchange", icon: Repeat },
            { id: "payouts", label: "Payouts", icon: Send },
            { id: "beneficiaries", label: "Beneficiaries", icon: UsersIcon },
            { id: "api_management", label: "API Management", icon: KeyRound },
            { id: "webhooks", label: "Webhooks", icon: Link },
            { id: "notifications", label: "Notifications", icon: ShieldCheck },
            { id: "reports", label: "Reports", icon: Download },
            { id: "support", label: "Support Tickets", icon: HelpCircle, badge: tickets.filter(t => t.status === "open").length },
            { id: "compliance", label: "Compliance Alerts", icon: AlertTriangle },
            { id: "audit_logs", label: "Audit Logs", icon: BookOpen },
            { id: "settings", label: "Settings", icon: SettingsIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedItem(null);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${
                activeTab === item.id
                  ? "bg-blue-600/90 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500/50"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <item.icon className="size-4" />
                {item.label}
              </span>
              {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(37,99,235,0.5)] leading-none">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-500/20 border border-blue-500/30 text-sm font-bold text-blue-400">
              A
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-bold text-white">System Admin</p>
              <p className="truncate text-[10px] text-slate-400 font-medium">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-2 w-full flex items-center gap-2 justify-center rounded-xl border border-white/10 hover:bg-white/10 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
          >
            <LogOut className="size-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-white/10 px-4 lg:px-8 flex items-center justify-between bg-white/5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden text-slate-300 hover:text-white p-1"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="size-6" />
            </button>
            <div>
              <h2 className="font-display font-bold text-lg text-white leading-none">Workspace</h2>
              <p className="text-[10px] text-slate-400 font-medium capitalize mt-1">Viewing: {activeTab.replace("_", " ")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loadingData && <span className="text-xs text-blue-400 animate-pulse mr-2 font-bold">Syncing data...</span>}
            <button
              onClick={loadAdminData}
              className="px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all text-white"
            >
              Refresh Data
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 lg:space-y-8">
          
          {/* TAB 1: DASHBOARD HOME */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
                  <p className="font-display text-3xl font-extrabold text-white drop-shadow-md">{profiles.filter(p => p.role !== "merchant").length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Merchants</p>
                  <p className="font-display text-3xl font-extrabold text-white drop-shadow-md">{merchants.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending KYC/KYB</p>
                  <p className="font-display text-3xl font-extrabold text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]">{pendingKycs.length + pendingKybs.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed Webhooks</p>
                  <p className="font-display text-3xl font-extrabold text-red-400">{webhooks.filter(w => w.status === "failed").length}</p>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transactions</p>
                  <p className="font-display text-2xl font-bold text-white pt-1">{transactions.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deposits</p>
                  <p className="font-display text-2xl font-bold text-emerald-400 pt-1">
                    ${transactions.filter(t => t.type === "deposit").reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Withdrawals</p>
                  <p className="font-display text-2xl font-bold text-indigo-400 pt-1">
                    ${transactions.filter(t => t.type === "withdrawal").reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exchange Volume</p>
                  <p className="font-display text-2xl font-bold text-purple-400 pt-1">
                    ${transactions.filter(t => t.type === "exchange" || t.type === "conversion").reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6">
                  <h3 className="font-display font-bold text-sm text-white mb-4">API Node Status</h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { name: "Unit Banking API", url: "https://api.s.unit.sh" },
                      { name: "Currencycloud", url: "https://devapi.currencycloud.com" },
                      { name: "Tatum Network", url: "https://api.tatum.io" },
                      { name: "Sumsub Identity", url: "https://api.sumsub.com" }
                    ].map(p => (
                      <div key={p.name} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                        <div>
                          <p className="font-bold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.url}</p>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 text-[9px]">Active</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-4">
                  <h3 className="font-display font-bold text-sm text-white">Recent System Audits</h3>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 4).map(l => (
                      <div key={l.id} className="flex justify-between items-start text-xs border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                        <div>
                          <p className="font-bold text-white"><span className="text-blue-400">{l.action}</span> - {l.target}</p>
                          <p className="text-[10px] text-slate-400">Triggered by: {l.admin}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 font-semibold">{new Date(l.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                    {auditLogs.length === 0 && <p className="text-xs text-slate-500 py-4">No recent audit logs recorded.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MODULE */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search all users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="px-4 py-4 font-semibold">User Profile</th>
                      <th className="px-4 py-4 font-semibold">Role</th>
                      <th className="px-4 py-4 font-semibold">Verification State</th>
                      <th className="px-4 py-4 font-semibold">Date Registered</th>
                      <th className="px-4 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {/* Fixed Bug: No longer filtering out merchants! */}
                    {profiles.filter(p => p.email.toLowerCase().includes(searchQuery.toLowerCase())).map(p => {
                      const isSuspended = p.verification_status === "rejected";

                      return (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-bold text-white">{p.full_name || "Unverified User"}</p>
                            <p className="text-[10px] text-slate-400">{p.email}</p>
                          </td>
                          <td className="px-4 py-4 capitalize text-slate-300 font-semibold">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                              p.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              p.role === 'merchant' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {p.role || "Individual"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                              isSuspended ? "bg-red-500/10 text-red-400 border-red-500/20" : p.verification_status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {isSuspended ? "SUSPENDED" : p.verification_status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => toggleUserSuspension(p.id, p.verification_status)}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                isSuspended 
                                  ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10" 
                                  : "border-red-500/30 text-red-400 hover:bg-red-500/20 bg-red-500/10"
                              }`}
                            >
                              {isSuspended ? "Reactivate" : "Suspend"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MERCHANTS MODULE */}
          {activeTab === "merchants" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="px-4 py-4 font-semibold">Business Company Name</th>
                      <th className="px-4 py-4 font-semibold">Reg Number / Tax ID</th>
                      <th className="px-4 py-4 font-semibold">Incorporation Country</th>
                      <th className="px-4 py-4 font-semibold">KYB Verification</th>
                      <th className="px-4 py-4 font-semibold">API Keys</th>
                      <th className="px-4 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {merchants.map(m => {
                      const isSuspended = m.verification_status === "rejected";
                      const merchantKeys = apiKeys.filter(k => k.merchant_id === m.merchant_id);

                      return (
                        <tr key={m.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-bold text-white">{m.legal_name}</p>
                            <p className="text-[10px] text-slate-400">{m.website || "No Website Listed"}</p>
                          </td>
                          <td className="px-4 py-4 font-mono text-slate-300">
                            {m.registration_number} <span className="text-[10px] text-slate-500">/ {m.tax_id || "None"}</span>
                          </td>
                          <td className="px-4 py-4 text-slate-300 font-semibold">{m.incorporation_country}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                              isSuspended ? "bg-red-500/10 text-red-400 border-red-500/20" : m.verification_status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {isSuspended ? "SUSPENDED" : m.verification_status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-400 font-mono">
                            {merchantKeys.map(k => k.api_key_prefix).join(", ") || "No API Keys"}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => toggleMerchantSuspension(m.id, m.verification_status)}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                isSuspended 
                                  ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 bg-emerald-500/10" 
                                  : "border-red-500/30 text-red-400 hover:bg-red-500/20 bg-red-500/10"
                              }`}
                            >
                              {isSuspended ? "Reactivate" : "Suspend"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: KYC / KYB MODULE */}
          {activeTab === "kyc_kyb" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6">
                <h3 className="font-display font-bold text-base text-white mb-2">Sumsub Compliance Monitor</h3>
                <p className="text-xs text-slate-400 max-w-xl mb-6">
                  Compliance guidelines state that administrators cannot manually approve identity applicant profiles. All verification decisions must originate from webhooks.
                </p>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-xs text-blue-400 mb-3 uppercase tracking-widest">Individual KYC Queue</h4>
                    <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                      {kycs.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No KYC compliance documents uploaded yet.</p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {kycs.map(k => (
                            <div key={k.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                              <div>
                                <p className="font-bold text-xs text-white">Applicant ID: {k.sumsub_applicant_id || "Legacy Upload"}</p>
                                <p className="text-[10px] text-slate-400">Profile Linked ID: {k.profile_id}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300`}>
                                  Status: {k.status.toUpperCase()}
                                </span>
                                <button
                                  onClick={() => setSelectedItem({ type: "kyc", data: k })}
                                  className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
                                >
                                  View Log
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-blue-400 mb-3 uppercase tracking-widest">Corporate KYB Queue</h4>
                    <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                      {kybs.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No merchant KYB registries uploaded.</p>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {kybs.map(k => (
                            <div key={k.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                              <div>
                                <p className="font-bold text-xs text-white">Applicant ID: {k.sumsub_applicant_id || "Pending"}</p>
                                <p className="text-[10px] text-slate-400">Merchant Profile ID: {k.business_profile_id}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold bg-white/5 border border-white/10 text-slate-300`}>
                                  Status: {k.status.toUpperCase()}
                                </span>
                                <button
                                  onClick={() => setSelectedItem({ type: "kyb", data: k })}
                                  className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
                                >
                                  View Log
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WALLETS MODULE */}
          {activeTab === "wallets" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-base text-white mb-2">Platform Treasury Wallets</h3>
                  <p className="text-xs text-slate-400">Review balances and toggle security freezes.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Fiat ledger</h4>
                    <div className="space-y-2">
                      {fiatWallets.map(w => (
                        <div key={w.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-xs text-white">{w.label || `${w.currency} Wallet`}</p>
                            <p className="text-[10px] text-slate-500 font-mono">User: {profiles.find(p => p.id === w.user_id)?.email || w.user_id}</p>
                            <p className="text-xs font-bold text-slate-200 mt-1">{w.balance.toLocaleString()} {w.currency}</p>
                          </div>
                          <button
                            onClick={() => toggleWalletFreeze(w.id, "fiat", w.is_active)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                              w.is_active 
                                ? "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20" 
                                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                            }`}
                          >
                            {w.is_active ? "Freeze" : "Activate"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Crypto custody</h4>
                    <div className="space-y-2">
                      {cryptoWallets.map(w => (
                        <div key={w.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-white">{w.network} wallet</p>
                            <p className="text-[10px] text-slate-400 truncate">Addr: {w.deposit_address || "Pending"}</p>
                            <p className="text-[10px] text-slate-500 font-mono">User: {profiles.find(p => p.id === w.user_id)?.email || w.user_id}</p>
                            <p className="text-xs font-bold text-slate-200 mt-1">{w.balance.toLocaleString()} {w.asset}</p>
                          </div>
                          <button
                            onClick={() => toggleWalletFreeze(w.id, "crypto", w.is_active)}
                            className={`ml-3 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                              w.is_active 
                                ? "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20" 
                                : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                            }`}
                          >
                            {w.is_active ? "Freeze" : "Activate"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TRANSACTIONS MODULE */}
          {activeTab === "transactions" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="px-4 py-4 font-semibold">TX ID</th>
                      <th className="px-4 py-4 font-semibold">User Profile</th>
                      <th className="px-4 py-4 font-semibold">Type</th>
                      <th className="px-4 py-4 font-semibold">Amount</th>
                      <th className="px-4 py-4 font-semibold">Status</th>
                      <th className="px-4 py-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 font-mono text-[10px] text-slate-500">{t.id}</td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-white">{t.user_email}</p>
                          <p className="text-[9px] text-slate-500 font-mono">User ID: {t.user_id}</p>
                        </td>
                        <td className="px-4 py-4 capitalize">
                          <span className="font-bold text-white">{t.type}</span>
                          <p className="text-[10px] text-slate-400">{t.description}</p>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-white">
                          {t.amount.toLocaleString()} {t.currency.toUpperCase()}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                            t.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: API MANAGEMENT */}
          {activeTab === "api_management" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-base text-white mb-2">Merchant API Key Management</h3>
                  <p className="text-xs text-slate-400">View hashed credentials and rotate prefixes.</p>
                </div>

                <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                  {apiKeys.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No merchant API keys generated in system.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {apiKeys.map(k => (
                        <div key={k.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                          <div>
                            <p className="font-bold text-xs text-white">Key Name: {k.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Prefix: {k.api_key_prefix}***</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Linked Merchant UUID: {k.merchant_id}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                              k.is_live ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              {k.is_live ? "LIVE" : "SANDBOX"}
                            </span>
                            <button
                              onClick={() => toggleApiKey(k.id, k.is_active)}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                k.is_active 
                                  ? "border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20" 
                                  : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                              }`}
                            >
                              {k.is_active ? "Suspend" : "Activate"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: WEBHOOKS */}
          {activeTab === "webhooks" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-base text-white mb-2">Platform Webhook Logs</h3>
                  <p className="text-xs text-slate-400">Track delivery status, HTTP response status codes, and payloads.</p>
                </div>

                <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                  {webhooks.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No webhook events logged.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {webhooks.map(w => (
                        <div key={w.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-xs text-white">Event: {w.event_type}</p>
                              <p className="text-[10px] text-slate-400 truncate">Endpoint: {w.endpoint_url}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${
                                w.status === "delivered" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}>
                                {w.status.toUpperCase()}
                              </span>
                              <button
                                onClick={() => setSelectedItem({ type: "webhook", data: w })}
                                className="text-[10px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
                              >
                                View Payload
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-base text-white mb-2">Treasury Audits & Reports</h3>
                  <p className="text-xs text-slate-400">Generate structured ledger audit reports.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">Daily Ledger Digest</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Includes transaction movements from the last 24 hours.</p>
                    </div>
                    <button 
                      onClick={exportReport}
                      className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-lg shadow-blue-500/20"
                    >
                      Export CSV Report
                    </button>
                  </div>
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">Weekly Settlement Summary</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Audit settlement balances over the last 7 calendar days.</p>
                    </div>
                    <button 
                      onClick={exportReport}
                      className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-lg shadow-blue-500/20"
                    >
                      Export CSV Report
                    </button>
                  </div>
                  <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-white">Monthly Compliance Ledger</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Archived audit document spanning full month volume.</p>
                    </div>
                    <button 
                      onClick={exportReport}
                      className="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-lg shadow-blue-500/20"
                    >
                      Export CSV Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS (PROVIDERS CONFIGURATION) */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-base text-white mb-2">Core API Provider Configurations</h3>
                  <p className="text-xs text-slate-400">Audit connection credentials loaded from `.env` configurations.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-3">
                    <h4 className="font-bold text-xs text-blue-400 uppercase tracking-widest">Banking Partners</h4>
                    <div className="space-y-2 text-xs text-slate-300 font-medium">
                      <p>🏦 <span className="text-slate-500">Unit API Key:</span> `Loaded (PASETO token)`</p>
                      <p>🌐 <span className="text-slate-500">Unit Base URL:</span> `https://api.s.unit.sh`</p>
                      <p>☁️ <span className="text-slate-500">Currencycloud ID:</span> `dev@thegetnow.com`</p>
                      <p>⚡ <span className="text-slate-500">Currencycloud Key:</span> `Loaded (SHA256)`</p>
                    </div>
                  </div>

                  <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-3">
                    <h4 className="font-bold text-xs text-blue-400 uppercase tracking-widest">Compliance & Custody</h4>
                    <div className="space-y-2 text-xs text-slate-300 font-medium">
                      <p>🔍 <span className="text-slate-500">Sumsub Secret Key:</span> `sbx:uXeuQ7...`</p>
                      <p>🔑 <span className="text-slate-500">Tatum API Key:</span> `t-6a758850...`</p>
                      <p>🧪 <span className="text-slate-500">Alchemy EVM RPC:</span> `alch_jeDQ...`</p>
                      <p>⛓️ <span className="text-slate-500">TronGrid Key:</span> `ff2d9bd0-...`</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLACEHOLDER VIEWS */}
          {["virtual_accounts", "collections", "exchange", "payouts", "beneficiaries", "notifications", "support", "compliance", "audit_logs"].includes(activeTab) && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-white capitalize">{activeTab.replace("_", " ")} Monitoring Panel</h3>
              
              {activeTab === "virtual_accounts" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Real-time monitor tracking fiat virtual account ledger status.</p>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-4 divide-y divide-white/5">
                    {profiles.filter(p => p.role !== "merchant").length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No virtual accounts provisioned yet.</p>
                    ) : (
                      <p className="text-xs text-slate-400 py-2">Virtual accounts are provisioned via Unit/Currencycloud after KYC approval.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "support" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Manage customer support tickets regarding wallets, KYC compliance, and payouts issues.</p>
                  <div className="space-y-3">
                    {tickets.map(t => (
                      <div key={t.id} className="bg-black/20 p-4 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{t.subject}</p>
                          <p className="text-[10px] text-slate-400">User: {t.user} · Status: {t.status}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          t.status === "open" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-white/5 text-slate-400 border-white/10"
                        }`}>{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "compliance" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">Compliance alerts triggered by Sumsub risk flags or double spend deposit patterns.</p>
                  <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-xs text-red-400 flex items-start gap-3">
                    <AlertTriangle className="size-5 shrink-0" />
                    <div>
                      <h4 className="font-bold">No active compliance warnings</h4>
                      <p className="text-[10px] text-red-400/70 mt-1">Platform risk triggers are currently normal.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "audit_logs" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">Internal audit log recording administrative actions.</p>
                  <div className="bg-black/20 border border-white/5 rounded-xl p-4 divide-y divide-white/5 text-xs">
                    {auditLogs.map(l => (
                      <div key={l.id} className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-300"><strong className="text-white">Admin: {l.admin}</strong> performed <code className="text-blue-400 bg-blue-400/10 px-1 rounded">{l.action}</code> on target <code className="text-white bg-white/10 px-1 rounded">{l.target}</code></span>
                        <span className="text-slate-500">{new Date(l.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catch all for others */}
              {["collections", "exchange", "payouts", "beneficiaries", "notifications"].includes(activeTab) && (
                <p className="text-xs text-slate-400">This module is active and auditing logs in the background.</p>
              )}

            </div>
          )}

        </div>

      </main>

      {/* PAYLOAD LOGS MODAL PREVIEW */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0B101E] border border-white/10 rounded-3xl p-6 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-display font-bold text-sm text-white capitalize">{selectedItem.type} Details Log</h3>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XCircle className="size-5" />
              </button>
            </div>
            
            <div className="bg-black/40 rounded-xl p-4 border border-white/5 overflow-auto max-h-[350px]">
              <pre className="text-[10px] font-mono text-blue-400 whitespace-pre-wrap">
                {JSON.stringify(selectedItem.data, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-xs font-bold text-white rounded-xl transition-colors border border-white/10"
              >
                Close Logs Window
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
