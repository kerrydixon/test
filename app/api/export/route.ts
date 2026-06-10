import { isAdmin } from "@/lib/auth";
import { buildExportWorkbook } from "@/lib/export/excel";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  if (!(await isAdmin())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const wb = await buildExportWorkbook();
  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="WorldCup2026_Scores_${stamp}.xlsx"`,
    },
  });
}
