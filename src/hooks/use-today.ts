"use client";

import * as React from "react";
import { getLocalYmd, getTzOffsetMinutes } from "@/lib/date/client";

function msUntilNextLocalMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 50); // a tiny buffer after midnight
  return next.getTime() - now.getTime();
}

export function useToday() {
  const [ymd, setYmd] = React.useState(() => getLocalYmd());
  const [tzOffset, setTzOffset] = React.useState(() => getTzOffsetMinutes());

  React.useEffect(() => {
    let timer: number | null = null;

    const schedule = () => {
      const now = new Date();
      timer = window.setTimeout(() => {
        setYmd(getLocalYmd());
        setTzOffset(getTzOffsetMinutes());
        schedule();
      }, msUntilNextLocalMidnight(now));
    };

    schedule();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return { ymd, tzOffset };
}
