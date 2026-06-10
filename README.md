# World Cup USA 2026 — Fantasy Competition

A web app that replaces the organiser's Excel-based tournament. Players self-submit
entries; results are auto-scraped from a public source with an organiser override; and
all eight scoring sections are computed live into a leaderboard.

Built with **Next.js 16 + TypeScript + Tailwind v4 + Prisma 6 + Postgres**.

## The competition (8 scoring sections)

1. **Fantasy squad** — 2 teams + ≥5 goal-scorers, £5.3bn budget. Win/draw, goals
   for/against, scorer goals and assists.
2. **12 tournament questions** — 200 pts each.
3. **Group placings** — predict the 1-2-3 of each of the 12 groups (24-row accuracy
   matrix, up to 2,400 pts).
4. **Knockout winners** — 250 pts per correct winner (R32 → Final).

All scoring rules live in pure, unit-tested modules under `lib/scoring/`.

## Local development

Requires Node 20+ and a local Postgres.

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL + ADMIN_PASSWORD
npm run db:push               # create tables
npm run db:seed               # 48 teams, 12 groups, 72 group fixtures
npm run dev                   # http://localhost:3000
```

- Public site: `/`, `/submit`, `/leaderboard`, `/groups`, `/fixtures`, `/entrant/[id]`.
- Organiser area: `/admin` (sign in with `ADMIN_PASSWORD`).

```bash
npm test            # scoring engine + budget + scraper parser tests
npm run build       # production build
```

## How entries flow in

Players can self-submit at `/submit`, **or** entries received offline (Word docs,
emails, spreadsheets) are transcribed into JSON files in `data/entries/` (one per
entrant; see any file for the shape). `data/entries/` is the **single source of truth**
for transcribed entries: every deploy validates the files and syncs the database to
match them — creating new entrants, refreshing changed ones in place (stable ids), and
removing locked entrants whose file no longer exists. Self-submitted and demo entries
(which are unlocked) are never touched. Transcribed entries are created **locked**, which
also protects them from the admin "Wipe ALL data" testing tool.

## How results flow in

- A **scraper** (`lib/ingestion/`) reads public results pages (the Wikipedia group-stage
  and knockout-stage articles by default; override with a comma-separated
  `WIKIPEDIA_RESULTS_URL`). It infers each match's stage/group from the nearest section
  heading ("Group A", "Round of 32", "Final", …) and skips the third-place play-off.
  Scores, scorers and own goals come from the feed; **assists and penalty shoot-out
  winners are not published in the match boxes, so those are entered in admin.**
- It runs on a schedule via **Vercel Cron** (`vercel.json`, once daily — the Hobby-plan
  limit) and on demand via the admin **“Refresh results now”** button, which is the main
  way to update during match days (Pro plans can increase the cron frequency).
- The scraper **never** overwrites a match marked **locked**, and it preserves any
  manually-entered goals. The organiser confirms granular fields (assists, own-goals,
  shoot-outs) and the judgement-based questions (Golden Boot, top-scoring group, …).

> The live results page is empty until the tournament starts (11 June 2026), and the
> Wikipedia `footballbox` selectors are a starting point — confirm them against the live
> page once matches begin. The scraper parser is unit-tested against a saved fixture.

## Deploying to Vercel

The app lives at the repo root, so no Root Directory setting is needed.

1. Import this repo in Vercel (Framework auto-detects as Next.js).
2. **Storage → create a Postgres store** and attach it to the project (one click — it
   injects `DATABASE_URL` automatically; no separate signup). Do this *before* the first
   deploy.
3. Set environment variables: `ADMIN_PASSWORD` and `CRON_SECRET`.
4. Deploy. The `buildCommand` in `vercel.json` runs `prisma db push` and the idempotent
   seed automatically, so tables are created and populated on the first deploy — no manual
   database steps. (The seed never overwrites results or entries on later deploys.)
5. The cron in `vercel.json` calls `/api/cron/sync` automatically.

Pushes to the repo's default branch trigger an auto-deploy.

### Self-hosted alternative (no Vercel)

Run anywhere with Node + Postgres: `npm run build && npm run start`. Replace Vercel Cron
with a system cron / `node-cron` that GETs `/api/cron/sync` with the `CRON_SECRET` bearer.

## Not yet built (intentional follow-ups)

- **Part 4 public submission** (`/submit/knockout`): the knockout prediction form opens
  after the group stage, once fixtures are known and deadlines are set. The data model,
  scoring (`scorePart4`) and admin knockout-fixture creation are already in place.
