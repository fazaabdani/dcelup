import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift, logAction } from "@/lib/shift";
import { todayKey } from "@/lib/today";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { mode } = body || {};
  if (mode !== "sisa" && mode !== "diambil") return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const date = todayKey();
  await getOrCreateShift(date);
  const field = mode === "sisa" ? "leftovers" : "taken";
  const shift = await prisma.shift.update({ where: { date }, data: { [field]: {} } });
  await logAction(date, "resetReport", `Reset hitungan ${mode === "sisa" ? "Sisa" : "Diambil"}`, session.name);
  return NextResponse.json({ shift });
}
