"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import type { CartLine } from "@/lib/calc";
import type { HistoryEntry, MenuData, SessionInfo, ShiftResponse } from "@/lib/types";
import { menuById } from "@/lib/menu";
import SalesTab from "@/components/SalesTab";
import CartTab from "@/components/CartTab";
import ReportTab from "@/components/ReportTab";
import AdminTab from "@/components/AdminTab";

type Tab = "jualan" | "keranjang" | "report" | "admin";

const POLL_MS = 5000;

export default function AppShell({ session }: { session: SessionInfo }) {
  const router = useRouter();
  const isAdmin = session.role === "ADMIN";

  const [tab, setTab] = useState<Tab>("jualan");
  const [data, setData] = useState<ShiftResponse | null>(null);
  const [menu, setMenu] = useState<MenuData[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("original");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchShift = useCallback(async () => {
    try {
      const res = await apiFetch<ShiftResponse>("/api/shift");
      setData(res);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tidak bisa terhubung ke server");
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await apiFetch<{ menu: MenuData[] }>("/api/menu");
      setMenu(res.menu);
    } catch {
      // Menu jarang berubah - kalau gagal sekali, polling shift berikutnya
      // tidak mengulang fetch menu; biarkan data lama dipakai.
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await apiFetch<{ history: HistoryEntry[] }>("/api/history");
      setHistory(res.history);
    } catch {
      // non-kritis, biarkan gagal senyap
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchShift();
    fetchMenu();
    pollRef.current = setInterval(fetchShift, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchShift, fetchMenu]);

  useEffect(() => {
    if (tab === "admin") fetchHistory();
  }, [tab, fetchHistory]);

  async function withSaving(fn: () => Promise<void>) {
    setSaving(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Aksi gagal, coba lagi");
    } finally {
      setSaving(false);
    }
  }

  function addToCart(id: string) {
    if (!data?.shift.isOpen) return;
    const definition = menuById(id);
    if (!definition) return;
    setCart((prev) => {
      const existing = prev.find((line) => line.id === id);
      if (existing) return prev.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line));
      return [...prev, { id: definition.id, name: definition.name, variant: definition.variant, price: definition.price, cost: definition.cost, qty: 1 }];
    });
  }

  function changeCartQty(id: string, delta: number) {
    setCart((prev) => prev.map((line) => (line.id === id ? { ...line, qty: line.qty + delta } : line)).filter((line) => line.qty > 0));
  }

  async function saveTransaction() {
    if (!data?.shift.isOpen || !cart.length) return;
    await withSaving(async () => {
      await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({ items: cart.map((line) => ({ id: line.id, qty: line.qty })) }),
      });
      setCart([]);
      setTab("jualan");
      await fetchShift();
    });
  }

  async function deleteTransaction(id: string) {
    if (!confirm("Hapus transaksi ini? Jejak hapus akan tetap terlihat oleh admin.")) return;
    await withSaving(async () => {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      await fetchShift();
    });
  }

  async function setMoney(type: "opening" | "physical" | "wage", amount: number) {
    await withSaving(async () => {
      await apiFetch("/api/shift/money", { method: "PATCH", body: JSON.stringify({ type, mode: "set", amount }) });
      await fetchShift();
    });
  }

  async function addMoney(type: "opening" | "physical" | "wage", amount: number) {
    await withSaving(async () => {
      await apiFetch("/api/shift/money", { method: "PATCH", body: JSON.stringify({ type, mode: "add", amount }) });
      await fetchShift();
    });
  }

  async function changeReport(mode: "sisa" | "diambil", key: string, delta: 1 | -1) {
    await withSaving(async () => {
      await apiFetch("/api/report/count", { method: "POST", body: JSON.stringify({ mode, key, delta }) });
      await fetchShift();
    });
  }

  async function resetReport(mode: "sisa" | "diambil") {
    const label = mode === "sisa" ? "Sisa" : "Diambil";
    if (!confirm(`Reset semua hitungan "${label}" ke nol?`)) return;
    await withSaving(async () => {
      await apiFetch("/api/report/reset", { method: "POST", body: JSON.stringify({ mode }) });
      await fetchShift();
    });
  }

  async function openShift() {
    await withSaving(async () => {
      await apiFetch("/api/shift/open", { method: "POST" });
      await fetchShift();
    });
  }

  async function closeShift() {
    if (!confirm("Tutup penjualan hari ini? Data yang sudah ada tetap tersimpan permanen di database.")) return;
    await withSaving(async () => {
      await apiFetch("/api/shift/close", { method: "POST" });
      await fetchShift();
    });
  }

  async function changeCost(id: string, delta: number) {
    await withSaving(async () => {
      await apiFetch(`/api/menu/${id}/cost`, { method: "PATCH", body: JSON.stringify({ delta }) });
      await fetchMenu();
    });
  }

  function exportBackup() {
    window.open(`/api/export?date=${data?.shift.date || ""}`, "_blank");
  }

  async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!data) {
    return (
      <section className="login-wrap">
        <div className="login-card">
          {error ? <div className="notice error">{error}</div> : <div className="notice">Memuat data...</div>}
        </div>
      </section>
    );
  }

  const tabs: [Tab, string, string][] = [
    ["jualan", "Jualan", "J"],
    ["keranjang", "Transaksi", "T"],
    ["report", "Report", "R"],
    ...(isAdmin ? ([["admin", "Admin", "A"]] as [Tab, string, string][]) : []),
  ];
  const activeTab = !isAdmin && tab === "admin" ? "jualan" : tab;

  return (
    <>
      <section className="shell">
        <header className="topbar">
          <div className="brand">
            <div className="logo">D</div>
            <div>
              <h1 className="brand-title">DCelup Chicken</h1>
              <p className="brand-subtitle">
                {session.name} - {data.shift.date}
              </p>
            </div>
          </div>
          <button className="pill logout" onClick={logout}>
            Keluar
          </button>
        </header>
        {error ? <div className="notice error">{error}</div> : null}
        {activeTab === "jualan" ? (
          <SalesTab
            shift={data.shift}
            cart={cart}
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            onAddToCart={addToCart}
            onClearCart={() => setCart([])}
            onSaveTransaction={saveTransaction}
            saving={saving}
          />
        ) : null}
        {activeTab === "keranjang" ? (
          <CartTab
            shift={data.shift}
            cart={cart}
            transactions={data.transactions}
            onChangeQty={changeCartQty}
            onClearCart={() => setCart([])}
            onSaveTransaction={saveTransaction}
            onDeleteTransaction={deleteTransaction}
            saving={saving}
          />
        ) : null}
        {activeTab === "report" ? (
          <ReportTab
            shift={data.shift}
            transactions={data.transactions}
            isAdmin={isAdmin}
            deletedTransactions={data.deletedTransactions || []}
            actionLog={data.actionLog || []}
            onSetMoney={setMoney}
            onAddMoney={addMoney}
            onChangeReport={changeReport}
            onResetReport={resetReport}
          />
        ) : null}
        {activeTab === "admin" && isAdmin ? (
          <AdminTab
            shift={data.shift}
            transactions={data.transactions}
            menu={menu}
            deletedTransactions={data.deletedTransactions || []}
            actionLog={data.actionLog || []}
            history={history}
            onOpenShift={openShift}
            onSetMoney={setMoney}
            onAddMoney={addMoney}
            onChangeCost={changeCost}
            onCloseShift={closeShift}
            onExport={exportBackup}
          />
        ) : null}
      </section>
      <nav className="bottom-nav" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map(([id, label, mark]) => (
          <button key={id} className={`nav-button ${activeTab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            <span>{mark}</span>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
