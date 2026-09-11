import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift, logAction } from "@/lib/shift";
import { makePasswordHash, verifyPassword } from "@/lib/password";
import { todayKey } from "@/lib/today";

export async function PATCH(request: Request) {
  const session = await currentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const { currentPassword, newPassword } = body || {};
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password baru minimal 8 karakter" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: makePasswordHash(newPassword) } });
  // Dicatat dengan shiftDate hari ini (bukan null) supaya kelihatan di "Riwayat
  // Aksi Admin" yang sudah ada, meski ini bukan aksi shift - lebih penting
  // transparan daripada rapi secara model data. ActionLog.shiftDate adalah FK
  // ke Shift.date, jadi baris Shift hari ini harus dipastikan ada dulu.
  const date = todayKey();
  await getOrCreateShift(date);
  await logAction(date, "changePassword", "Password admin diganti", session.name);
  return NextResponse.json({ ok: true });
}
