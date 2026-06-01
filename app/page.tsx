import Link from "next/link";
import { ArrowRight, ListChecks, Medal, Target, Users } from "lucide-react";
import Countdown from "@/components/Countdown";
import { getSetting } from "@/lib/data";

const FIRST_MATCH = "2026-06-11T16:00:00.000Z"; // Mexico v South Africa

const SECTIONS = [
  { icon: Users, title: "Fantasy squad", text: "Buy 2 teams + 5 or more goal-scorers with a £5.3bn budget. Earn points for wins, goals and assists." },
  { icon: Target, title: "12 tournament questions", text: "Specific predictions — first match, Golden Boot, host goals and more. 200 points each." },
  { icon: ListChecks, title: "Group placings", text: "Predict the 1-2-3 finishing order in all twelve groups. Up to 2,400 points." },
  { icon: Medal, title: "Knockout winners", text: "Pick the winner of every match from the round of 32 to the final. 250 points each." },
];

const PRIZES = [
  { place: "1st", pct: "60%", ring: "ring-amber-400", text: "text-amber-600" },
  { place: "2nd", pct: "25%", ring: "ring-slate-300", text: "text-slate-500" },
  { place: "3rd", pct: "10%", ring: "ring-orange-300", text: "text-orange-600" },
];

export default async function HomePage() {
  const deadline = (await getSetting("submissionDeadline")) ?? FIRST_MATCH;

  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient text-white">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="pill bg-white/15 text-emerald-100">USA · Canada · Mexico</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              The World Cup 2026 Fantasy Competition
            </h1>
            <p className="mt-4 max-w-lg text-emerald-100">
              Four parts, eight ways to score. Build your fantasy squad, call the
              groups and the knockouts, and battle 50+ rivals for the prize pot.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/submit" className="btn bg-white text-emerald-700 hover:bg-emerald-50">
                Submit your entry <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/leaderboard" className="btn border border-white/30 text-white hover:bg-white/10">
                View leaderboard
              </Link>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-medium text-emerald-100">
                Entries close before the first kick-off
              </p>
              <p className="mb-4 text-lg font-semibold">Mexico v South Africa · 11 June</p>
              <Countdown target={deadline} />
            </div>
          </div>
        </div>
      </section>

      {/* Scoring sections */}
      <section className="container-page py-14">
        <h2 className="text-2xl font-bold text-slate-900">How scoring works</h2>
        <p className="mt-1 text-slate-500">Eight unique scoring sections across the tournament.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((s) => (
            <div key={s.title} className="card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prizes */}
      <section className="container-page pb-16">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-8 sm:grid-cols-2 sm:items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Prize pot</h2>
              <p className="mt-2 text-slate-500">
                The prize pot is funded by entry fees and shared between the top
                three on the final leaderboard.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {PRIZES.map((p) => (
                <div key={p.place} className={`rounded-2xl bg-slate-50 p-4 text-center ring-2 ${p.ring}`}>
                  <div className={`text-sm font-semibold ${p.text}`}>{p.place}</div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900">{p.pct}</div>
                  <div className="text-xs text-slate-400">of fees</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
