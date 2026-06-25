"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ThemeToggle } from "@/components/aegis/theme-toggle";
import { cn } from "@/lib/utils";
import { safeRedirect } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/client";

interface SignInPageProps {
  className?: string;
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("relative h-full w-full", containerClassName)}>
      <DotMatrix dotSize={dotSize ?? 6} opacities={opacities} reverse={reverse} animationSpeed={animationSpeed} />
      {showGradient && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 50%, color-mix(in oklch, var(--background) 92%, transparent) 0%, color-mix(in oklch, var(--background) 75%, transparent) 40%, color-mix(in oklch, var(--background) 20%, transparent) 70%, color-mix(in oklch, var(--background) 0%, transparent) 100%)",
          }}
        />
      )}
    </div>
  );
};

interface DotMatrixProps {
  opacities?: number[];
  dotSize?: number;
  reverse?: boolean;
  animationSpeed?: number;
}

const GRID_COLUMNS = 28;
const GRID_ROWS = 18;

const DotMatrix: React.FC<DotMatrixProps> = ({
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  dotSize = 6,
  reverse = false,
  animationSpeed = 10,
}) => {
  const dots = React.useMemo(() => {
    const centerX = (GRID_COLUMNS - 1) / 2;
    const centerY = (GRID_ROWS - 1) / 2;
    const maxDistance = Math.hypot(centerX, centerY);

    return Array.from({ length: GRID_COLUMNS * GRID_ROWS }, (_, index) => {
      const x = index % GRID_COLUMNS;
      const y = Math.floor(index / GRID_COLUMNS);
      const distance = Math.hypot(x - centerX, y - centerY);
      const normalized = distance / maxDistance;
      const opacity = opacities[(x * 7 + y * 11) % opacities.length] ?? 0.5;
      const delay = reverse ? (1 - normalized) * 0.9 : normalized * 0.9;

      return { index, opacity, delay };
    });
  }, [opacities, reverse]);

  const duration = Math.max(0.18, 2.2 / animationSpeed);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="grid h-full w-full content-center justify-center gap-3 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
      >
        {dots.map((dot) => (
          <motion.span
            key={`${dot.index}-${reverse ? "out" : "in"}`}
            aria-hidden
            className="rounded-full"
            initial={{ scale: reverse ? 1 : 0.15 }}
            animate={{ scale: reverse ? 0.15 : 1 }}
            transition={{
              duration,
              delay: dot.delay,
              repeat: reverse ? 0 : Infinity,
              repeatType: "mirror",
              repeatDelay: 3,
              ease: "easeInOut",
            }}
            style={{
              width: dotSize,
              height: dotSize,
              opacity: dot.opacity,
              backgroundColor: "var(--login-dot)",
              boxShadow: "0 0 18px color-mix(in oklch, var(--login-dot) 70%, transparent)",
            }}
          />
        ))}
      </div>
    </div>
  );
};

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  return (
    <a
      href={href}
      className="group relative flex items-center overflow-hidden text-sm"
      style={{ height: 20 }}
    >
      <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className="text-muted-foreground" style={{ lineHeight: "20px" }}>
          {children}
        </span>
        <span className="text-foreground" style={{ lineHeight: "20px" }}>
          {children}
        </span>
      </div>
    </a>
  );
};

function MiniNavbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [headerShapeClass, setHeaderShapeClass] = React.useState("rounded-full");
  const shapeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleMenu = () => {
    setIsOpen((open) => !open);
  };

  React.useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass("rounded-xl");
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass("rounded-full");
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const navLinksData = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ];

  const loginButtonElement = (
    <a
      href="#signin-form"
      className="w-full rounded-full border border-[var(--login-border)] bg-[var(--login-nav-bg)] px-4 py-2 text-center text-xs text-muted-foreground transition-colors duration-200 hover:border-foreground/40 hover:text-foreground sm:w-auto sm:px-3 sm:text-sm"
    >
      Sign in
    </a>
  );

  const signupButtonElement = (
    <div className="group relative w-full sm:w-auto">
      <div className="pointer-events-none absolute inset-0 -m-2 hidden rounded-full bg-foreground opacity-30 blur-lg transition-all duration-300 ease-out group-hover:-m-3 group-hover:opacity-45 group-hover:blur-xl sm:block" />
      <a
        href="#signin-form"
        className="relative z-10 block w-full rounded-full bg-foreground px-4 py-2 text-center text-xs font-semibold text-background transition-colors duration-200 hover:bg-foreground/90 sm:w-auto sm:px-3 sm:text-sm"
      >
        Get started
      </a>
    </div>
  );

  return (
    <header
      className={cn(
        "fixed left-1/2 top-6 z-20 flex w-[calc(100%-2rem)] -translate-x-1/2 flex-col items-center border border-[var(--login-border)] bg-[var(--login-nav-bg)] px-6 py-3 shadow-card transition-[border-radius,background-color,border-color] duration-300 ease-in-out sm:w-auto",
        headerShapeClass,
      )}
    >
      <div className="flex w-full items-center justify-between gap-x-6 sm:gap-x-8">
        <Link href="/" className="flex items-center gap-2" aria-label="AEGIS home">
          <Image
            src="/aegis-workspace.png"
            alt=""
            width={20}
            height={20}
            priority
            className="h-5 w-5 rounded-full object-contain bg-foreground"
          />
          <span className="text-sm font-semibold text-foreground">AEGIS</span>
        </Link>

        <nav className="hidden items-center space-x-4 text-sm sm:flex sm:space-x-6">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex sm:gap-3">
          <ThemeToggle className="h-9 w-9 rounded-full border border-[var(--login-border)] bg-[var(--login-nav-bg)]" />
          {loginButtonElement}
          {signupButtonElement}
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center text-muted-foreground sm:hidden"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        className={cn(
          "flex w-full flex-col items-center overflow-hidden transition-all duration-300 ease-in-out sm:hidden",
          isOpen ? "max-h-[1000px] pt-4" : "max-h-0 pt-0 pointer-events-none",
        )}
      >
        <nav className="flex w-full flex-col items-center space-y-4 text-base">
          {navLinksData.map((link) => (
            <a key={link.href} href={link.href} className="w-full text-center text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="mt-4 flex w-full flex-col items-center space-y-4">
          <ThemeToggle className="h-10 w-full rounded-full border border-[var(--login-border)] bg-[var(--login-nav-bg)]" />
          {loginButtonElement}
          {signupButtonElement}
        </div>
      </div>
    </header>
  );
}

function AmbientCard({
  className,
  delay,
  children,
}: {
  className: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      aria-hidden
      className={cn("absolute hidden rounded-2xl border border-[var(--login-border)] bg-[var(--login-card-bg)] px-5 py-4 shadow-[var(--login-card-shadow)] backdrop-blur-md sm:block", className)}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export function AegisSignInPage({ className }: SignInPageProps) {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("next") ?? params.get("redirect"));
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [step, setStep] = React.useState<"email" | "success">("email");
  const [showSuccessAnimation, setShowSuccessAnimation] = React.useState(false);
  const [initialCanvasVisible, setInitialCanvasVisible] = React.useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    params.get("error") === "link" ? "That sign-in link is invalid or has expired." : null,
  );
  const [busy, setBusy] = React.useState(false);

  const completeSignIn = React.useCallback(() => {
    setError(null);
    setShowSuccessAnimation(true);
    setReverseCanvasVisible(true);

    setTimeout(() => {
      setInitialCanvasVisible(false);
    }, 50);

    setTimeout(() => {
      setStep("success");
    }, 650);

    setTimeout(() => {
      router.push(redirect);
      router.refresh();
    }, 1500);
  }, [redirect, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const callbackPath = safeRedirect(`/auth/callback?next=${encodeURIComponent(redirect)}`, "/auth/callback");
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}${callbackPath}` },
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    completeSignIn();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }

    completeSignIn();
  };

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col overflow-hidden bg-background text-foreground",
        "[--login-border:rgb(15_23_42_/_0.10)] [--login-card-bg:rgb(255_255_255_/_0.92)] [--login-card-shadow:0_4px_24px_rgb(0_0_0_/_0.10)] [--login-dot:rgb(15_23_42_/_0.12)] [--login-field-bg:rgb(255_255_255_/_1)] [--login-field-border:rgb(15_23_42_/_0.12)] [--login-field-placeholder:rgb(100_116_139_/_1)] [--login-nav-bg:rgb(255_255_255_/_0.80)]",
        "dark:[--login-border:rgb(255_255_255_/_0.10)] dark:[--login-card-bg:rgb(22_27_37_/_0.85)] dark:[--login-card-shadow:0_4px_24px_rgb(0_0_0_/_0.40),0_1px_4px_rgb(0_0_0_/_0.20)] dark:[--login-dot:rgb(255_255_255_/_0.12)] dark:[--login-field-bg:rgb(255_255_255_/_0.06)] dark:[--login-field-border:rgb(255_255_255_/_0.15)] dark:[--login-field-placeholder:rgb(255_255_255_/_0.40)] dark:[--login-nav-bg:rgb(14_17_23_/_0.72)]",
        className,
      )}
    >
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-background"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}

        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-background"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse
            />
          </div>
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, var(--background) 0%, color-mix(in oklch, var(--background) 0%, transparent) 100%)",
          }}
        />
        <div
          className="absolute left-0 right-0 top-0 h-1/3"
          style={{
            background:
              "linear-gradient(to bottom, var(--background), color-mix(in oklch, var(--background) 0%, transparent))",
          }}
        />
      </div>

      <AmbientCard className="left-10 top-32" delay={0}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-healthy/15 text-lg font-bold tabular-nums text-healthy">
            84
          </span>
          <div>
            <p className="text-[15px] font-semibold text-foreground">Team health</p>
            <p className="text-xs font-medium text-healthy">On track</p>
          </div>
        </div>
      </AmbientCard>

      <AmbientCard className="bottom-24 left-16" delay={1}>
        <p className="text-[15px] font-semibold text-foreground">15 teams + 1 pool</p>
        <p className="mt-1 text-xs text-muted-foreground">from 70 students</p>
      </AmbientCard>

      <AmbientCard className="right-10 top-24" delay={2}>
        <p className="text-sm font-semibold text-foreground">Similar proposals</p>
        <p className="mt-1 text-sm font-semibold text-at-risk">
          <span className="tabular-nums">0.911</span> match
        </p>
        <p className="text-xs text-muted-foreground">held for review</p>
      </AmbientCard>

      <div className="relative z-10 flex flex-1 flex-col">
        <MiniNavbar />

        <main className="flex flex-1 flex-col lg:flex-row">
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-28">
            <div id="signin-form" className="mt-14 w-full max-w-sm scroll-mt-28">
              <AnimatePresence mode="wait">
                {step === "email" ? (
                  <motion.div
                    key="email-step"
                    initial={{ x: -100 }}
                    animate={{ x: 0 }}
                    exit={{ x: -100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-foreground">Sign in to AEGIS</h1>
                      <p className="text-[1.8rem] font-light text-muted-foreground">Your capstone allocation engine</p>
                    </div>

                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={busy}
                        aria-label="Continue with Google"
                        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full border border-[rgb(15_23_42_/_0.12)] bg-[rgb(255_255_255_/_0.92)] px-5 text-[15px] text-foreground transition-colors hover:border-[rgb(15_23_42_/_0.22)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-[rgb(255_255_255_/_0.20)] dark:bg-[rgb(255_255_255_/_0.08)] dark:hover:border-[rgb(255_255_255_/_0.35)] dark:hover:bg-[rgb(255_255_255_/_0.14)]"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>Continue with Google</span>
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-border/60" />
                        <span className="text-sm text-muted-foreground">or</span>
                        <div className="h-px flex-1 bg-border/60" />
                      </div>

                      <form onSubmit={handleEmailSubmit} className="space-y-3">
                        <div className="relative">
                          <input
                            type="email"
                            placeholder="your@university.edu"
                            value={email}
                            autoComplete="email"
                            aria-label="Email address"
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-[52px] w-full rounded-full border border-[var(--login-field-border)] bg-[var(--login-field-bg)] px-5 text-center text-[15px] text-foreground outline-none transition-colors placeholder:text-[var(--login-field-placeholder)] focus:border-[rgb(15_23_42_/_0.32)] dark:text-white dark:focus:border-[rgb(255_255_255_/_0.40)]"
                            required
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            autoComplete="current-password"
                            aria-label="Password"
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-[52px] w-full rounded-full border border-[var(--login-field-border)] bg-[var(--login-field-bg)] pl-5 pr-14 text-center text-[15px] text-foreground outline-none transition-colors placeholder:text-[var(--login-field-placeholder)] focus:border-[rgb(15_23_42_/_0.32)] dark:text-white dark:focus:border-[rgb(255_255_255_/_0.40)]"
                            required
                          />
                          <button
                            type="submit"
                            disabled={busy || !email || !password}
                            className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 group"
                            aria-label="Sign in"
                          >
                            <span className="relative block h-full w-full overflow-hidden">
                              <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-full">
                                →
                              </span>
                              <span className="absolute inset-0 flex -translate-x-full items-center justify-center transition-transform duration-300 group-hover:translate-x-0">
                                →
                              </span>
                            </span>
                          </button>
                        </div>

                        {error && (
                          <p className="rounded-xl border border-critical/30 bg-critical/10 px-3 py-2 text-left text-sm text-critical" role="alert">
                            {error}
                          </p>
                        )}
                      </form>
                    </div>

                    <p className="pt-10 text-xs leading-relaxed text-muted-foreground">
                      By signing in, you agree to the{" "}
                      <Link href="/terms" className="underline transition-colors hover:text-foreground">
                        AEGIS terms of use
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="underline transition-colors hover:text-foreground">
                        privacy policy
                      </Link>
                      .
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-step"
                    initial={{ y: 50 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-foreground">You are in</h1>
                      <p className="text-[1.25rem] font-light text-muted-foreground">Welcome back to AEGIS</p>
                    </div>

                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: showSuccessAnimation ? 1 : 0.8 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="py-10"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </motion.div>

                    <motion.button
                      type="button"
                      animate={{ y: 0 }}
                      transition={{ delay: 1 }}
                      onClick={() => router.push(redirect)}
                      className="w-full rounded-full bg-foreground py-3 font-medium text-background transition-colors hover:bg-foreground/90"
                    >
                      Go to dashboard
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
