"use client";

import * as React from "react";

type MeResponse =
  | { ok: true; user: { userId: string; email: string } }
  | { ok: false };

export function useMe() {
  const [email, setEmail] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      const data = (await res.json().catch(() => ({ ok: false }))) as MeResponse;
      if (cancelled) return;
      setEmail(data.ok ? data.user.email : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { email, loading };
}
