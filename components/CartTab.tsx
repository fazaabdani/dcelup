"use client";

import { cartTotal, rupiah } from "@/lib/calc";
import type { CartLine } from "@/lib/calc";
import type { ShiftData, TransactionData } from "@/lib/types";

export default function CartTab({
  shift,
  cart,
  transactions,
  onChangeQty,
  onClearCart,
  onSaveTransaction,
  onDeleteTransaction,
  saving,
}: {
  shift: ShiftData;
  cart: CartLine[];
  transactions: TransactionData[];
  onChangeQty: (id: string, delta: number) => void;
  onClearCart: () => void;
  onSaveTransaction: () => void;
  onDeleteTransaction: (id: string) => void;
  saving: boolean;
}) {
  const total = cartTotal(cart);
  const history = transactions.slice().reverse();

  return (
    <>
      <div className="section-title">
        <h2>Keranjang</h2>
        <span className="pill">{cart.length} item</span>
      </div>
      {cart.length ? (
        <div className="cart">
          {cart.map((line) => (
            <div className="cart-item" key={line.id}>
              <div>
                <div className="item-title">
                  {line.name} - {line.variant}
                </div>
                <div className="item-sub">
                  {rupiah.format(line.price)} x {line.qty}
                </div>
              </div>
              <div className="qty">
                <button onClick={() => onChangeQty(line.id, -1)}>-</button>
                <strong>{line.qty}</strong>
                <button onClick={() => onChangeQty(line.id, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cart-empty">Belum ada pesanan. Tap menu dulu.</div>
      )}
      <div className="checkout">
        <div className="total-box">
          <span>Total</span>
          <strong>{rupiah.format(total)}</strong>
        </div>
        <button className="tap-button warn" onClick={onClearCart}>
          Kosongkan
        </button>
        <button className="tap-button ok" onClick={onSaveTransaction} disabled={!shift.isOpen || !cart.length || saving}>
          Simpan
        </button>
      </div>
      <div className="section-title">
        <h2>Transaksi Hari Ini</h2>
        <span className="pill">Bisa hapus</span>
      </div>
      <div className="history-list">
        {history.length ? (
          history.map((tx) => {
            const detail = tx.items.map((item) => `${item.name} ${item.variant} x${item.qty}`).join(", ");
            return (
              <div className="history-item" key={tx.id}>
                <div className="history-top">
                  <span>{tx.time}</span>
                  <strong>{rupiah.format(tx.total)}</strong>
                </div>
                <div className="history-detail">{detail}</div>
                <button className="delete-button" onClick={() => onDeleteTransaction(tx.id)}>
                  Hapus transaksi
                </button>
              </div>
            );
          })
        ) : (
          <div className="cart-empty">Belum ada transaksi hari ini.</div>
        )}
      </div>
    </>
  );
}
