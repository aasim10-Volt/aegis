"use client";

/**
 * AppShell — the three-column layout borrowed from the reference's bones:
 *   floating sidebar  |  main workspace  |  contextual right rail
 *
 * Responsive:
 *   ≥ 1280px (xl) → all three columns
 *   768–1279px    → sidebar + main (right rail content folds into main)
 *   < 768px       → main only, fixed bottom nav, sidebar via drawer
 *
 * Right rail is optional — pass `rail` to show it.
 */

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  LayoutGrid,
  Users,
  ShieldAlert,
  GitBranch,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "teams", label: "Teams", icon: Users },
  { key: "alerts", label: "Alerts", icon: ShieldAlert },
  { key: "pipeline", label: "Pipeline", icon: GitBranch },
  { key: "settings", label: "Settings", icon: Settings },
];

export interface AppShellProps {
  active?: string;
  onNavigate?: (key: string) => void;
  rail?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ active = "overview", onNavigate, rail, children }: AppShellProps) {
  const reduce = useReducedMotion();

  const navButton = (item: NavItem, mobile = false) => {
    const isActive = item.key === active;
    const Icon = item.icon;
    return (
      <button
        key={item.key}
        onClick={() => onNavigate?.(item.key)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          mobile && "flex-col gap-1 px-2 py-1.5 text-[0.6875rem]",
          isActive
            ? "text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        {isActive && (
          <motion.span
            layoutId={mobile ? "nav-active-mobile" : "nav-active"}
            className="absolute inset-0 -z-10 rounded-xl bg-sidebar-accent"
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <Icon className={cn("shrink-0", mobile ? "h-5 w-5" : "h-[1.125rem] w-[1.125rem]")} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-[1600px] gap-4 p-3 sm:p-4">
        {/* SIDEBAR — floating, rounded, soft-shadow, glassy */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[230px] shrink-0 flex-col rounded-[1.25rem] border border-sidebar-border bg-sidebar/80 p-3 shadow-card backdrop-blur-xl md:flex">
          <div className="flex items-center gap-2.5 px-2 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-display text-sm font-bold">Æ</span>
            </div>
            <span className="font-display text-base font-bold tracking-tight text-sidebar-foreground">
              AEGIS
            </span>
          </div>

          <nav className="mt-2 flex flex-col gap-1">{NAV.map((i) => navButton(i))}</nav>

          <div className="mt-auto flex items-center gap-3 rounded-xl border border-sidebar-border p-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-chart-1 to-chart-5" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">Dr. Perera</p>
              <p className="truncate text-xs text-muted-foreground">Supervisor</p>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>

        {/* RIGHT RAIL — lightweight, contextual, xl only */}
        {rail && (
          <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[320px] shrink-0 overflow-y-auto xl:block">
            {rail}
          </aside>
        )}
      </div>

      {/* MOBILE BOTTOM NAV */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card/90 px-2 py-1.5 backdrop-blur-xl md:hidden">
        {NAV.slice(0, 4).map((i) => navButton(i, true))}
      </nav>
    </div>
  );
}
