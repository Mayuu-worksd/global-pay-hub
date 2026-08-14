import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sandbox")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const isAuthPage = location.pathname.includes("/login") || location.pathname.includes("/signup");
    
    // Check user auth status
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!isAuthPage && !user) {
      throw redirect({ to: "/sandbox/login" });
    }

    return { user };
  },
  component: SandboxLayout,
});

function SandboxLayout() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#1677FF] selection:text-white">
      <Outlet />
    </div>
  );
}
