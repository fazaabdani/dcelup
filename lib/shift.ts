import { prisma } from "@/lib/prisma";

// "Hari baru" terjadi otomatis di sini: kalau belum ada baris Shift untuk
// tanggal WIB hari ini, upsert akan membuatnya dengan default kosong. Data
// hari-hari sebelumnya tidak pernah dihapus/ditimpa - permanen per tanggal.
export async function getOrCreateShift(date: string) {
  return prisma.shift.upsert({
    where: { date },
    create: { date },
    update: {},
  });
}

export async function logAction(shiftDate: string | null, type: string, detail: string, by: string) {
  await prisma.actionLog.create({
    data: { shiftDate, type, detail, by },
  });
}
