import Image from "next/image";
import { cn } from "@/lib/utils";

/** AEGIS brand lockup — emblem tile + wordmark. Wordmark is optional (icon-only mode). */
export function Logo({ wordmark = true, className }: { wordmark?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background ring-1 ring-border/70">
        <Image
          src="/aegis-logo.png"
          alt="AEGIS"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
          priority
        />
      </div>
      {wordmark && (
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          AEGIS
        </span>
      )}
    </div>
  );
}
