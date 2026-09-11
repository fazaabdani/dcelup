import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { logAction } from "@/lib/shift";
import { todayKey } from "@/lib/today";

// Beda dari versi lama: karena tiap tanggal sudah punya baris Shift sendiri
// (lihat prisma/schema.prisma), "hari baru" tidak perlu tombol manual lagi -
// otomatis terjadi begitu tanggal WIB berganti. Tombol ini cuma untuk admin
// yang mau menutup penjualan lebih awal (mis. toko tutup lebih cepat).
export async function POST() {
  const session = await currentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const date = todayKey();
  const shift = await prisma.shift.update({ where: { date }, data: { isOpen: false } });
  await logAction(date, "closeShift", "Tutup penjualan hari ini oleh admin", session.name);
  return NextResponse.json({ shift });
}
