import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import SiteHeader from "@/app/_components/ui/site-header";

interface PageShellProps {
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
}

export default function PageShell({
  children,
  className,
  showHeader = true,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {showHeader ? <SiteHeader /> : null}

      <main>
        <div
          className={cn(
            "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 text-slate-800",
            className
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
