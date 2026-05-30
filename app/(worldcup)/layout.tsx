import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function WorldCupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-sm text-slate-500 sm:flex-row">
          <p>World Cup USA 2026 Fantasy Competition</p>
          <Link href="/admin" className="hover:text-slate-700">
            Organiser
          </Link>
        </div>
      </footer>
    </>
  );
}
