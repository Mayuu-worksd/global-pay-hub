import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Terminal, Check, Globe, Shield, TerminalSquare, Key, Search, UserPlus, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "Developer Docs & API Reference | GlobalPay Hub" },
      {
        name: "description",
        content: "Complete API reference, local account provisioning, and webhooks documentation for GlobalPay.",
      },
    ],
  }),
  component: DevelopersPage,
});

type SubSection = {
  title: string;
  anchor: string;
};

type DocPage = {
  id: string;
  title: string;
  category: string;
  method?: "GET" | "POST";
  path?: string;
  content: React.ReactNode;
  toc: SubSection[];
  codeSample?: {
    request: string;
    response: string;
  };
};

function DevelopersPage() {
  const [activePageId, setActivePageId] = useState("getting-started");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const PAGES: DocPage[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      category: "DOCUMENTATION",
      toc: [
        { title: "Sandbox Access", anchor: "sandbox-access" },
        { title: "1. Create Sandbox Account", anchor: "step-1" },
        { title: "2. Generate API Credentials", anchor: "step-2" },
        { title: "3. Run Your First Query", anchor: "step-3" }
      ],
      content: (
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-gray-700">
            GlobalPay delivers enterprise payments and banking services internationally. The modular platform enables businesses to consume services directly or integrate them within their customer offering.
          </p>
          <p className="text-base leading-relaxed text-gray-700">
            A single API integration into the platform enables businesses to customize their payments and banking modules to launch a lean and secure operation.
          </p>

          <h3 id="sandbox-access" className="text-xl font-bold uppercase tracking-tight border-b-2 border-black pb-1 pt-4">
            Sandbox Access
          </h3>
          <p className="text-sm leading-relaxed text-gray-600">
            Sign up for a Sandbox account and start exploring our REST API. The sandbox environment provides a safe space to test and integrate without impacting live data.
          </p>
          <div className="p-4 bg-[#1677FF]/5 border-2 border-black shadow-[2px_2px_0px_0px_#000] space-y-2">
            <span className="font-mono text-xs font-bold text-[#1677FF] uppercase">Sandbox URL:</span>
            <a href="/sandbox/signup" className="block font-mono text-sm text-[#1677FF] underline hover:text-[#1677FF]/80">
              https://sandbox.globalpay.io/
            </a>
          </div>

          <h4 id="step-1" className="text-md font-bold uppercase pt-3">
            1. Sign up or log in directly
          </h4>
          <p className="text-sm text-gray-600">
            Click the <strong className="text-black">Create Sandbox Account</strong> CTA or sign in to register a dedicated developer workspace.
          </p>

          {/* Simple Brutalist Diagram Visual */}
          <div className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] grid md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2 text-xs">
              <div className="font-bold border-b-2 border-black pb-1 uppercase">Sandbox Sign In</div>
              <div className="bg-gray-100 p-2 border border-black font-mono">Email: dev@company.com</div>
              <div className="bg-gray-100 p-2 border border-black font-mono">Password: •••••••••</div>
              <div className="bg-[#1677FF] text-white p-2 border border-black font-bold uppercase text-center">Sign In</div>
            </div>
            <div className="p-4 border-2 border-black bg-gray-50 flex flex-col items-center justify-center text-center">
              <Wallet className="size-8 text-[#1677FF] mb-2" />
              <span className="font-bold text-xs uppercase">Workspace balance</span>
              <span className="text-xl font-black mt-1">$247,653.55</span>
              <span className="text-[10px] text-green-700 font-bold uppercase mt-1">Simulated assets</span>
            </div>
          </div>

          <h4 id="step-2" className="text-md font-bold uppercase pt-3">
            2. Get Integration Information
          </h4>
          <p className="text-sm text-gray-600">
            Navigate to the <strong>API Keys</strong> tab in the developer console to generate your credentials. You will receive a unique sandbox token prefixed with <code className="font-mono bg-gray-100 px-1 py-0.5 text-xs">gph_test_</code>.
          </p>

          <h4 id="step-3" className="text-md font-bold uppercase pt-3">
            3. Try using the Client Info and App Id
          </h4>
          <p className="text-sm text-gray-600">
            Execute the mock request displayed in the right-hand panel of this reference guide using your terminal client.
          </p>
        </div>
      ),
      codeSample: {
        request: `curl https://api.sandbox.globalpay.io/v1/status \\
  -H "Authorization: Bearer gph_test_your_secret_key"`,
        response: `{
  "status": "operational",
  "environment": "sandbox",
  "version": "v1.0.0"
}`
      }
    },
    {
      id: "api-overview",
      title: "API Overview",
      category: "DOCUMENTATION",
      toc: [
        { title: "REST Standard", anchor: "rest" },
        { title: "Idempotency", anchor: "idempotency" }
      ],
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-700">
            The GlobalPay API is a structured HTTP interface. All response payloads return standard JSON formats. We support CRUD operations on wallets, customers, and accounts.
          </p>
          <h3 id="rest" className="text-lg font-bold uppercase border-b-2 border-black pb-1 pt-4">REST Standard</h3>
          <p className="text-sm text-gray-600">
            Resource addresses are static and follow REST path patterns. We use custom HTTP status codes (200, 400, 401, 422, 500) to return errors and response states.
          </p>
          <h3 id="idempotency" className="text-lg font-bold uppercase border-b-2 border-black pb-1 pt-4">Idempotency</h3>
          <p className="text-sm text-gray-600">
            Pass an <code className="font-mono bg-gray-100 px-1 py-0.5 text-xs">Idempotency-Key</code> header to safely retry payouts and transactions without executing duplicate transfers.
          </p>
        </div>
      ),
      codeSample: {
        request: `GET https://api.sandbox.globalpay.io/v1/status`,
        response: `{
  "status": "operational",
  "server_time": "${new Date().toISOString()}"
}`
      }
    },
    {
      id: "auth-guide",
      title: "Authentication",
      category: "AUTHENTICATION",
      toc: [
        { title: "Authorization Headers", anchor: "auth-headers" }
      ],
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-gray-700">
            GlobalPay uses Bearer Token authentication. All requests submitted to the backend API must include your secret API key in the request headers.
          </p>
          <h3 id="auth-headers" className="text-lg font-bold uppercase border-b-2 border-black pb-1 pt-4">Authorization Headers</h3>
          <p className="text-sm text-gray-600">
            Configure the authorization request header as follows:
          </p>
          <pre className="p-3 bg-gray-100 border border-black font-mono text-xs text-gray-800">
            Authorization: Bearer gph_test_your_secret_key
          </pre>
        </div>
      ),
      codeSample: {
        request: `curl https://api.sandbox.globalpay.io/v1/wallets \\
  -H "Authorization: Bearer gph_test_api_key"`,
        response: `{
  "object": "list",
  "data": []
}`
      }
    },
    {
      id: "get-accounts",
      title: "Get Accounts",
      category: "WALLET API",
      method: "GET",
      path: "/v1/virtual-accounts",
      toc: [
        { title: "Retrieve Collection Accounts", anchor: "retrieve-accounts" }
      ],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Retrieve a paginated list of virtual banking collection accounts allocated under your merchant profile.
          </p>
          <h3 id="retrieve-accounts" className="text-lg font-bold uppercase border-b-2 border-black pb-1 pt-4">Query Parameters</h3>
          <p className="text-sm text-gray-600">
            Filter accounts by <code className="font-mono bg-gray-100 px-1 py-0.5 text-xs">currency</code> or <code className="font-mono bg-gray-100 px-1 py-0.5 text-xs">customer_id</code>.
          </p>
        </div>
      ),
      codeSample: {
        request: `GET https://api.sandbox.globalpay.io/v1/virtual-accounts?currency=USD`,
        response: `{
  "object": "list",
  "data": [
    {
      "id": "va_test_778811",
      "currency": "USD",
      "account_number": "1017766520",
      "routing_number": "812345678",
      "bank_name": "GlobalPay Test Bank",
      "status": "active"
    }
  ]
}`
      }
    },
    {
      id: "get-balances",
      title: "Get Balances",
      category: "WALLET API",
      method: "GET",
      path: "/v1/balances",
      toc: [
        { title: "Retrieve Wallet Balances", anchor: "retrieve-balances" }
      ],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Query the current and available balances across your active fiat wallets and digital asset custody addresses.
          </p>
          <h3 id="retrieve-balances" className="text-lg font-bold uppercase border-b-2 border-black pb-1 pt-4">Balance Payload Fields</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600">
            <li><strong>balance:</strong> The absolute ledger balance representing settled funds.</li>
            <li><strong>available_balance:</strong> Balance available for immediate payout/liquidation.</li>
          </ul>
        </div>
      ),
      codeSample: {
        request: `GET https://api.sandbox.globalpay.io/v1/balances`,
        response: `{
  "balances": [
    {
      "currency": "USD",
      "balance": 150000.00,
      "available_balance": 150000.00
    },
    {
      "currency": "USDT",
      "balance": 97653.55,
      "available_balance": 97653.55
    }
  ]
}`
      }
    },
    {
      id: "create-beneficiary",
      title: "Create Beneficiary",
      category: "BENEFICIARY API",
      method: "POST",
      path: "/v1/beneficiaries",
      toc: [
        { title: "Register Payout Destination", anchor: "register-destination" }
      ],
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            Create a beneficiary profile to save payout routing destination coordinates for bank transfers or crypto wallets.
          </p>
          <h3 id="register-destination" className="text-lg font-bold uppercase border-b-2 border-black pb-1 pt-4">Request Body Parameters</h3>
          <p className="text-sm text-gray-600">
            Provide the beneficiary name, country, currency, and destination coordinates (IBAN, account number, or blockchain address).
          </p>
        </div>
      ),
      codeSample: {
        request: `POST https://api.sandbox.globalpay.io/v1/beneficiaries
{
  "name": "Jane Doe Corp",
  "currency": "USD",
  "country": "US",
  "account_number": "1017680902",
  "routing_number": "812345678"
}`,
        response: `{
  "id": "bene_test_f89a2b",
  "name": "Jane Doe Corp",
  "currency": "USD",
  "status": "active"
}`
      }
    }
  ];

  const activePage = PAGES.find(p => p.id === activePageId) || PAGES[0]!;

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#1677FF] selection:text-white flex flex-col">
      <SiteHeader />

      {/* Blue Version / Sub-Header Bar */}
      <div className="bg-[#1677FF] text-white border-b-4 border-black px-6 py-2.5 flex flex-wrap justify-between items-center gap-4 z-40 select-none">
        <div className="flex items-center gap-3">
          <span className="bg-white text-black font-mono font-black text-xs px-2 py-0.5 border-2 border-black">
            v1.0
          </span>
          <button className="bg-black text-white font-mono text-xs font-bold px-3 py-1 border-2 border-white shadow-[2px_2px_0px_0px_#fff] flex items-center gap-1">
            <TerminalSquare className="size-3.5" />
            API Reference
          </button>
        </div>

        {/* Fake Search bar */}
        <div className="relative flex items-center max-w-xs w-full">
          <Search className="size-4 text-white/70 absolute left-3 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search documentation..."
            disabled
            className="w-full bg-white/10 border-2 border-white/40 pl-9 pr-14 py-1 text-xs font-semibold placeholder:text-white/60 outline-none cursor-not-allowed"
          />
          <span className="absolute right-2 font-mono text-[9px] bg-white/20 px-1 border border-white/30 rounded text-white/80">
            CTRL-K
          </span>
        </div>
      </div>

      {/* 3-Column Workspace Layout */}
      <div className="flex-1 grid lg:grid-cols-[280px_1fr_320px] divide-x-4 divide-black min-h-[calc(100vh-120px)]">
        
        {/* Left Column Sidebar */}
        <aside className="p-6 space-y-6 overflow-y-auto lg:sticky lg:top-28 lg:h-[calc(100vh-120px)] bg-white select-none">
          
          <div className="relative mb-6">
            <span className="absolute left-2.5 top-2.5 font-mono text-[9px] bg-gray-100 border border-gray-300 text-gray-500 px-1">
              CTRL-J
            </span>
            <input 
              type="text" 
              placeholder="JUMP TO"
              disabled
              className="w-full bg-white border-2 border-black py-1.5 pl-14 pr-3 text-xs font-mono font-bold outline-none cursor-not-allowed text-gray-400 placeholder:text-gray-400"
            />
          </div>

          {/* Group pages by category */}
          {Array.from(new Set(PAGES.map(p => p.category))).map((category) => (
            <div key={category} className="space-y-1.5">
              <h4 className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#1677FF] border-b-2 border-black pb-1 mb-2">
                {category}
              </h4>
              <nav className="flex flex-col gap-1">
                {PAGES.filter(p => p.category === category).map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setActivePageId(page.id)}
                    className={`w-full text-left px-2.5 py-1.5 font-mono text-xs border-2 transition-all font-bold flex items-center justify-between gap-2 ${
                      activePageId === page.id
                        ? "bg-[#1677FF] text-white border-black shadow-[2px_2px_0px_0px_#000]"
                        : "border-transparent hover:border-black hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <span className="truncate">{page.title}</span>
                    {page.method && (
                      <span className={`text-[8px] px-1 py-0.5 border border-black font-bold uppercase tracking-wider ${
                        page.method === "GET" 
                          ? "bg-emerald-500 text-white" 
                          : "bg-blue-500 text-white"
                      }`}>
                        {page.method}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        {/* Center Content Column */}
        <main className="p-8 lg:p-10 space-y-6 bg-white overflow-y-auto">
          <div className="border-b-2 border-black pb-4 space-y-2">
            <span className="font-mono text-xs font-bold text-gray-400 uppercase">Documentation</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold uppercase tracking-tight">
              {activePage.title}
            </h2>
            {activePage.path && (
              <div className="flex items-center gap-2 font-mono text-xs mt-2 border-2 border-black bg-gray-50 p-2.5 w-fit">
                <span className={`px-2 py-0.5 border border-black font-bold uppercase text-[9px] ${
                  activePage.method === "GET" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                }`}>
                  {activePage.method}
                </span>
                <span className="font-black text-black select-all">{activePage.path}</span>
              </div>
            )}
          </div>

          <div className="font-sans text-gray-800 leading-relaxed space-y-6">
            {activePage.content}
          </div>
        </main>

        {/* Right Column Sidebar */}
        <aside className="p-6 space-y-8 overflow-y-auto lg:sticky lg:top-28 lg:h-[calc(100vh-120px)] bg-gray-50 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Table of contents outline */}
            <div className="space-y-3">
              <h4 className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#1677FF] border-b-2 border-black pb-1">
                Table of Contents
              </h4>
              <ul className="space-y-2 font-mono text-xs font-bold text-gray-700">
                {activePage.toc.map((t, idx) => (
                  <li key={idx}>
                    <a href={`#${t.anchor}`} className="hover:text-[#1677FF] hover:underline flex items-center gap-1.5">
                      <span className="text-gray-400">{idx + 1}.</span>
                      {t.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Simulated request/response block */}
            {activePage.codeSample && (
              <div className="space-y-4">
                <h4 className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-black border-b-2 border-black pb-1">
                  API Code Sandbox
                </h4>
                
                {/* Request */}
                <div className="border-2 border-black bg-black text-white shadow-[3px_3px_0px_0px_#000]">
                  <div className="bg-gray-900 border-b border-black px-3 py-1 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>CURL Request</span>
                    <button
                      onClick={() => copyToClipboard(activePage.codeSample!.request, "req")}
                      className="hover:text-white"
                    >
                      {copied === "req" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto text-[10.5px] font-mono leading-relaxed text-gray-200">
                    {activePage.codeSample.request}
                  </pre>
                </div>

                {/* Response */}
                <div className="border-2 border-black bg-black text-white shadow-[3px_3px_0px_0px_#000]">
                  <div className="bg-gray-900 border-b border-black px-3 py-1 flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span>JSON Response</span>
                    <button
                      onClick={() => copyToClipboard(activePage.codeSample!.response, "res")}
                      className="hover:text-white"
                    >
                      {copied === "res" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto text-[10.5px] font-mono leading-relaxed text-gray-200">
                    {activePage.codeSample.response}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sandbox Signup Callout */}
          <div className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center space-y-2 mt-4">
            <h5 className="font-bold text-xs uppercase">Developer Console</h5>
            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
              Provision test keys and simulate payments inside the developer sandbox dashboard.
            </p>
            <Link
              to="/sandbox/signup"
              className="inline-block w-full bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-[10px] py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              Get Sandbox Keys
            </Link>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
