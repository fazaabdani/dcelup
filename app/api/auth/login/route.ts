import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { isRateLimited, clientKey } from "@/lib/rate-limit";
import { makePasswordHash, verifyPassword } from "@/lib/password";

// scryptSync sengaja CPU-heavy; tanpa batas, endpoint tanpa-auth ini jadi
// target murah untuk credential-stuffing / CPU-exhaustion.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

export async function POST(request: Request) {
  if (isRateLimited("login", clientKey(request), WINDOW_MS, MAX_REQUESTS)) {
    return NextResponse.json({ error: "Terlalu banyak percobaan, coba lagi sebentar lagi" }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Body bukan JSON valid" }, { status: 400 });
  const { username, password } = body;
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Data login tidak valid" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { username } });
  // Bootstrap: akun admin pertama dibuat otomatis saat login pertama kali
  // cocok dengan ADMIN_USERNAME/ADMIN_PASSWORD env - setelahnya password
  // tersimpan ter-hash di DB dan env tidak dipakai lagi untuk user ini.
  if (!user && username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    user = await prisma.user.create({
      data: { name: "Admin", username, passwordHash: makePasswordHash(password), role: "ADMIN" },
    });
  }
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Username atau password admin salah." }, { status: 401 });
  }

  const response = NextResponse.json({ user: { name: user.name, role: "ADMIN" } });
  response.cookies.set(SESSION_COOKIE, signSession({ id: user.id, name: user.name, role: "ADMIN" }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60,
    path: "/",
  });
  return response;
}
