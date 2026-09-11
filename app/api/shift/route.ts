import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift } from "@/lib/shift";
import { todayKey } from "@/lib/today";

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || todayKey();

  const shift = await getOrCreateShift(date);
  const transactions = await prisma.transaction.findMany({
    where: { shiftDate: date },
    orderBy: { createdAt: "asc" },
  });

  const active = transactions.filter((tx) => !tx.deletedAt);
  const payload: Record<string, unknown> = {
    shift,
    transactions: active,
  };

  if (session.role === "ADMIN") {
    payload.deletedTransactions = transactions.filter((tx) => tx.deletedAt);
    payload.actionLog = await prisma.actionLog.findMany({
      where: { shiftDate: date },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  return NextResponse.json(payload);
}
