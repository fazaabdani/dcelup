import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift } from "@/lib/shift";
import { todayKey } from "@/lib/today";

const FIELD_BY_TYPE: Record<string, "openingCash" | "physicalCash" | "dailyWage"> = {
  opening: "openingCash",
  physical: "physicalCash",
  wage: "dailyWage",
};

export async function PATCH(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { type, mode, amount } = body || {};
  const field = FIELD_BY_TYPE[type];
  if (!field || (mode !== "set" && mode !== "add") || typeof amount !== "number" || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  // "opening" (Kembalian Awal) dan "physical" (Uang Setor Fisik) cuma boleh
  // diubah admin - persis celah privilege-escalation yang sebelumnya bisa
  // dieksploitasi lewat console di versi client-only. "wage" (Gaji Diambil)
  // memang fitur kasir, dibiarkan terbuka untuk sesi apa saja.
  if ((type === "opening" || type === "physical") && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const date = todayKey();
  await getOrCreateShift(date);
  const current = await prisma.shift.findUniqueOrThrow({ where: { date } });
  const nextValue = mode === "set" ? amount : current[field] + amount;

  const shift = await prisma.shift.update({
    where: { date },
    data: { [field]: nextValue },
  });
  return NextResponse.json({ shift });
}
