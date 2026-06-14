import { NextResponse } from "next/server";
import { sync } from "@/lib/ingestion/sync";
import { syncPlayerStats } from "@/lib/ingestion/stats-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a full sync fetches several pages + bulk DB writes

// Triggered by Vercel Cron (see vercel.json). Vercel sends the CRON_SECRET as a
// Bearer token; we reject anything else so the endpoint can't be hit publicly.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await sync();
  const stats = await syncPlayerStats();
  return NextResponse.json({ result, stats }, { status: result.ok ? 200 : 502 });
}
