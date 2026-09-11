import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { todayKey } from "@/lib/today";

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayKey();

  const shift = await prisma.shift.findUnique({
    where: { date },
    include: { transactions: true, actionLogs: true },
  });
  if (!shift) return NextResponse.json({ error: "Tidak ada data untuk tanggal ini" }, { status: 404 });

  const payload = { exportedAt: new Date().toISOString(), ...shift };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="dcelup-backup-${date}.json"`,
    },
  });
}
