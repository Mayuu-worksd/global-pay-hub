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
  ChevronRight,
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

// Bottom nav shows only the 5 most important items on mobile
const MOBILE_BOTTOM_NAV = [
  { label: "Home", to: "/dashboard", icon: LayoutDashboard },
  { label: "Wallets", to: "/wallets", icon: Wallet },
  { label: "Exchange", to: "/exchange", icon: Repeat },
  { label: "Send", to: "/send", icon: Send },
  { label: "More", to: null, icon: Menu },
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

  const userRole = profile?.role || "individual";

  const filteredNav = NAV.filter((item) => {
    if (userRole === "individual") {
      return ["/dashboard", "/wallets", "/exchange", "/send", "/receive", "/transactions", "/settings"].includes(item.to);
    }
    return true;
  });

  const sidebarContent = (
    <>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        {filteredNav.map((item) => {
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
              {active && <ChevronRight className="ml-auto size-3.5 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {(profile?.full_name ?? profile?.email ?? "G")[0]?.toUpperCase()}
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
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-5">
          <Logo />
        </div>
        {sidebarContent}
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {(profile?.full_name ?? profile?.email ?? "G")[0]?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {MOBILE_BOTTOM_NAV.map((item) => {
          if (item.to === null) {
            // "More" button opens full menu
            return (
              <button
                key="more"
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                {open
                  ? <X className="size-5 text-primary" />
                  : <Menu className="size-5 text-muted-foreground" />}
                <span className={cn("text-[10px] font-medium", open ? "text-primary" : "text-muted-foreground")}>
                  More
                </span>
              </button>
            );
          }
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex flex-col items-center gap-1 px-3 py-1"
            >
              <item.icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile full menu drawer (slides up from bottom nav) ── */}
      {open && (
        <div className="fixed inset-0 bottom-16 z-40 flex flex-col bg-sidebar lg:hidden overflow-y-auto">
          <div className="flex h-14 items-center border-b border-sidebar-border px-5">
            <Logo />
          </div>
          {sidebarContent}
        </div>
      )}

      {/* ── Bottom padding so content isn't hidden behind mobile nav ── */}
      <div className="h-16 lg:hidden" aria-hidden />
    </>
  );
}
