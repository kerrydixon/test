// Wikipedia results provider.
//
// Wikipedia tournament pages render each match with the "footballbox" template:
//   <div class="footballbox">
//     <th class="fhome">Mexico</th>
//     <th class="fscore"><a>2–1</a></th>
//     <th class="faway">South Africa</th>
//     <td class="fgoals fhgoal">Martín 23'<br>López 67'</td>
//     <td class="fgoals fagoal">Khune 80' (o.g.)</td>
//   </div>
//
// The parser below targets that structure. Section context (stage / group) is not
// inside the box, so it can be supplied via optional data-stage / data-group
// attributes; otherwise matches default to the group stage. These selectors are a
// starting point — confirm them against the live page once the tournament begins.

import * as cheerio from "cheerio";
import type { RawGoal, RawMatch, ResultsProvider } from "../types";
import type { Stage } from "@/lib/scoring/types";

const SCORE_RE = /(\d+)\s*[–—-]\s*(\d+)/; // en dash, em dash or hyphen
const MINUTE_RE = /(\d+)(?:\+\d+)?'/g;

function parseGoalCell(html: string, teamName: string): RawGoal[] {
  if (!html.trim()) return [];
  const text = cheerio.load(`<div>${html.replace(/<br\s*\/?>/gi, "\n")}</div>`)("div").text();
  const goals: RawGoal[] = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const isOwnGoal = /\(o\.g\.\)/i.test(line);
    const isShootout = /\(pen\.\)/i.test(line) && /shoot-?out/i.test(line);
    const scorerName = line
      .replace(MINUTE_RE, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/[,;]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const minutes = [...line.matchAll(MINUTE_RE)].map((m) => Number(m[1]));
    const useMinutes = minutes.length ? minutes : [0];
    for (const minute of useMinutes) {
      goals.push({
        teamName,
        scorerName: scorerName || "Unknown",
        assistName: null,
        minute,
        isOwnGoal,
        isExtraTime: minute > 90,
        isShootout,
      });
    }
  }
  return goals;
}

/** Parse Wikipedia footballbox markup into RawMatch[]. Exported for unit testing. */
export function parseFootballBoxes(html: string): RawMatch[] {
  const $ = cheerio.load(html);
  const matches: RawMatch[] = [];

  $(".footballbox").each((_, el) => {
    const box = $(el);
    const homeTeamName = box.find(".fhome").first().text().trim();
    const awayTeamName = box.find(".faway").first().text().trim();
    if (!homeTeamName || !awayTeamName) return;

    const scoreText = box.find(".fscore").first().text().trim();
    const scoreMatch = SCORE_RE.exec(scoreText);

    const stage = (box.attr("data-stage") as Stage | undefined) ?? "GROUP";
    const groupCode = box.attr("data-group") ?? null;
    const externalRef =
      box.attr("data-ref") ?? `${stage}-${homeTeamName}-${awayTeamName}`;

    const goals: RawGoal[] = [
      ...parseGoalCell(box.find(".fhgoal").first().html() ?? "", homeTeamName),
      ...parseGoalCell(box.find(".fagoal").first().html() ?? "", awayTeamName),
    ];

    if (!scoreMatch) {
      matches.push({
        externalRef,
        stage,
        groupCode,
        homeTeamName,
        awayTeamName,
        status: "SCHEDULED",
        goals: [],
      });
      return;
    }

    matches.push({
      externalRef,
      stage,
      groupCode,
      homeTeamName,
      awayTeamName,
      status: "FINISHED",
      homeGoals: Number(scoreMatch[1]),
      awayGoals: Number(scoreMatch[2]),
      wentToExtraTime: goals.some((g) => g.isExtraTime),
      goals,
    });
  });

  return matches;
}

export function wikipediaProvider(url?: string): ResultsProvider {
  const target =
    url ??
    process.env.WIKIPEDIA_RESULTS_URL ??
    "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup";

  return {
    name: "wikipedia",
    async fetchMatches() {
      const res = await fetch(target, {
        headers: { "User-Agent": "wc2026-fantasy/1.0 (results sync)" },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return parseFootballBoxes(await res.text());
    },
  };
}
