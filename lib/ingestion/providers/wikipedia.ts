// Wikipedia results provider.
//
// Wikipedia renders each match with the {{Football box}} template:
//   <div class="footballbox">
//     <th class="fhome">Mexico</th>
//     <th class="fscore"><a>2–1</a></th>
//     <th class="faway">South Africa</th>
//     <td class="fgoals fhgoal">Martín 23'<br>López 67'</td>
//     <td class="fgoals fagoal">Khune 80' (o.g.)</td>
//   </div>
//
// The box carries no stage/group info, so we infer it from the most recent section
// heading ("Group A", "Round of 32", "Quarter-finals", "Final", …) while walking the
// document in order. Matches under a "Third place" heading are ignored (that game
// isn't part of the prediction bracket). These selectors match the long-stable
// template; still confirm against the live page once the tournament begins.

import * as cheerio from "cheerio";
import type { Cheerio } from "cheerio";
import type { Element } from "domhandler";
import type { RawGoal, RawMatch, ResultsProvider } from "../types";
import type { Stage } from "@/lib/scoring/types";

const SCORE_RE = /(\d+)\s*[–—-]\s*(\d+)/; // en dash, em dash or hyphen
const MINUTE_RE = /(\d+)(?:\+\d+)?'/g;

type StageCtx = Stage | "SKIP";

/** Classify a section heading into a stage context, or null to keep the current one. */
export function classifyHeading(text: string): { stage: StageCtx; group: string | null } | null {
  const t = text.toLowerCase();
  const gm = t.match(/\bgroup\s+([a-l])\b/);
  if (gm) return { stage: "GROUP", group: gm[1].toUpperCase() };
  if (/third[-\s]?place|3rd[-\s]?place/.test(t)) return { stage: "SKIP", group: null };
  if (/quarter[-\s]?final/.test(t)) return { stage: "QF", group: null };
  if (/semi[-\s]?final/.test(t)) return { stage: "SF", group: null };
  if (/round of 32/.test(t)) return { stage: "R32", group: null };
  if (/round of 16/.test(t)) return { stage: "R16", group: null };
  if (/\bfinals?\b/.test(t)) return { stage: "FINAL", group: null };
  return null;
}

function parseGoalCell(html: string, teamName: string): RawGoal[] {
  if (!html.trim()) return [];
  const text = cheerio.load(`<div>${html.replace(/<br\s*\/?>/gi, "\n")}</div>`)("div").text();
  const goals: RawGoal[] = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const isOwnGoal = /\(o\.g\.\)/i.test(line);
    // A normal penalty "(pen.)" counts; only shoot-out goals are excluded. Wikipedia
    // lists shoot-out scorers in a separate "fpenalties" block, not the goal cell.
    const isShootout = false;
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
        assistName: null, // Wikipedia footballboxes don't list assists
        minute,
        isOwnGoal,
        isExtraTime: minute > 90,
        isShootout,
      });
    }
  }
  return goals;
}

function parseBox(
  box: Cheerio<Element>,
  stage: Stage,
  group: string | null,
): RawMatch | null {
  const homeTeamName = box.find(".fhome").first().text().trim();
  const awayTeamName = box.find(".faway").first().text().trim();
  if (!homeTeamName || !awayTeamName) return null;

  const stageAttr = (box.attr("data-stage") as Stage | undefined) ?? stage;
  const groupCode = box.attr("data-group") ?? group;
  const externalRef =
    box.attr("data-ref") ?? `${stageAttr}-${homeTeamName}-${awayTeamName}`;

  const scoreText = box.find(".fscore").first().text().trim();
  const scoreMatch = SCORE_RE.exec(scoreText);

  if (!scoreMatch) {
    return {
      externalRef,
      stage: stageAttr,
      groupCode,
      homeTeamName,
      awayTeamName,
      status: "SCHEDULED",
      goals: [],
    };
  }

  const goals: RawGoal[] = [
    ...parseGoalCell(box.find(".fhgoal").first().html() ?? "", homeTeamName),
    ...parseGoalCell(box.find(".fagoal").first().html() ?? "", awayTeamName),
  ];
  // Penalty shoot-out winner, if Wikipedia shows it as "(4–2 p)" / "(4–2 pen.)".
  const shootout = /\(\s*(\d+)\s*[–—-]\s*(\d+)\s*(?:p|pen)\.?\s*\)/i.exec(scoreText);
  let shootoutWinnerName: string | null = null;
  if (shootout) {
    shootoutWinnerName =
      Number(shootout[1]) > Number(shootout[2]) ? homeTeamName : awayTeamName;
  }

  return {
    externalRef,
    stage: stageAttr,
    groupCode,
    homeTeamName,
    awayTeamName,
    status: "FINISHED",
    homeGoals: Number(scoreMatch[1]),
    awayGoals: Number(scoreMatch[2]),
    wentToExtraTime: /a\.?e\.?t/i.test(scoreText) || goals.some((g) => g.isExtraTime),
    shootoutWinnerName,
    goals,
  };
}

/**
 * Parse Wikipedia markup into RawMatch[], tagging each match with the stage/group
 * from the nearest preceding heading. Exported for unit testing.
 */
export function parseFootballBoxes(
  html: string,
  defaultStage: Stage = "GROUP",
): RawMatch[] {
  const $ = cheerio.load(html);
  let stage: StageCtx = defaultStage;
  let group: string | null = null;
  const out: RawMatch[] = [];

  $("h1, h2, h3, h4, .footballbox").each((_, el) => {
    const node = $(el);
    if (node.hasClass("footballbox")) {
      if (stage === "SKIP") return; // third-place play-off etc.
      const m = parseBox(node, stage, group);
      if (m) out.push(m);
    } else {
      const ctx = classifyHeading(node.text());
      if (ctx) {
        stage = ctx.stage;
        group = ctx.group;
      }
    }
  });

  return out;
}

const DEFAULT_PAGES = [
  "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_group_stage",
  "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage",
];

async function fetchPage(url: string): Promise<RawMatch[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "wc2026-fantasy/1.0 (results sync)" },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return parseFootballBoxes(await res.text());
}

export function wikipediaProvider(urls?: string[]): ResultsProvider {
  const pages =
    urls ??
    (process.env.WIKIPEDIA_RESULTS_URL
      ? process.env.WIKIPEDIA_RESULTS_URL.split(",").map((u) => u.trim())
      : DEFAULT_PAGES);

  return {
    name: "wikipedia",
    async fetchMatches() {
      const all: RawMatch[] = [];
      const errors: string[] = [];
      for (const url of pages) {
        try {
          all.push(...(await fetchPage(url)));
        } catch (e) {
          errors.push(e instanceof Error ? e.message : String(e));
        }
      }
      // Only fail the whole sync if every page failed; partial data is still useful.
      if (all.length === 0 && errors.length) {
        throw new Error(`All result pages failed: ${errors.join("; ")}`);
      }
      return all;
    },
  };
}
