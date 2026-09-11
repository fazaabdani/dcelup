import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";

export async function GET() {
  const session = await currentSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { name: session.name, role: session.role } });
}
