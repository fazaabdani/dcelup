import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { nowTimeWIB } from "@/lib/today";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

  // Soft-delete (bukan hapus baris) - jejaknya tetap terlihat admin lewat
  // GET /api/shift (field deletedTransactions), sama seperti versi lama.
  const transaction = await prisma.transaction.update({
    where: { id },
    data: { deletedAt: nowTimeWIB(), deletedBy: session.name },
  });
  return NextResponse.json({ transaction });
}
