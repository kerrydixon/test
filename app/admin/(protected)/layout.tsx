import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/scorers", label: "Goal-scorers" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/groups", label: "Group standings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <nav className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <button className="text-sm font-medium text-slate-500 hover:text-rose-600">Sign out</button>
        </form>
      </div>
      {children}
    </div>
  );
}
