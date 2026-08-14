import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, TerminalSquare } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useSession } from "@/hooks/use-session";

const NAV = [
  { label: "Products", to: "/products" },
  { label: "Solutions", to: "/solutions" },
  { label: "Developers", to: "/developers" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white select-none">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-2 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-[#1677FF] text-white border-2 border-black shadow-[2px_2px_0px_0px_#000]" }}
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border-2 border-transparent hover:border-black hover:bg-gray-50 text-gray-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <Link 
              to="/dashboard"
              className="bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-xs border-2 border-black py-2.5 px-6 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login"
                className="bg-white hover:bg-gray-50 text-black font-extrabold uppercase text-xs border-2 border-black py-2.5 px-6 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
              >
                Login
              </Link>
              <Link 
                to="/signup"
                className="bg-[#1677FF] hover:bg-[#1677FF]/90 text-white font-extrabold uppercase text-xs border-2 border-black py-2.5 px-6 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center border-2 border-black hover:bg-gray-50 lg:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t-4 border-black bg-white px-5 py-4 lg:hidden space-y-4">
          <div className="flex flex-col gap-1.5">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider border-2 border-transparent hover:border-black hover:bg-gray-50 text-gray-800"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t-2 border-black">
            {session ? (
              <Link 
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="w-full bg-[#1677FF] text-white font-extrabold uppercase text-xs border-2 border-black py-2.5 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full bg-white text-black font-extrabold uppercase text-xs border-2 border-black py-2.5 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="w-full bg-[#1677FF] text-white font-extrabold uppercase text-xs border-2 border-black py-2.5 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
