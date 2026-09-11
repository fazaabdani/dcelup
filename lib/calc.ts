import { DAILY_ELECTRIC, DAILY_MOM } from "@/lib/menu";

export type CartLine = { id: string; name: string; variant: string; price: number; cost: number; qty: number };
export type TransactionLike = { total: number; items: CartLine[]; deletedAt?: string | null };
export type ShiftMoney = { openingCash: number; physicalCash: number; dailyWage: number };

export function activeTransactions<T extends TransactionLike>(transactions: T[]): T[] {
  return transactions.filter((tx) => !tx.deletedAt);
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function soldTotal(transactions: TransactionLike[]): number {
  return activeTransactions(transactions).reduce((sum, tx) => sum + tx.total, 0);
}

export function soldCost(transactions: TransactionLike[]): number {
  return activeTransactions(transactions).reduce(
    (sum, tx) => sum + tx.items.reduce((inner, line) => inner + line.cost * line.qty, 0),
    0
  );
}

export function grossProfit(transactions: TransactionLike[]): number {
  return soldTotal(transactions) - soldCost(transactions);
}

export function netProfit(transactions: TransactionLike[], shift: ShiftMoney): number {
  return grossProfit(transactions) - DAILY_MOM - DAILY_ELECTRIC - shift.dailyWage;
}

export function expectedCash(transactions: TransactionLike[], shift: ShiftMoney): number {
  return shift.openingCash + soldTotal(transactions) - shift.dailyWage;
}

export function cashDiff(transactions: TransactionLike[], shift: ShiftMoney): number {
  return shift.physicalCash - expectedCash(transactions, shift);
}

export const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function shortMoney(amount: number): string {
  return amount >= 1000 ? `${amount / 1000}rb` : String(amount);
}
