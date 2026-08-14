import { useState } from "react";
import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/logo";
import { Terminal, Key, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/sandbox/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      throw redirect({ to: "/sandbox" });
    }
  },
  component: SandboxLoginPage,
});

function SandboxLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) throw authErr;
      navigate({ to: "/sandbox" });
    } catch (err: any) {
      setError(err.message || "Failed to sign in.");
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
          DEVELOPER SIGN IN
        </h2>
        <p className="text-sm font-semibold text-[#1677FF] text-center mb-6">
          Access your isolated financial playground.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-black text-red-900 shadow-[2px_2px_0px_0px_#000000] flex items-start gap-2">
            <ShieldAlert className="size-5 shrink-0 text-red-700" />
            <div className="text-xs font-semibold">
              <strong>Sign In Error:</strong> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider">
              Work Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider">
              Secret Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border-2 border-black px-3 py-2 text-sm font-semibold outline-none focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/10 placeholder:text-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-black uppercase text-sm border-2 border-black py-3 px-4 shadow-[4px_4px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#000000] transition-all disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : "SIGN IN TO WORKSPACE"}
          </button>
        </form>

        <div className="mt-8 border-t-2 border-black pt-4 text-center space-y-2 text-xs">
          <div>
            <span className="text-gray-500 font-semibold">New to the sandbox? </span>
            <Link
              to="/sandbox/signup"
              className="text-[#1677FF] hover:underline font-bold uppercase tracking-wide"
            >
              Create Account
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
