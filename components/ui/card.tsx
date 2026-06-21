import * as React from "react";
import { cn } from "@/lib/utils";

/** Soft, rounded surface — the building block of the dashboard. */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 bg-card shadow-card transition-shadow",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2.5 px-6 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-sm font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6", className)} {...props} />;
}
