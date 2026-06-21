"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * CardZoom — on pointer hover, shows an enlarged copy of the card centered on the
 * page (over a soft dimmed backdrop) with its full detail; it leaves when the
 * pointer does. The overlay is portalled to <body> and is pointer-events:none, so
 * the original card keeps the hover (no flicker) and clicks pass straight through.
 * Honours reduced motion via the app-wide MotionConfig (transforms collapse to a
 * crossfade).
 */
export function CardZoom({
  children,
  preview,
  className,
}: {
  children: React.ReactNode;
  preview: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <>
      <div
        className={className}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-50 grid place-items-center p-6"
                style={{ pointerEvents: "none" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <div className="absolute inset-0 bg-foreground/25 backdrop-blur-[3px]" />
                <motion.div
                  className="relative w-full max-w-md"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 8 }}
                  transition={{ duration: 0.26, ease: EASE }}
                >
                  {preview}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
