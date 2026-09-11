"use client";

import { rupiah, shortMoney } from "@/lib/calc";
import { MONEY_BUTTONS, QUICK_MONEY, WAGE_ADD_MONEY, WAGE_QUICK_MONEY } from "@/lib/menu";

type MoneyType = "opening" | "physical" | "wage";

export default function MoneyPanel({
  title,
  value,
  type,
  onSet,
  onAdd,
  children,
}: {
  title: string;
  value: number;
  type: MoneyType;
  onSet: (amount: number) => void;
  onAdd: (amount: number) => void;
  children?: React.ReactNode;
}) {
  const quickAmounts = type === "wage" ? WAGE_QUICK_MONEY : QUICK_MONEY;
  const addAmounts = type === "wage" ? WAGE_ADD_MONEY : MONEY_BUTTONS;
  return (
    <div className="panel">
      <div className="money-display">
        <span>
          <strong>{title}</strong>
        </span>
        <strong>{rupiah.format(value)}</strong>
      </div>
      <div className="quick-grid">
        {quickAmounts.map((amount) => (
          <button key={amount} className="tap-button" onClick={() => onSet(amount)}>
            {shortMoney(amount)}
          </button>
        ))}
      </div>
      <div className="section-title">
        <h2>Tambah Nominal</h2>
        <button className="pill" onClick={() => onSet(0)}>
          Reset
        </button>
      </div>
      <div className="money-grid">
        {addAmounts.map((amount) => (
          <button key={amount} className="tap-button" onClick={() => onAdd(amount)}>
            +{shortMoney(amount)}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
