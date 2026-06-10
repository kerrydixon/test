import { isAdmin } from "@/lib/auth";
import { buildExportWorkbook } from "@/lib/export/excel";
import { buildCalcWorkbook } from "@/lib/export/excel-calc";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const calc = new URL(request.url).searchParams.get("calc") === "1";
  const wb = calc ? await buildCalcWorkbook() : await buildExportWorkbook();
  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  const name = calc
    ? `WorldCup2026_Calculator_${stamp}.xlsx`
    : `WorldCup2026_Scores_${stamp}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
