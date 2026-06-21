"use client";

import { MotionConfig } from "framer-motion";

/** App-wide motion config: every framer-motion animation honours the user's
 *  reduced-motion preference automatically (transforms collapse to crossfade). */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
