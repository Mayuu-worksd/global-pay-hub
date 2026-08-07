import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, invert }: { className?: string; invert?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-primary shadow-glow">
        <span className="block size-3.5 rounded-[4px] bg-primary-foreground" />
        <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary-foreground/70" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-extrabold tracking-tight",
          invert ? "text-primary-foreground" : "text-foreground",
        )}
      >
        Global<span className="text-primary">Pay</span>
      </span>
    </Link>
  );
}
