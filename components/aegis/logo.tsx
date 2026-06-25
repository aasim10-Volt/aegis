import { cn } from "@/lib/utils";

/** AEGIS brand lockup — transparent emblem + optional wordmark.
 *
 *  The source asset includes both the mark and a large wordmark. For small app
 *  chrome we crop it to the mark, then render the readable wordmark as text. */
export function Logo({
  wordmark = true,
  className,
}: {
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden={wordmark ? true : undefined}
        role={wordmark ? undefined : "img"}
        aria-label={wordmark ? undefined : "AEGIS — capstone allocation"}
        className="h-8 w-8 shrink-0 rounded-xl bg-white bg-[image:url('/aegis-workspace.png')] bg-[length:168%_168%] bg-[position:center_27%] bg-no-repeat ring-1 ring-black/5 sm:h-9 sm:w-9"
      >
        {!wordmark && <span className="sr-only">AEGIS — capstone allocation</span>}
      </span>
      {wordmark && (
        <span className="font-display text-base font-bold tracking-tight text-foreground">
          AEGIS
        </span>
      )}
    </div>
  );
}
