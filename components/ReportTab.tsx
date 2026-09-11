"use client";

import { useState } from "react";
import { cashDiff, expectedCash, rupiah, soldTotal } from "@/lib/calc";
import { REPORT_ITEMS } from "@/lib/menu";
import MoneyPanel from "@/components/MoneyPanel";
import AuditTrail from "@/components/AuditTrail";
import type { ActionLogData, ShiftData, TransactionData } from "@/lib/types";

type ReportMode = "sisa" | "diambil";

export default function ReportTab({
  shift,
  transactions,
  isAdmin,
  deletedTransactions,
  actionLog,
  onSetMoney,
  onAddMoney,
  onChangeReport,
  onResetReport,
}: {
  shift: ShiftData;
  transactions: TransactionData[];
  isAdmin: boolean;
  deletedTransactions: TransactionData[];
  actionLog: ActionLogData[];
  onSetMoney: (type: "wage", amount: number) => void;
  onAddMoney: (type: "wage", amount: number) => void;
  onChangeReport: (mode: ReportMode, key: string, delta: 1 | -1) => void;
  onResetReport: (mode: ReportMode) => void;
}) {
  const [mode, setMode] = useState<ReportMode>("sisa");
  const target = mode === "sisa" ? shift.leftovers : shift.taken;

  return (
    <>
      <div className="section-title">
        <h2>Report Harian</h2>
        <span className="pill">{transactions.length} trx aktif</span>
      </div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Kembalian Admin</div>
          <div className="stat-value">{rupiah.format(shift.openingCash)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Penjualan App</div>
          <div className="stat-value">{rupiah.format(soldTotal(transactions))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gaji Diambil</div>
          <div className="stat-value">{rupiah.format(shift.dailyWage)}</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-label">Sisa Uang Harus Ada</div>
          <div className="stat-value">{rupiah.format(expectedCash(transactions, shift))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Uang Setor Fisik</div>
          <div className="stat-value">{rupiah.format(shift.physicalCash)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Selisih</div>
          <div className={`stat-value ${cashDiff(transactions, shift) >= 0 ? "good" : "bad"}`}>
            {rupiah.format(cashDiff(transactions, shift))}
          </div>
        </div>
      </div>
      <MoneyPanel
        title="Gaji Diambil Harian"
        value={shift.dailyWage}
        type="wage"
        onSet={(amount) => onSetMoney("wage", amount)}
        onAdd={(amount) => onAddMoney("wage", amount)}
      />
      <div className="section-title">
        <h2>Ayam Sisa / Diambil</h2>
      </div>
      <div className="variant-row">
        <button className={`tap-button ${mode === "sisa" ? "primary" : ""}`} onClick={() => setMode("sisa")}>
          Sisa
        </button>
        <button className={`tap-button ${mode === "diambil" ? "primary" : ""}`} onClick={() => setMode("diambil")}>
          Diambil
        </button>
        <button className="tap-button warn" onClick={() => onResetReport(mode)}>
          Reset
        </button>
      </div>
      <div className="section-title">
        <h2>{mode === "sisa" ? "Input Sisa" : "Input Diambil"}</h2>
        <span className="pill">Tanpa ketik</span>
      </div>
      <div className="report-list">
        {REPORT_ITEMS.map((item) => (
          <div className="report-row" key={item.key}>
            <strong>{item.label}</strong>
            <div className="qty">
              <button onClick={() => onChangeReport(mode, item.key, -1)}>-</button>
              <strong>{target[item.key] || 0}</strong>
              <button onClick={() => onChangeReport(mode, item.key, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      {isAdmin ? <AuditTrail deletedTransactions={deletedTransactions} actionLog={actionLog} /> : null}
    </>
  );
}
