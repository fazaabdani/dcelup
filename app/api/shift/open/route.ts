import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift } from "@/lib/shift";
import { todayKey } from "@/lib/today";

export async function POST() {
  const session = await currentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const date = todayKey();
  await getOrCreateShift(date);
  const shift = await prisma.shift.update({ where: { date }, data: { isOpen: true } });
  return NextResponse.json({ shift });
}
