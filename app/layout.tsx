import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "World Cup USA 2026 — Fantasy Competition",
  description:
    "Predict, pick your fantasy squad and climb the leaderboard for World Cup USA 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
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
      </body>
    </html>
  );
}
