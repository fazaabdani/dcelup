import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Node.js runtime (bukan Edge) supaya verifySession bisa pakai modul `crypto`.
export const runtime = "nodejs";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isStaticAsset = !path.startsWith("/api") && /\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|webmanifest|map)$/.test(path);
  // Cuma endpoint yang MEMANG harus bisa dipanggil tanpa sesi (login itu
  // sendiri) yang masuk daftar publik. /api/auth/password sengaja TIDAK di
  // sini walau namanya di bawah /api/auth - itu aksi admin yang sudah login,
  // biar gerbang pertama (middleware) juga menolaknya, bukan cuma dicek di
  // dalam route handler.
  const publicPath =
    isStaticAsset ||
    path.startsWith("/login") ||
    path === "/api/auth/login" ||
    path === "/api/auth/kasir" ||
    path === "/api/health" ||
    path.startsWith("/_next");
  if (publicPath) return NextResponse.next();

  // Verifikasi tanda-tangan cookie di sini (edge-safe, tanpa query DB).
  // Route handler tetap bertanggung jawab melakukan re-check DB untuk admin
  // (lihat currentSession di lib/session.ts) dan mengecek role per aksi -
  // middleware ini cuma gerbang pertama supaya request tanpa sesi valid
  // sama sekali langsung ditolak/diarahkan ke /login.
  const session = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (path.startsWith("/api")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!favicon.ico).*)"] };
