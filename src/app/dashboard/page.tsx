"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type MeResponse =
  | { ok: true; user: { userId: string; email: string } }
  | { ok: false };

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = (await res.json().catch(() => ({ ok: false }))) as MeResponse;
      if (cancelled) return;
      if (data.ok) setEmail(data.user.email);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/signin";
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="glass p-6 shadow-glass"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Signed in as {email ?? "…"}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-secondary text-secondary-foreground px-3 py-2 smooth-transition hover:bg-secondary/80"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-card/40 p-4 text-sm text-muted-foreground">
            Habit management + daily tracker + analytics are next (API + UI).
          </div>
        </motion.div>
      </div>
    </main>
  );
}
