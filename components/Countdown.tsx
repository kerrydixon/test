"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1000),
    done: ms === 0,
  };
}

export default function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const [t, setT] = useState(() => diff(targetMs));

  useEffect(() => {
    const id = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (t.done) {
    return <p className="text-lg font-semibold text-emerald-300">The tournament is under way! ⚽</p>;
  }

  const cells = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Mins", value: t.minutes },
    { label: "Secs", value: t.seconds },
  ];

  return (
    <div className="flex gap-3">
      {cells.map((c) => (
        <div
          key={c.label}
          className="min-w-16 rounded-xl bg-white/10 px-3 py-2 text-center backdrop-blur"
        >
          <div className="text-2xl font-bold tabular-nums text-white">
            {String(c.value).padStart(2, "0")}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-emerald-200">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
