"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const LETTERS = ["A", "E", "G", "I", "S"];

/** A ~2s startup splash: the AEGIS mark scales in over a drifting aurora, then the
 *  whole overlay fades out to reveal the page. Plays once per session (sessionStorage),
 *  is skippable (click/tap), and is skipped entirely under prefers-reduced-motion.
 *  Renders nothing on the server, so there's no hydration mismatch. */
export function IntroSplash() {
  const reduce = useReducedMotion();
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (reduce) return; // honor reduced motion — no splash
    try {
      if (sessionStorage.getItem("aegis_intro_seen")) return;
      sessionStorage.setItem("aegis_intro_seen", "1");
    } catch {
      /* sessionStorage unavailable — still show once this mount */
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 1700);
    return () => clearTimeout(t);
  }, [reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          onClick={() => setShow(false)}
          role="presentation"
        >
          <motion.div
            initial={{ y: 14, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative flex flex-col items-center"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              {LETTERS.map((letter, index) => (
                <motion.span
                  key={letter}
                  initial={{ y: 16 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.55, delay: index * 0.055, ease: EASE }}
                  className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl"
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            <motion.div
              initial={{ scaleX: 0.18 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.75, delay: 0.18, ease: EASE }}
              className="mt-4 h-1 w-28 origin-center rounded-full bg-primary sm:w-36"
            />
            <motion.p
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.55, delay: 0.32, ease: EASE }}
              className="mt-3 text-sm font-medium text-muted-foreground"
            >
              Workspace
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
