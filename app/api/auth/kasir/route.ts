import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { signSession, SESSION_COOKIE } from "@/lib/session";

// Kasir memang tanpa akun/password (sesuai desain asli) - id sesi acak,
// tidak tersimpan di tabel User sama sekali.
export async function POST() {
  const response = NextResponse.json({ user: { name: "Kasir", role: "KASIR" } });
  response.cookies.set(SESSION_COOKIE, signSession({ id: randomUUID(), name: "Kasir", role: "KASIR" }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60,
    path: "/",
  });
  return response;
}
