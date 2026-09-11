// Katalog menu & kategori - jarang berubah, tetap konstanta statis (bukan
// tabel DB) sama seperti versi lama. Hanya `cost` per item yang dipindah ke
// tabel MenuItem (bisa diubah admin lewat PATCH /api/menu/[id]/cost).
export type MenuDefinition = {
  id: string;
  name: string;
  variant: string;
  price: number;
  cost: number;
};

export const MENU: MenuDefinition[] = [
  { id: "ori_dada", name: "Ayam Original", variant: "Dada", price: 10000, cost: 7000 },
  { id: "ori_paha", name: "Ayam Original", variant: "Paha", price: 10000, cost: 7000 },
  { id: "ori_sayap", name: "Ayam Original", variant: "Sayap", price: 9000, cost: 6500 },
  { id: "celup_dada", name: "Ayam Celup", variant: "Dada", price: 13000, cost: 8500 },
  { id: "celup_paha", name: "Ayam Celup", variant: "Paha", price: 13000, cost: 8500 },
  { id: "celup_sayap", name: "Ayam Celup", variant: "Sayap", price: 12000, cost: 8000 },
  { id: "ori_nasi_dada", name: "Original + Nasi", variant: "Dada", price: 14000, cost: 9000 },
  { id: "ori_nasi_paha", name: "Original + Nasi", variant: "Paha", price: 14000, cost: 9000 },
  { id: "ori_nasi_sayap", name: "Original + Nasi", variant: "Sayap", price: 13000, cost: 8500 },
  { id: "celup_nasi_dada", name: "Celup + Nasi", variant: "Dada", price: 16000, cost: 10500 },
  { id: "celup_nasi_paha", name: "Celup + Nasi", variant: "Paha", price: 16000, cost: 10500 },
  { id: "celup_nasi_sayap", name: "Celup + Nasi", variant: "Sayap", price: 16000, cost: 10500 },
  { id: "risol_1", name: "Risol Mayo", variant: "Satuan", price: 3500, cost: 2500 },
  { id: "risol_3", name: "Risol Mayo", variant: "Paket isi 3", price: 10000, cost: 7500 },
];

export const GROUPS = [
  { id: "original", label: "Ayam Original", mark: "OR", itemIds: ["ori_dada", "ori_paha", "ori_sayap"] },
  { id: "celup", label: "Ayam Celup", mark: "CL", itemIds: ["celup_dada", "celup_paha", "celup_sayap"] },
  {
    id: "original_nasi",
    label: "Original + Nasi",
    mark: "ON",
    itemIds: ["ori_nasi_dada", "ori_nasi_paha", "ori_nasi_sayap"],
  },
  {
    id: "celup_nasi",
    label: "Celup + Nasi",
    mark: "CN",
    itemIds: ["celup_nasi_dada", "celup_nasi_paha", "celup_nasi_sayap"],
  },
  { id: "risol_1", label: "Risol Satuan", mark: "R1", itemIds: ["risol_1"] },
  { id: "risol_3", label: "Risol Paket 3", mark: "R3", itemIds: ["risol_3"] },
];

export const REPORT_ITEMS = [
  { key: "ori_dada", label: "Original Dada" },
  { key: "ori_paha", label: "Original Paha" },
  { key: "ori_sayap", label: "Original Sayap" },
  { key: "celup_dada", label: "Celup Dada" },
  { key: "celup_paha", label: "Celup Paha" },
  { key: "celup_sayap", label: "Celup Sayap" },
  { key: "risol", label: "Risol Mayo" },
];

export const MONEY_BUTTONS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
export const QUICK_MONEY = [50000, 100000, 150000, 200000, 250000, 300000];
export const WAGE_QUICK_MONEY = [50000, 60000, 70000, 80000, 90000, 100000];
export const WAGE_ADD_MONEY = [5000, 10000, 20000];
export const DAILY_MOM = 20000;
export const DAILY_ELECTRIC = 10000;

export function menuById(id: string): MenuDefinition | undefined {
  return MENU.find((item) => item.id === id);
}

export function groupById(id: string) {
  return GROUPS.find((group) => group.id === id);
}
