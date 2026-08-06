import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-secondary/30">
      <DashboardSidebar />
      <div className="lg:pl-[264px]">
        <main className="mx-auto w-full max-w-6xl px-5 py-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
