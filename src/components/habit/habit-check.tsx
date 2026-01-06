"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui/cn";

export function HabitCheck({ checked, disabled, onToggle }: { checked: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/50 smooth-transition",
        "hover:bg-foreground/5 disabled:opacity-60"
      )}
      aria-pressed={checked}
      aria-label={checked ? "Mark incomplete" : "Mark complete"}
    >
      <motion.span
        className={cn(
          "absolute inset-0 rounded-xl",
          checked ? "bg-primary/15" : "bg-transparent"
        )}
        initial={false}
        animate={{ opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("relative", checked ? "text-primary" : "text-muted-foreground")}
        initial={false}
        animate={{ scale: checked ? 1 : 0.9, opacity: checked ? 1 : 0.7 }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
      >
        <motion.path
          d="M20 6L9 17l-5-5"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </motion.svg>
    </button>
  );
}
