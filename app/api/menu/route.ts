import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { MENU } from "@/lib/menu";

export async function GET() {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbItems = await prisma.menuItem.findMany();
  const costById = new Map(dbItems.map((item) => [item.id, item.cost]));
  const menu = MENU.map((item) => ({ ...item, cost: costById.get(item.id) ?? item.cost }));
  return NextResponse.json({ menu });
}
