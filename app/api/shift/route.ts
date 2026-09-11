import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift } from "@/lib/shift";
import { todayKey } from "@/lib/today";

export async function GET(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const today = todayKey();
  const date = searchParams.get("date") || today;

  // Cuma tanggal hari ini yang boleh membuat baris baru (itu yang bikin
  // rollover otomatis). Tanggal lain (mis. dicoba lewat query param manual)
  // harus read-only - kalau belum ada datanya, jangan diam-diam membuat
  // baris kosong permanen di DB.
  const shift =
    date === today
      ? await getOrCreateShift(date)
      : (await prisma.shift.findUnique({ where: { date } })) ?? {
          date,
          isOpen: false,
          openingCash: 0,
          physicalCash: 0,
          dailyWage: 0,
          leftovers: {},
          taken: {},
        };
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
