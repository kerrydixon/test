import Link from "next/link";
import { Trophy } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/groups", label: "Groups" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/submit", label: "Enter" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Trophy className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            World Cup <span className="text-emerald-600">2026</span>
            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Fantasy Competition
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/submit" className="btn-primary ml-2 hidden sm:inline-flex">
            Enter now
          </Link>
        </nav>
      </div>
    </header>
  );
}
