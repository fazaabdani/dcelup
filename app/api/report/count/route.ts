import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift } from "@/lib/shift";
import { todayKey } from "@/lib/today";

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { mode, key, delta } = body || {};
  if ((mode !== "sisa" && mode !== "diambil") || typeof key !== "string" || (delta !== 1 && delta !== -1)) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const date = todayKey();
  const current = await getOrCreateShift(date);
  const field = mode === "sisa" ? "leftovers" : "taken";
  const target = { ...((current[field] as Record<string, number>) || {}) };
  target[key] = Math.max(0, (target[key] || 0) + delta);

  const shift = await prisma.shift.update({ where: { date }, data: { [field]: target } });
  return NextResponse.json({ shift });
}
