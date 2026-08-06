import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat,
  Send,
  Settings,
  QrCode,
  ReceiptText,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-account";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Wallets", to: "/wallets", icon: Wallet },
  { label: "Virtual Accounts", to: "/virtual-accounts", icon: Building2 },
  { label: "Deposits", to: "/deposits", icon: ArrowDownToLine },
  { label: "Withdrawals", to: "/withdrawals", icon: ArrowUpFromLine },
  { label: "Exchange", to: "/exchange", icon: Repeat },
  { label: "Send Money", to: "/send", icon: Send },
  { label: "Receive Money", to: "/receive", icon: QrCode },
  { label: "Transactions", to: "/transactions", icon: ReceiptText },
  { label: "Beneficiaries", to: "/beneficiaries", icon: Users },
  { label: "API Keys", to: "/api-keys", icon: KeyRound },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
          {(profile?.full_name ?? profile?.email ?? "N")[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {profile?.full_name ?? "Your account"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
        </div>
      </div>
      <Button variant="ghost" onClick={signOut} className="mt-1 w-full justify-start gap-3 rounded-xl px-3 text-muted-foreground">
        <LogOut className="size-4.5" />
        Sign out
      </Button>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo />
        </div>
        {nav}
        {footer}
      </aside>

      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-lg border border-border"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-sidebar lg:hidden">
          {nav}
          {footer}
        </div>
      )}
    </>
  );
}
