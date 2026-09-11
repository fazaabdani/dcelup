"use client";

import { netProfit, rupiah, soldCost, soldTotal } from "@/lib/calc";
import { DAILY_ELECTRIC, DAILY_MOM } from "@/lib/menu";
import MoneyPanel from "@/components/MoneyPanel";
import AuditTrail from "@/components/AuditTrail";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import type { ActionLogData, HistoryEntry, MenuData, ShiftData, TransactionData } from "@/lib/types";

export default function AdminTab({
  shift,
  transactions,
  menu,
  deletedTransactions,
  actionLog,
  history,
  onOpenShift,
  onSetMoney,
  onAddMoney,
  onChangeCost,
  onCloseShift,
  onExport,
  onChangePassword,
}: {
  shift: ShiftData;
  transactions: TransactionData[];
  menu: MenuData[];
  deletedTransactions: TransactionData[];
  actionLog: ActionLogData[];
  history: HistoryEntry[];
  onOpenShift: () => void;
  onSetMoney: (type: "opening" | "physical", amount: number) => void;
  onAddMoney: (type: "opening" | "physical", amount: number) => void;
  onChangeCost: (id: string, delta: number) => void;
  onCloseShift: () => void;
  onExport: () => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}) {
  return (
    <>
      <div className="section-title">
        <h2>Admin</h2>
        <span className="pill">{shift.isOpen ? "Buka" : "Belum buka"}</span>
      </div>
      <MoneyPanel
        title="Kembalian Awal"
        value={shift.openingCash}
        type="opening"
        onSet={(amount) => onSetMoney("opening", amount)}
        onAdd={(amount) => onAddMoney("opening", amount)}
      >
        <button className="tap-button full ok" style={{ marginTop: 10 }} onClick={onOpenShift}>
          Buka Jualan
        </button>
      </MoneyPanel>
      <MoneyPanel
        title="Uang Setor Fisik"
        value={shift.physicalCash}
        type="physical"
        onSet={(amount) => onSetMoney("physical", amount)}
        onAdd={(amount) => onAddMoney("physical", amount)}
      />
      <div className="section-title">
        <h2>Ringkasan Profit Admin</h2>
      </div>
      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Penjualan App</div>
          <div className="stat-value">{rupiah.format(soldTotal(transactions))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Modal Terjual</div>
          <div className="stat-value">{rupiah.format(soldCost(transactions))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gaji Diambil</div>
          <div className="stat-value">{rupiah.format(shift.dailyWage)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ibu + Listrik</div>
          <div className="stat-value">{rupiah.format(DAILY_MOM + DAILY_ELECTRIC)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Profit Bersih</div>
          <div className={`stat-value ${netProfit(transactions, shift) >= 0 ? "good" : "bad"}`}>
            {rupiah.format(netProfit(transactions, shift))}
          </div>
        </div>
      </div>
      <div className="section-title">
        <h2>Modal Per Menu</h2>
        <span className="pill">+/- 500</span>
      </div>
      <div className="report-list">
        {menu.map((item) => (
          <div className="report-row" key={item.id}>
            <div>
              <strong>
                {item.name} - {item.variant}
              </strong>
              <div className="item-sub">Modal {rupiah.format(item.cost)}</div>
            </div>
            <div className="qty">
              <button onClick={() => onChangeCost(item.id, -500)}>-</button>
              <strong>500</strong>
              <button onClick={() => onChangeCost(item.id, 500)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <AuditTrail deletedTransactions={deletedTransactions} actionLog={actionLog} />
      {history.length ? (
        <>
          <div className="section-title">
            <h2>Riwayat Hari Sebelumnya</h2>
            <span className="pill">{history.length} hari</span>
          </div>
          <div className="history-list">
            {history.map((day) => (
              <div className="history-item" key={day.date}>
                <div className="history-top">
                  <span>{day.date}</span>
                  <strong>{rupiah.format(day.total)}</strong>
                </div>
                <div className="history-detail">
                  {day.transactionCount} transaksi aktif{day.closedManually ? " - ditutup admin" : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
      <div className="section-title">
        <h2>Akun</h2>
      </div>
      <ChangePasswordForm onSubmit={onChangePassword} />
      <div className="danger-zone">
        <button className="tap-button full" onClick={onExport}>
          Export Backup (JSON)
        </button>
        <button className="tap-button full warn" onClick={onCloseShift}>
          Tutup Penjualan Hari Ini
        </button>
      </div>
    </>
  );
}
