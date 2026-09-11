import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { getOrCreateShift } from "@/lib/shift";
import { todayKey, nowTimeWIB } from "@/lib/today";
import { menuById } from "@/lib/menu";

type CartInput = { id: string; qty: number };

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const cart: CartInput[] = Array.isArray(body?.items) ? body.items : [];
  if (!cart.length) return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });

  const date = todayKey();
  const shift = await getOrCreateShift(date);
  if (!shift.isOpen) return NextResponse.json({ error: "Jualan belum dibuka" }, { status: 409 });

  // Harga & modal dihitung ulang di server dari katalog + DB - tidak percaya
  // angka price/cost yang dikirim client, supaya cashier device yang
  // dimodifikasi tidak bisa menyimpan transaksi dengan harga palsu.
  const items: { id: string; name: string; variant: string; price: number; cost: number; qty: number }[] = [];
  for (const line of cart) {
    const qty = Math.floor(Number(line?.qty));
    const menuItem = typeof line?.id === "string" ? menuById(line.id) : undefined;
    if (!menuItem || !Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: "Item keranjang tidak valid" }, { status: 400 });
    }
    const dbItem = await prisma.menuItem.findUnique({ where: { id: menuItem.id } });
    items.push({
      id: menuItem.id,
      name: menuItem.name,
      variant: menuItem.variant,
      price: menuItem.price,
      cost: dbItem?.cost ?? menuItem.cost,
      qty,
    });
  }
  const total = items.reduce((sum, line) => sum + line.price * line.qty, 0);

  const transaction = await prisma.transaction.create({
    data: {
      shiftDate: date,
      time: nowTimeWIB(),
      total,
      cashier: session.name,
      items,
    },
  });
  return NextResponse.json({ transaction });
}
