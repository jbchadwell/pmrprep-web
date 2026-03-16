import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  eyebrowClassName?: string;
}

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  titleClassName,
  descriptionClassName,
  eyebrowClassName,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <div
            className={cn(
              "text-sm font-medium uppercase tracking-wide text-blue-700",
              eyebrowClassName
            )}
          >
            {eyebrow}
          </div>
        ) : null}

        <div className="space-y-1">
          <h1
            className={cn(
              "text-3xl font-semibold tracking-tight text-slate-900",
              titleClassName
            )}
          >
            {title}
          </h1>

          {description ? (
            <p
              className={cn(
                "max-w-2xl text-sm text-slate-600 sm:text-base",
                descriptionClassName
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
