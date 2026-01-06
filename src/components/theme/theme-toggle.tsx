"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative inline-flex h-9 w-[74px] items-center rounded-full border border-border bg-card/60 px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Toggle theme"
    >
      <motion.span
        className="absolute left-1 top-1 h-7 w-7 rounded-full bg-foreground/10"
        animate={{ x: theme === "dark" ? 35 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
      <span className="flex w-full items-center justify-between px-2 text-xs text-muted-foreground">
        <span>☀</span>
        <span>☾</span>
      </span>
    </button>
  );
}
