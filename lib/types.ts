import type { CartLine } from "@/lib/calc";

export type SessionInfo = { name: string; role: "ADMIN" | "KASIR" };

export type ShiftData = {
  date: string;
  isOpen: boolean;
  openingCash: number;
  physicalCash: number;
  dailyWage: number;
  leftovers: Record<string, number>;
  taken: Record<string, number>;
};

export type TransactionData = {
  id: string;
  shiftDate: string;
  time: string;
  total: number;
  cashier: string;
  items: CartLine[];
  deletedAt: string | null;
  deletedBy: string | null;
};

export type ActionLogData = {
  id: string;
  type: string;
  detail: string;
  by: string;
  createdAt: string;
};

export type ShiftResponse = {
  shift: ShiftData;
  transactions: TransactionData[];
  deletedTransactions?: TransactionData[];
  actionLog?: ActionLogData[];
};

export type HistoryEntry = {
  date: string;
  total: number;
  transactionCount: number;
  closedManually: boolean;
};

export type MenuData = { id: string; name: string; variant: string; price: number; cost: number };
