import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "dcelup_session";

export type SessionUser = {
  id: string;
  name: string;
  role: "ADMIN" | "KASIR";
  exp: number;
};

const secret = () => {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 16) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET belum diset (minimal 16 karakter). Set env var ini sebelum menjalankan di production."
    );
  }
  return "development-only-secret";
};

const encode = (v: string) => Buffer.from(v).toString("base64url");

export function signSession(user: Omit<SessionUser, "exp">) {
  const payload = encode(JSON.stringify({ ...user, exp: Date.now() + 12 * 60 * 60 * 1000 }));
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token?: string | null): SessionUser | null {
  try {
    if (!token) return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SessionUser;
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

// Kasir tidak punya baris di tabel User (memang tanpa akun, sesuai desain
// asli), jadi tidak ada re-check DB untuk role KASIR - re-check DB hanya
// relevan untuk admin (supaya akun yang di-nonaktifkan langsung ke-block).
export async function currentSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const claimed = verifySession(store.get(SESSION_COOKIE)?.value);
  if (!claimed) return null;
  if (claimed.role === "KASIR") return claimed;
  const user = await prisma.user.findUnique({ where: { id: claimed.id } });
  if (!user || !user.active) return null;
  return { ...claimed, name: user.name };
}
