import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { todayKey } from "@/lib/today";

export async function GET() {
  const session = await currentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today = todayKey();
  const shifts = await prisma.shift.findMany({
    where: { date: { not: today } },
    orderBy: { date: "desc" },
    take: 30,
    include: { transactions: true },
  });

  const history = shifts.map((shift) => {
    const active = shift.transactions.filter((tx) => !tx.deletedAt);
    return {
      date: shift.date,
      total: active.reduce((sum, tx) => sum + tx.total, 0),
      transactionCount: active.length,
      closedManually: !shift.isOpen,
    };
  });

  return NextResponse.json({ history });
}
