import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });

    // Redirect to role selection if they haven't chosen between Individual vs Merchant
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    const isChooseRolePage = location.pathname.includes("/choose-role");
    
    if (!isChooseRolePage) {
      if (!profile || !profile.role) {
        throw redirect({ to: "/choose-role" });
      }
    }

    return { user: data.user };
  },
  component: AuthenticatedLayout,
});


function AuthenticatedLayout() {
  const location = useLocation();
  const isChooseRolePage = location.pathname.includes("/choose-role");

  if (isChooseRolePage) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto flex w-full items-center justify-center px-4">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <DashboardSidebar />
      <div className="lg:pl-[264px]">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 lg:px-10 lg:py-10 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
