import Image from "next/image";
import { cn } from "@/lib/utils";

/** AEGIS brand lockup — optimized emblem + optional wordmark.
 *
 *  Crops to the mark via overflow-hidden + scale transform, replicating the
 *  original bg-[length:168%] bg-[position:center_27%] exactly. */
export function Logo({
  wordmark = true,
  className,
}: {
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        aria-hidden={wordmark ? true : undefined}
        role={wordmark ? undefined : "img"}
        aria-label={wordmark ? undefined : "AEGIS capstone allocation"}
        className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/5 sm:h-9 sm:w-9"
      >
        {!wordmark && <span className="sr-only">AEGIS capstone allocation</span>}
        <Image
          src="/aegis-workspace.png"
          alt=""
          fill
          className="object-cover scale-[1.68]"
          style={{ transformOrigin: "center 27%" }}
          sizes="36px"
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
