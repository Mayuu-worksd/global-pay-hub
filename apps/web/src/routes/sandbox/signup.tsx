import { useState } from "react";
import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/logo";
import { Terminal, Key, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/sandbox/signup")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      throw redirect({ to: "/sandbox" });
    }
  },
  component: SandboxSignupPage,
});

function SandboxSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign Up Supabase User
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Failed to create user record.");

      const user = authData.user;

      // 2. Perform post-registration profile update for sandbox instantly
      // We wait for the database trigger to insert the profile, then update it.
      let profileUpdated = false;
      for (let i = 0; i < 8; i++) {
        const { data: profileCheck } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileCheck) {
          const { error: profileErr } = await (supabase as any)
            .from("profiles")
            .update({
              full_name: name,
              role: "merchant" as any,
              kyc_completed: true,
              onboarding_completed: true,
              profile_completed: true,
            })
            .eq("id", user.id);

          if (!profileErr) {
            profileUpdated = true;
            break;
          }
        }
        // Wait 150ms before retrying
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      if (!profileUpdated) {
        throw new Error("Initialization timeout. Your profile is being created, please try logging in.");
      }

      // If they need to verify email, we let them know, but in sandbox, Supabase is usually configured
      // to auto-confirm or log in immediately.
      console.log("Onboarding completed for sandbox user:", user.id);
      navigate({ to: "/sandbox" });
    } catch (err: any) {
      setError(err.message || "Failed to register sandbox account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white grid-lines flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="w-full max-w-md bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000] relative">
        {/* Top Header line */}
        <div className="absolute top-0 left-0 right-0 bg-[#1677FF] h-3 border-b-4 border-black"></div>

        <div className="flex flex-col items-center space-y-2 mt-2 mb-8">
          <Logo />
          <span className="inline-block bg-black text-white px-2 py-0.5 font-mono text-[10px] font-bold border-2 border-black tracking-widest uppercase">
            Sandbox console
          </span>
        </div>

        <h2 className="text-2xl font-black uppercase text-center tracking-tight mb-2">
          CREATE SANDBOX ACCOUNT
        </h2>
        <p className="text-sm font-semibold text-[#1677FF] text-center mb-6">
          Access your isolated financial playground.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-black text-red-900 shadow-[2px_2px_0px_0px_#000000] flex items-start gap-2">
            <ShieldAlert className="size-5 shrink-0 text-red-700" />
            <div className="text-xs font-semibold">
              <strong>Registration Error:</strong> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider">
              Developer Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Smith"
              className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider">
              Work Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@company.com"
              className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider">
              Choose Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-black uppercase text-sm border-2 border-black py-3 px-4 shadow-[4px_4px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000000] transition-all disabled:opacity-50"
          >
            {loading ? "PROVISIONING..." : "CREATE WORKSPACE"}
          </button>
        </form>

        <div className="mt-8 border-t-2 border-black pt-4 text-center space-y-2 text-xs">
          <div>
            <span className="text-gray-500 font-semibold">Already have a sandbox? </span>
            <Link
              to="/sandbox/login"
              className="text-[#1677FF] hover:underline font-bold uppercase tracking-wide"
            >
              Sign In
            </Link>
          </div>
          <div>
            <Link
              to="/developers"
              className="text-gray-600 hover:text-black hover:underline font-mono text-[10px] uppercase flex items-center justify-center gap-1"
            >
              <Terminal className="size-3" />
              Back to Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
