"use client";

import { cartTotal, rupiah } from "@/lib/calc";
import { GROUPS, menuById } from "@/lib/menu";
import type { CartLine } from "@/lib/calc";
import type { ShiftData } from "@/lib/types";

export default function SalesTab({
  shift,
  cart,
  selectedGroup,
  onSelectGroup,
  onAddToCart,
  onClearCart,
  onSaveTransaction,
  saving,
}: {
  shift: ShiftData;
  cart: CartLine[];
  selectedGroup: string;
  onSelectGroup: (id: string) => void;
  onAddToCart: (id: string) => void;
  onClearCart: () => void;
  onSaveTransaction: () => void;
  saving: boolean;
}) {
  const active = GROUPS.find((group) => group.id === selectedGroup) || GROUPS[0];
  const activeItems = active.itemIds.map((id) => menuById(id)!).filter(Boolean);
  const total = cartTotal(cart);

  return (
    <>
      {!shift.isOpen ? (
        <div className="notice">Jualan belum dibuka. Admin isi kembalian awal lalu tap Buka Jualan.</div>
      ) : null}
      <div className="section-title">
        <h2>Pilih Menu</h2>
        <span className="pill">{rupiah.format(total)}</span>
      </div>
      <div className="grid">
        {GROUPS.map((group) => {
          const first = menuById(group.itemIds[0])!;
          const last = menuById(group.itemIds[group.itemIds.length - 1])!;
          const price =
            first.price === last.price
              ? rupiah.format(first.price)
              : `${rupiah.format(last.price)}-${rupiah.format(first.price)}`;
          return (
            <button
              key={group.id}
              className={`menu-card ${selectedGroup === group.id ? "selected" : ""}`}
              onClick={() => onSelectGroup(group.id)}
            >
              <span className="menu-emoji">{group.mark}</span>
              <span className="menu-name">{group.label}</span>
              <span className="menu-price">{price}</span>
            </button>
          );
        })}
      </div>
      <div className="section-title">
        <h2>{active.label}</h2>
        <span className="pill">Tap varian</span>
      </div>
      <div className="variant-row">
        {activeItems.map((item) => (
          <button key={item.id} className="tap-button primary" onClick={() => onAddToCart(item.id)}>
            {item.variant}
            <br />
            {rupiah.format(item.price)}
          </button>
        ))}
      </div>
      {cart.length ? (
        <div className="checkout">
          <div className="total-box">
            <span>Total</span>
            <strong>{rupiah.format(total)}</strong>
          </div>
          <button className="tap-button warn" onClick={onClearCart}>
            Batal
          </button>
          <button className="tap-button ok" onClick={onSaveTransaction} disabled={!shift.isOpen || saving}>
            Simpan
          </button>
        </div>
      ) : null}
    </>
  );
}
