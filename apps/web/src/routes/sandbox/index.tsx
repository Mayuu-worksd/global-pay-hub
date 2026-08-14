import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { 
  Terminal, Key, Activity, Check, Plus, Trash,
  Layers, ArrowUpDown, Globe, RefreshCw, LogOut, BookOpen,
  AlertCircle, Users, Wallet, CreditCard, Play 
} from "lucide-react";
import { 
  serverCreateSandboxApiKey, 
  serverListSandboxApiKeys, 
  serverRevokeSandboxApiKey, 
  serverGetSandboxLogs, 
  serverExecuteSandboxApi,
  serverTriggerWebhook
} from "@/services/server-functions";

export const Route = createFileRoute("/sandbox/")({
  component: SandboxConsolePage,
});

function SandboxConsolePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "api-keys" | "api-explorer" | "customers" | "accounts" | "wallets" | "transactions" | "webhooks" | "logs" | "settings">("overview");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Explorer state
  const [explorerEndpoint, setExplorerEndpoint] = useState("/v1/customers");
  const [explorerMethod, setExplorerMethod] = useState("POST");
  const [explorerBody, setExplorerBody] = useState("");
  const [explorerResponse, setExplorerResponse] = useState<any>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerHeaders, setExplorerHeaders] = useState<Record<string, string>>({});

  // Logs & Events State
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Alert State
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      navigate({ to: "/sandbox/login" });
      return;
    }
    setUser(data.user);
    setLoading(false);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const keys = await serverListSandboxApiKeys();
      setApiKeys(keys || []);

      const sandboxLogs = await serverGetSandboxLogs();
      setLogs(sandboxLogs || []);
    } catch (err: any) {
      setDashboardError(err.message || "Failed to load developer configurations.");
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const result = await serverCreateSandboxApiKey({ data: newKeyName });
      setNewKeyName("");
      setNewlyCreatedKey(result.apiKey);
      await fetchData();
    } catch (err: any) {
      setDashboardError(err.message || "Failed to generate key.");
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;

    try {
      await serverRevokeSandboxApiKey({ data: id });
      await fetchData();
    } catch (err: any) {
      setDashboardError(err.message || "Failed to revoke key.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/sandbox/login" });
  };

  // Endpoint default bodies mapping
  const getDefaultBody = (endpoint: string) => {
    if (endpoint === "/v1/customers") {
      return JSON.stringify({
        name: "Acme Corporates Ltd",
        email: "finance@acme.com",
        address: {
          street: "742 Evergreen Terrace",
          city: "Springfield",
          country: "US"
        }
      }, null, 2);
    }
    if (endpoint === "/v1/virtual-accounts") {
      return JSON.stringify({
        customer_id: "cust_test_f89a8712",
        currency: "USD",
        account_name: "Operations virtual account"
      }, null, 2);
    }
    if (endpoint === "/v1/wallets") {
      return JSON.stringify({
        currency: "USDT",
        type: "crypto"
      }, null, 2);
    }
    if (endpoint === "/v1/payments") {
      return JSON.stringify({
        amount: 250.00,
        currency: "USD",
        destination: "bene_test_0987a",
        reference: "Sandbox Payout Test"
      }, null, 2);
    }
    if (endpoint === "/v1/conversions") {
      return JSON.stringify({
        from: "USD",
        to: "EUR",
        amount: 100.00
      }, null, 2);
    }
    return "{\n  \n}";
  };

  useEffect(() => {
    setExplorerBody(getDefaultBody(explorerEndpoint));
    if (explorerEndpoint === "/v1/customers" || explorerEndpoint === "/v1/virtual-accounts" || explorerEndpoint === "/v1/wallets" || explorerEndpoint === "/v1/payments" || explorerEndpoint === "/v1/conversions") {
      setExplorerMethod("POST");
    } else {
      setExplorerMethod("GET");
    }
  }, [explorerEndpoint]);

  const handleRunExplorer = async () => {
    setExplorerLoading(true);
    setExplorerResponse(null);

    const activeKey = apiKeys.find(k => k.is_active)?.api_key_prefix + "••••••••";
    setExplorerHeaders({
      "Authorization": `Bearer ${activeKey}`,
      "Content-Type": "application/json",
      "X-Sandbox-Mode": "true"
    });

    try {
      let parsedBody = {};
      if (explorerMethod === "POST" && explorerBody.trim()) {
        parsedBody = JSON.parse(explorerBody);
      }

      const res = await serverExecuteSandboxApi({
        data: {
          method: explorerMethod,
          endpoint: explorerEndpoint,
          body: parsedBody
        }
      });

      setExplorerResponse(res);
      await fetchData();
    } catch (err: any) {
      setExplorerResponse({
        error: {
          code: "sandbox_execution_failed",
          message: err.message || "Failed to process API call."
        }
      });
    } finally {
      setExplorerLoading(false);
    }
  };

  // Helper selectors to dynamically aggregate resources from API logs!
  const getCreatedCustomers = () => {
    return logs
      .filter(l => l.event_type === "api.log:POST /v1/customers" && l.payload?.response?.id)
      .map(l => l.payload.response);
  };

  const getCreatedAccounts = () => {
    return logs
      .filter(l => l.event_type === "api.log:POST /v1/virtual-accounts" && l.payload?.response?.id)
      .map(l => l.payload.response);
  };

  const getCreatedWallets = () => {
    return logs
      .filter(l => l.event_type === "api.log:POST /v1/wallets" && l.payload?.response?.id)
      .map(l => l.payload.response);
  };

  const getCreatedPayments = () => {
    return logs
      .filter(l => (l.event_type === "api.log:POST /v1/payments" || l.event_type === "api.log:POST /v1/payouts") && l.payload?.response?.id)
      .map(l => l.payload.response);
  };

  const getStats = () => {
    const todayLogs = logs.filter(l => {
      const logDate = new Date(l.created_at);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    });

    const successLogs = todayLogs.filter(l => l.status === "200");
    const successRate = todayLogs.length > 0 ? Math.round((successLogs.length / todayLogs.length) * 100) : 100;
    const lastActivity = logs.length > 0 ? new Date(logs[0].created_at).toLocaleTimeString() : "No activity";

    return {
      requestsCount: todayLogs.length,
      successRate,
      lastActivity
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-mono select-none">
        <RefreshCw className="size-8 animate-spin text-[#1677FF] border-2 border-black p-1 mb-2" />
        <span className="font-bold">LOADING WORKSPACE...</span>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none">
      
      {/* Top Banner Header */}
      <header className="border-b-4 border-black flex justify-between items-center px-6 py-4 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-black text-xl uppercase tracking-tighter">
            GlobalPay
          </Link>
          <span className="bg-[#1677FF] text-white px-2 py-0.5 font-mono text-xs font-bold border-2 border-black tracking-wider uppercase">
            Sandbox
          </span>
          <span className="bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 font-mono text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
            API Operational
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold hidden md:inline">
            Logged in: <span className="text-[#1677FF]">{user?.email}</span>
          </span>
          <button 
            onClick={handleLogout}
            className="border-2 border-black px-3 py-1 font-bold text-xs uppercase flex items-center gap-1.5 hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000000]"
          >
            <LogOut className="size-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[250px_1fr] divide-y-4 lg:divide-y-0 lg:divide-x-4 divide-black">
        
        {/* Left Console Navigation */}
        <aside className="py-4 lg:py-8 px-4 space-y-4 lg:space-y-6 flex flex-col">
          <div className="space-y-1">
            <h4 className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#1677FF] px-2 mb-2 border-b-2 border-black pb-1 lg:block hidden">
              Menu
            </h4>
            <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {[
                { id: "overview", label: "Overview", icon: Activity },
                { id: "api-keys", label: "API Keys", icon: Key },
                { id: "api-explorer", label: "API Explorer", icon: Terminal },
                { id: "customers", label: "Test Customers", icon: Users },
                { id: "accounts", label: "Accounts", icon: CreditCard },
                { id: "wallets", label: "Wallets", icon: Wallet },
                { id: "transactions", label: "Transactions", icon: ArrowUpDown },
                { id: "webhooks", label: "Webhooks", icon: Globe },
                { id: "logs", label: "API Logs", icon: Layers }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`whitespace-nowrap w-auto lg:w-full text-left px-3 py-2 font-mono text-xs sm:text-sm border-2 transition-all font-bold flex items-center gap-2.5 shrink-0 ${
                      activeTab === tab.id
                        ? "bg-[#1677FF] text-white border-black shadow-[2px_2px_0px_0px_#000]"
                        : "border-transparent hover:border-black hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 lg:pt-6 border-t-2 lg:border-t-2 border-black">
            <Link
              to="/developers"
              className="w-full border-2 border-black hover:bg-gray-100 py-2.5 px-3 font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <BookOpen className="size-4" />
              API Documentation
            </Link>
          </div>
        </aside>

        {/* Right Dashboard Workspace */}
        <main className="p-8 lg:p-10 space-y-8 bg-white overflow-y-auto">
          
          {dashboardError && (
            <div className="p-4 bg-red-50 border-4 border-black shadow-[4px_4px_0px_0px_#000] flex items-start gap-3">
              <AlertCircle className="size-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 uppercase text-sm">Dashboard Error</h4>
                <p className="text-xs text-red-800 font-semibold mt-1">{dashboardError}</p>
                <button 
                  onClick={() => setDashboardError(null)}
                  className="mt-2 bg-white border-2 border-black px-2.5 py-0.5 text-[10px] font-bold uppercase shadow-[1px_1px_0px_0px_#000]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">WORKSPACE OVERVIEW</h2>
                <p className="text-sm font-semibold text-gray-500">Monitor your sandbox queries and simulated resources.</p>
              </div>

              {/* Metric grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="font-mono text-xs font-bold uppercase text-[#1677FF]">Environment</span>
                  <div className="text-2xl font-black uppercase mt-1">SANDBOX</div>
                </div>
                <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="font-mono text-xs font-bold uppercase text-[#1677FF]">Requests Today</span>
                  <div className="text-3xl font-black mt-1">{stats.requestsCount}</div>
                </div>
                <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="font-mono text-xs font-bold uppercase text-[#1677FF]">Success Rate</span>
                  <div className="text-3xl font-black mt-1">{stats.successRate}%</div>
                </div>
                <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="font-mono text-xs font-bold uppercase text-[#1677FF]">Last Activity</span>
                  <div className="text-lg font-black uppercase mt-1.5">{stats.lastActivity}</div>
                </div>
              </div>

              {/* Checklist */}
              <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <h3 className="font-black uppercase text-lg border-b-2 border-black pb-2">SANDBOX INITIALIZATION CHECKLIST</h3>
                <div className="space-y-3 font-semibold">
                  <div className="flex items-center gap-3">
                    <span className={`size-5 border-2 border-black flex items-center justify-center ${apiKeys.length > 0 ? "bg-green-400" : "bg-gray-100"}`}>
                      {apiKeys.length > 0 && <Check className="size-3.5 text-black stroke-[3px]" />}
                    </span>
                    <span className={apiKeys.length > 0 ? "line-through text-gray-500" : ""}>Generate your sandbox API credentials</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`size-5 border-2 border-black flex items-center justify-center ${logs.length > 0 ? "bg-green-400" : "bg-gray-100"}`}>
                      {logs.length > 0 && <Check className="size-3.5 text-black stroke-[3px]" />}
                    </span>
                    <span className={logs.length > 0 ? "line-through text-gray-500" : ""}>Execute a simulated API request in the API Explorer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`size-5 border-2 border-black flex items-center justify-center ${logs.filter(l => l.event_type.includes("POST /v1/virtual-accounts")).length > 0 ? "bg-green-400" : "bg-gray-100"}`}>
                      {logs.filter(l => l.event_type.includes("POST /v1/virtual-accounts")).length > 0 && <Check className="size-3.5 text-black stroke-[3px]" />}
                    </span>
                    <span className={logs.filter(l => l.event_type.includes("POST /v1/virtual-accounts")).length > 0 ? "line-through text-gray-500" : ""}>Allocate a virtual collections account via API</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API KEYS TAB */}
          {activeTab === "api-keys" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">API CREDENTIALS</h2>
                <p className="text-sm font-semibold text-gray-500">Generate developer keys to authorize your local codebase integrations.</p>
              </div>

              {/* Create Key Form */}
              <div className="border-4 border-black p-6 bg-white shadow-[4px_4px_0px_0px_#000] max-w-xl">
                <h3 className="font-bold text-sm font-mono uppercase tracking-wider mb-4 border-b border-black pb-2">Generate Sandbox Key</h3>
                <form onSubmit={handleCreateKey} className="flex gap-4">
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Local Server Key"
                    className="flex-1 bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1677FF] text-white font-bold border-2 border-black px-4 py-2 text-xs uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] flex items-center gap-1.5"
                  >
                    <Plus className="size-4" />
                    Create Key
                  </button>
                </form>
              </div>

              {/* Newly Created Key Alert */}
              {newlyCreatedKey && (
                <div className="border-4 border-red-500 p-6 bg-red-50 shadow-[4px_4px_0px_0px_#000] space-y-3 max-w-xl">
                  <h4 className="font-black text-red-900 uppercase text-xs tracking-wider">⚠️ API Key Generated - Save It Now!</h4>
                  <p className="text-xs text-red-950 font-semibold leading-relaxed">
                    This secret key will be shown **only once**. Copy it immediately and save it securely.
                  </p>
                  <div className="flex border-2 border-black bg-white select-all font-mono text-sm px-3 py-2 justify-between items-center">
                    <span className="truncate pr-4">{newlyCreatedKey}</span>
                    <button 
                      onClick={() => handleCopy(newlyCreatedKey, "newKey")}
                      className="text-xs font-bold uppercase tracking-wider border-l border-black pl-3 text-[#1677FF] hover:underline"
                    >
                      {copiedText === "newKey" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <button 
                    onClick={() => setNewlyCreatedKey(null)}
                    className="bg-white border-2 border-black px-4 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000]"
                  >
                    Done / Saved
                  </button>
                </div>
              )}

              {/* Keys List */}
              <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                      <th className="p-4 border-r border-black">Key Description</th>
                      <th className="p-4 border-r border-black">Prefix</th>
                      <th className="p-4 border-r border-black">Created At</th>
                      <th className="p-4 border-r border-black">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-semibold text-sm">
                    {apiKeys.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">
                          No active API keys. Generate one above to begin.
                        </td>
                      </tr>
                    ) : (
                      apiKeys.map((k) => (
                        <tr key={k.id}>
                          <td className="p-4 border-r border-black font-mono text-xs">{k.name}</td>
                          <td className="p-4 border-r border-black font-mono text-xs text-gray-600">{k.api_key_prefix}••••••••</td>
                          <td className="p-4 border-r border-black text-xs text-gray-600">
                            {new Date(k.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 border-r border-black">
                            <span className={`px-2 py-0.5 text-xs font-bold border ${
                              k.is_active 
                                ? "bg-green-100 text-green-800 border-green-300" 
                                : "bg-red-100 text-red-800 border-red-300"
                            }`}>
                              {k.is_active ? "Active" : "Revoked"}
                            </span>
                          </td>
                          <td className="p-4">
                            {k.is_active && (
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                className="text-red-600 hover:text-red-800 font-bold text-xs uppercase flex items-center gap-1"
                              >
                                <Trash className="size-3.5" />
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* API EXPLORER TAB */}
          {activeTab === "api-explorer" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">API EXPLORER</h2>
                <p className="text-sm font-semibold text-gray-500">Test GlobalPay REST endpoints interactively without leaving your browser.</p>
              </div>

              <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
                {/* Inputs Pane */}
                <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_#000] space-y-6">
                  
                  {/* Select Endpoint */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider">Select API Endpoint</label>
                    <select
                      value={explorerEndpoint}
                      onChange={(e) => setExplorerEndpoint(e.target.value)}
                      className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF]"
                    >
                      <option value="/v1/customers">POST /v1/customers (Create Client Customer)</option>
                      <option value="/v1/virtual-accounts">POST /v1/virtual-accounts (Create Collections Account)</option>
                      <option value="/v1/wallets">POST /v1/wallets (Create Wallet)</option>
                      <option value="/v1/payments">POST /v1/payments (Initiate Payout)</option>
                      <option value="/v1/conversions">POST /v1/conversions (FX conversion / trade)</option>
                    </select>
                  </div>

                  {/* Headers Visual Panel */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider">Request Headers</label>
                    <div className="bg-gray-100 border-2 border-black p-4 font-mono text-[11px] space-y-1 select-all">
                      <div><strong>Authorization:</strong> Bearer {apiKeys.find(k => k.is_active)?.api_key_prefix || "gph_test_"}••••••••</div>
                      <div><strong>Content-Type:</strong> application/json</div>
                      <div><strong>X-Sandbox-Mode:</strong> true</div>
                    </div>
                  </div>

                  {/* Body Textarea */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider">JSON Request Payload</label>
                    <textarea
                      rows={8}
                      value={explorerBody}
                      onChange={(e) => setExplorerBody(e.target.value)}
                      className="w-full bg-white border-2 border-black p-3 text-sm font-mono outline-none focus:border-[#1677FF] placeholder:text-gray-400 leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={handleRunExplorer}
                    disabled={explorerLoading || apiKeys.length === 0}
                    className="w-full bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-black uppercase text-sm border-2 border-black py-3 px-4 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Play className="size-4 fill-white" />
                    {explorerLoading ? "EXECUTING SIMULATED CALL..." : "SEND TEST REQUEST"}
                  </button>
                  {apiKeys.length === 0 && (
                    <p className="text-[10px] text-red-600 font-mono font-bold text-center">
                      * You must generate an API Key first before testing queries.
                    </p>
                  )}
                </div>

                {/* Outputs Panel */}
                <div className="space-y-6">
                  {/* Headers */}
                  {explorerHeaders['Authorization'] && (
                    <div className="border-4 border-black p-4 bg-gray-50 shadow-[4px_4px_0px_0px_#000] space-y-2">
                      <span className="font-mono text-xs font-bold text-gray-500 uppercase">Response Headers</span>
                      <div className="font-mono text-[11.5px] text-gray-700 space-y-1">
                        <div><strong>Content-Type:</strong> application/json; charset=utf-8</div>
                        <div><strong>Status:</strong> 200 OK</div>
                        <div><strong>X-Response-Latency:</strong> {Math.floor(40 + Math.random() * 80)}ms</div>
                        <div><strong>Cache-Control:</strong> no-store</div>
                      </div>
                    </div>
                  )}

                  {/* Terminal block */}
                  <div className="border-4 border-black bg-black text-white p-6 shadow-[6px_6px_0px_0px_#1677FF] font-mono text-xs relative min-h-[300px]">
                    <div className="absolute top-2 right-3 flex gap-1.5">
                      <span className="size-2 bg-red-500 rounded-full"></span>
                      <span className="size-2 bg-yellow-500 rounded-full"></span>
                      <span className="size-2 bg-green-500 rounded-full"></span>
                    </div>
                    <div className="border-b border-gray-800 pb-2 mb-4 text-gray-400 flex items-center gap-2">
                      <Terminal className="size-4" />
                      <span>Console output</span>
                    </div>
                    {explorerLoading ? (
                      <div className="flex flex-col items-center justify-center h-48 space-y-2 text-gray-400">
                        <RefreshCw className="size-6 animate-spin text-[#1677FF]" />
                        <span>Sending payload to backend...</span>
                      </div>
                    ) : explorerResponse ? (
                      <pre className="overflow-x-auto leading-relaxed text-gray-200 select-all">
                        {JSON.stringify(explorerResponse, null, 2)}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-gray-500">
                        Response payload will be displayed here...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === "customers" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">TEST CUSTOMERS</h2>
                <p className="text-sm font-semibold text-gray-500">List of client sub-profiles provisioned under your sandbox environment.</p>
              </div>

              <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                      <th className="p-4 border-r border-black">Customer ID</th>
                      <th className="p-4 border-r border-black">Full Name</th>
                      <th className="p-4 border-r border-black">Email</th>
                      <th className="p-4 border-r border-black">City / Country</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-semibold text-sm">
                    {getCreatedCustomers().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 font-mono">
                          No customer profiles found. Try executing `POST /v1/customers` in the API Explorer.
                        </td>
                      </tr>
                    ) : (
                      getCreatedCustomers().map((c, i) => (
                        <tr key={c.id + i}>
                          <td className="p-4 border-r border-black font-mono text-xs text-[#1677FF]">{c.id}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{c.name}</td>
                          <td className="p-4 border-r border-black text-xs">{c.email}</td>
                          <td className="p-4 border-r border-black text-xs">
                            {c.address?.city || "N/A"}, {c.address?.country || "US"}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-xs font-bold border bg-green-100 text-green-800 border-green-300">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === "accounts" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">VIRTUAL ACCOUNTS</h2>
                <p className="text-sm font-semibold text-gray-500">Virtual local collection routing coordinates mapped to client sub-profiles.</p>
              </div>

              <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                      <th className="p-4 border-r border-black">Account ID</th>
                      <th className="p-4 border-r border-black">Linked Customer ID</th>
                      <th className="p-4 border-r border-black">Bank Name</th>
                      <th className="p-4 border-r border-black">Account Number</th>
                      <th className="p-4 border-r border-black">Routing Number</th>
                      <th className="p-4 border-r border-black">Currency</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-semibold text-sm">
                    {getCreatedAccounts().length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500 font-mono">
                          No virtual collection accounts found. Try executing `POST /v1/virtual-accounts` in the API Explorer.
                        </td>
                      </tr>
                    ) : (
                      getCreatedAccounts().map((a, i) => (
                        <tr key={a.id + i}>
                          <td className="p-4 border-r border-black font-mono text-xs text-[#1677FF]">{a.id}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{a.customer_id}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{a.bank_name}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{a.account_number}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{a.routing_number}</td>
                          <td className="p-4 border-r border-black font-mono text-xs font-black">{a.currency}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-xs font-bold border bg-green-100 text-green-800 border-green-300">
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* WALLETS TAB */}
          {activeTab === "wallets" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">TEST WALLETS</h2>
                <p className="text-sm font-semibold text-gray-500">Virtual balance ledger wallets generated for sandbox users.</p>
              </div>

              <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                      <th className="p-4 border-r border-black">Wallet ID</th>
                      <th className="p-4 border-r border-black">Type</th>
                      <th className="p-4 border-r border-black">Currency / Asset</th>
                      <th className="p-4 border-r border-black">Deposit Coordinates</th>
                      <th className="p-4 border-r border-black">Balance</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-semibold text-sm">
                    {getCreatedWallets().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                          No active wallets found. Try executing `POST /v1/wallets` in the API Explorer.
                        </td>
                      </tr>
                    ) : (
                      getCreatedWallets().map((w, i) => (
                        <tr key={w.id + i}>
                          <td className="p-4 border-r border-black font-mono text-xs text-[#1677FF]">{w.id}</td>
                          <td className="p-4 border-r border-black font-mono text-xs uppercase">{w.type}</td>
                          <td className="p-4 border-r border-black font-mono text-xs font-black">{w.currency}</td>
                          <td className="p-4 border-r border-black font-mono text-xs truncate max-w-xs">{w.deposit_address || "N/A (Fiat Balance)"}</td>
                          <td className="p-4 border-r border-black font-mono text-xs font-black text-green-700">{w.balance?.toFixed(2)} {w.currency}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-xs font-bold border bg-green-100 text-green-800 border-green-300">
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === "transactions" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">TEST PAYMENTS & PAYOUTS</h2>
                <p className="text-sm font-semibold text-gray-500">Record of simulated payments and ledger transfers executed in Sandbox.</p>
              </div>

              <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                      <th className="p-4 border-r border-black">Transaction ID</th>
                      <th className="p-4 border-r border-black">Destination Account/Beneficiary</th>
                      <th className="p-4 border-r border-black">Amount</th>
                      <th className="p-4 border-r border-black">Reference ID</th>
                      <th className="p-4 border-r border-black">Date</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-semibold text-sm">
                    {getCreatedPayments().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                          No simulated transactions found. Try executing `POST /v1/payments` in the API Explorer.
                        </td>
                      </tr>
                    ) : (
                      getCreatedPayments().map((p, i) => (
                        <tr key={p.id + i}>
                          <td className="p-4 border-r border-black font-mono text-xs text-[#1677FF]">{p.id}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{p.destination}</td>
                          <td className="p-4 border-r border-black font-mono text-xs font-black text-red-600">-{p.amount?.toFixed(2)} {p.currency}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{p.reference}</td>
                          <td className="p-4 border-r border-black text-xs text-gray-600">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-xs font-bold border bg-green-100 text-green-800 border-green-300">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* WEBHOOKS TAB */}
          {activeTab === "webhooks" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">WEBHOOK SIMULATOR</h2>
                <p className="text-sm font-semibold text-gray-500">Send simulated payment webhook events to your backend listener to test transaction state machines.</p>
              </div>

              {/* Webhook simulator block */}
              <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_#000] max-w-2xl space-y-4">
                <h3 className="font-bold text-sm font-mono uppercase tracking-wider border-b border-black pb-2">Simulate Incoming Credit Notification</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-100 border-2 border-black font-mono text-xs">
                    POST https://api.sandbox.globalpay.io/api/webhooks/banking-circle
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider">Destination Account (Virtual)</label>
                      <input 
                        type="text" 
                        defaultValue="BC987654321" 
                        id="sim-acc"
                        className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-mono outline-none focus:border-[#1677FF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider">Amount (USD)</label>
                      <input 
                        type="number" 
                        defaultValue={250.00} 
                        id="sim-amount"
                        className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-mono outline-none focus:border-[#1677FF]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      const accVal = (document.getElementById("sim-acc") as HTMLInputElement).value;
                      const amountVal = Number((document.getElementById("sim-amount") as HTMLInputElement).value);
                      try {
                        await serverTriggerWebhook({ data: { accountNumber: accVal, amount: amountVal } });
                        alert("✅ Webhook event triggered successfully! Check 'API Logs' or 'Webhooks' log tab.");
                        await fetchData();
                      } catch (err: any) {
                        alert("❌ Failed to insert webhook event: " + err.message);
                      }
                    }}
                    className="bg-[#1677FF] text-white font-black uppercase text-xs border-2 border-black py-2.5 px-4 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all flex items-center gap-1.5"
                  >
                    <Globe className="size-4" />
                    Trigger Incoming Webhook
                  </button>
                </div>
              </div>

              {/* Webhooks History */}
              <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                      <th className="p-4 border-r border-black">Event ID</th>
                      <th className="p-4 border-r border-black">Event Type</th>
                      <th className="p-4 border-r border-black">Target Endpoint</th>
                      <th className="p-4 border-r border-black">Reference ID</th>
                      <th className="p-4 border-r border-black">Webhook Status</th>
                      <th className="p-4">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-semibold text-sm">
                    {logs.filter(l => !l.event_type.startsWith("api.log:")).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                          No webhook events triggered yet. Trigger one using the simulator above.
                        </td>
                      </tr>
                    ) : (
                      logs.filter(l => !l.event_type.startsWith("api.log:")).map((l) => (
                        <tr key={l.id}>
                          <td className="p-4 border-r border-black font-mono text-xs text-[#1677FF]">{l.id}</td>
                          <td className="p-4 border-r border-black font-mono text-xs font-black">{l.event_type}</td>
                          <td className="p-4 border-r border-black font-mono text-xs text-gray-600">{l.endpoint_url}</td>
                          <td className="p-4 border-r border-black font-mono text-xs">{l.payload?.reference || "N/A"}</td>
                          <td className="p-4 border-r border-black">
                            <span className={`px-2 py-0.5 text-xs font-bold border ${
                              l.status === "pending" || l.status === "completed" || l.status === "200"
                                ? "bg-green-100 text-green-800 border-green-300" 
                                : "bg-red-100 text-red-800 border-red-300"
                            }`}>
                              {l.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-gray-600">
                            {new Date(l.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* API LOGS TAB */}
          {activeTab === "logs" && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase">API REQUEST LOGS</h2>
                <p className="text-sm font-semibold text-gray-500">Inspect raw HTTP requests and response payloads submitted via your API keys.</p>
              </div>

              <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
                {/* List Table */}
                <div className="border-4 border-black shadow-[6px_6px_0px_0px_#000] overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-black text-xs font-mono font-bold uppercase">
                        <th className="p-4 border-r border-black">Method & Path</th>
                        <th className="p-4 border-r border-black">Status</th>
                        <th className="p-4 border-r border-black">Latency</th>
                        <th className="p-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-semibold text-sm">
                      {logs.filter(l => l.event_type.startsWith("api.log:")).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500 font-mono">
                            No requests found. Interact with the API Explorer to submit mock endpoints.
                          </td>
                        </tr>
                      ) : (
                        logs.filter(l => l.event_type.startsWith("api.log:")).map((l) => {
                          const route = l.event_type.replace("api.log:", "");
                          const [method, path] = route.split(" ");
                          return (
                            <tr 
                              key={l.id} 
                              onClick={() => setSelectedLog(l)}
                              className={`cursor-pointer transition-colors ${
                                selectedLog?.id === l.id ? "bg-[#1677FF]/10" : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="p-4 border-r border-black font-mono text-xs flex items-center gap-2">
                                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                                  method === "POST" ? "bg-blue-100 text-blue-800 border-blue-300" : "bg-green-100 text-green-800 border-green-300"
                                }`}>
                                  {method}
                                </span>
                                <span className="font-bold">{path}</span>
                              </td>
                              <td className="p-4 border-r border-black font-mono text-xs">
                                <span className="text-green-700 font-bold">{l.status} OK</span>
                              </td>
                              <td className="p-4 border-r border-black font-mono text-xs text-gray-600">
                                {l.attempts}ms
                              </td>
                              <td className="p-4 text-xs text-gray-500">
                                {new Date(l.created_at).toLocaleTimeString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Inspect Details Pane */}
                <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_#000] min-h-[400px] space-y-6">
                  <h3 className="font-bold text-sm font-mono uppercase tracking-wider border-b border-black pb-2">Log Inspector</h3>
                  {selectedLog ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-xs border-b border-black pb-4 font-mono">
                        <div>
                          <div className="text-gray-500 font-bold uppercase">Request Method</div>
                          <div className="font-black text-sm uppercase mt-1">{selectedLog.event_type.split(" ")[0].replace("api.log:", "")}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 font-bold uppercase">Endpoint Path</div>
                          <div className="font-black text-sm mt-1">{selectedLog.event_type.split(" ")[1]}</div>
                        </div>
                      </div>

                      {/* Request Payload */}
                      <div className="space-y-2">
                        <span className="font-mono text-xs font-bold text-gray-500 uppercase">Request Body</span>
                        <pre className="bg-gray-100 border-2 border-black p-4 font-mono text-xs text-gray-800 overflow-x-auto leading-relaxed max-h-48">
                          {JSON.stringify(selectedLog.payload?.request, null, 2)}
                        </pre>
                      </div>

                      {/* Response Payload */}
                      <div className="space-y-2">
                        <span className="font-mono text-xs font-bold text-gray-500 uppercase">Response Body</span>
                        <pre className="bg-black border-4 border-black p-4 font-mono text-xs text-green-400 overflow-x-auto leading-relaxed max-h-48">
                          {JSON.stringify(selectedLog.payload?.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500 font-mono text-xs text-center p-4">
                      Select an API request log from the list on the left to inspect HTTP request/response payloads in detail.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
