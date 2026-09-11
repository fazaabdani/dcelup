import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { menuById } from "@/lib/menu";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await currentSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const definition = menuById(id);
  if (!definition) return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const delta = Number(body?.delta);
  if (!Number.isFinite(delta)) return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });

  const existing = await prisma.menuItem.upsert({
    where: { id: definition.id },
    create: { id: definition.id, groupId: "", name: definition.name, variant: definition.variant, price: definition.price, cost: definition.cost },
    update: {},
  });
  const nextCost = Math.max(0, existing.cost + delta);
  const menuItem = await prisma.menuItem.update({ where: { id: definition.id }, data: { cost: nextCost } });
  return NextResponse.json({ menuItem });
}
