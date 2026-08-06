import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Products",
    links: [
      { label: "Fiat wallets", to: "/products" },
      { label: "Crypto wallets", to: "/products" },
      { label: "Virtual accounts", to: "/products" },
      { label: "Currency exchange", to: "/products" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Solutions", to: "/solutions" },
      { label: "Pricing", to: "/pricing" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API reference", to: "/developers" },
      { label: "Webhooks", to: "/developers" },
      { label: "Status", to: "/developers" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Nexus Pay is hybrid payment infrastructure for global businesses — fiat and digital
            asset wallets, local collection accounts, FX and payouts through one API.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Nexus Pay is a technology provider, not a bank. Banking services are provided by
            licensed partner institutions.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Nexus Pay. All rights reserved.</span>
          <span>Built for regulated, cross-border money movement.</span>
        </div>
      </div>
    </footer>
  );
}
