import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

const HIGHLIGHTS = [
  "Fiat and crypto wallets on one ledger",
  "USD & EUR virtual bank accounts",
  "Locked-rate currency exchange",
  "Payouts across 60+ corridors",
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-foreground p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 grid-lines opacity-20" aria-hidden />
        <div className="relative">
          <Logo invert />
        </div>
        <div className="relative">
          <h2 className="max-w-md font-display text-3xl font-bold leading-tight text-background">
            Global hybrid payment infrastructure for modern businesses.
          </h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-background/70">
                <span className="size-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-background/50">
          Nexus Pay is a technology provider, not a bank.
        </p>
      </div>

      <div className="flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-2xl font-bold text-foreground lg:mt-0">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          <p className="mt-10 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">
              ← Back to nexuspay.io
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
