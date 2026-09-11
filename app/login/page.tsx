"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loginCashier() {
    setBusy(true);
    try {
      await apiFetch("/api/auth/kasir", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitAdmin(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="login-wrap">
      <div className="login-card">
        <div className="login-hero">
          <div className="logo">D</div>
          <h1>DCelup Chicken</h1>
          <p>Kasir langsung masuk. Admin pakai password.</p>
        </div>
        <div className="login-buttons">
          <button className="role-button" onClick={loginCashier} disabled={busy}>
            <span>
              <strong>Masuk Kasir</strong>
              <span>Langsung buka kasir tanpa akun khusus</span>
            </span>
            <b className="arrow">&gt;</b>
          </button>
        </div>
        <form className="admin-login" onSubmit={submitAdmin}>
          <h2>Login Admin</h2>
          <label htmlFor="adminUsername">Username</label>
          <input
            id="adminUsername"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <div className="form-error">{error}</div> : null}
          <button className="tap-button primary full" type="submit" disabled={busy}>
            Masuk Admin
          </button>
        </form>
      </div>
    </section>
  );
}
