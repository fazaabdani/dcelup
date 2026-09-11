"use client";

import { rupiah } from "@/lib/calc";
import type { ActionLogData, TransactionData } from "@/lib/types";

export default function AuditTrail({
  deletedTransactions,
  actionLog,
}: {
  deletedTransactions: TransactionData[];
  actionLog: ActionLogData[];
}) {
  return (
    <>
      <div className="section-title">
        <h2>Jejak Hapus Transaksi</h2>
        <span className="pill">{deletedTransactions.length} hapus</span>
      </div>
      <div className="history-list">
        {deletedTransactions.length ? (
          deletedTransactions
            .slice()
            .reverse()
            .map((tx) => {
              const detail = tx.items.map((item) => `${item.name} ${item.variant} x${item.qty}`).join(", ");
              return (
                <div className="history-item audit" key={tx.id}>
                  <div className="history-top">
                    <span>{tx.deletedAt}</span>
                    <strong>{rupiah.format(tx.total)}</strong>
                  </div>
                  <div className="history-detail">
                    Dihapus oleh {tx.deletedBy}. Transaksi jam {tx.time}. {detail}
                  </div>
                </div>
              );
            })
        ) : (
          <div className="cart-empty">Belum ada transaksi yang dihapus.</div>
        )}
      </div>
      <div className="section-title">
        <h2>Riwayat Aksi Admin</h2>
        <span className="pill">{actionLog.length} aksi</span>
      </div>
      <div className="history-list">
        {actionLog.length ? (
          actionLog.map((entry) => (
            <div className="history-item audit" key={entry.id}>
              <div className="history-top">
                <span>{new Date(entry.createdAt).toLocaleString("id-ID")}</span>
                <strong>{entry.type}</strong>
              </div>
              <div className="history-detail">
                {entry.detail} - oleh {entry.by}
              </div>
            </div>
          ))
        ) : (
          <div className="cart-empty">Belum ada aksi tercatat.</div>
        )}
      </div>
    </>
  );
}
