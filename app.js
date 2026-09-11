const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const MENU = [
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

const GROUPS = [
  { id: "original", label: "Ayam Original", mark: "OR", itemIds: ["ori_dada", "ori_paha", "ori_sayap"] },
  { id: "celup", label: "Ayam Celup", mark: "CL", itemIds: ["celup_dada", "celup_paha", "celup_sayap"] },
  { id: "original_nasi", label: "Original + Nasi", mark: "ON", itemIds: ["ori_nasi_dada", "ori_nasi_paha", "ori_nasi_sayap"] },
  { id: "celup_nasi", label: "Celup + Nasi", mark: "CN", itemIds: ["celup_nasi_dada", "celup_nasi_paha", "celup_nasi_sayap"] },
  { id: "risol_1", label: "Risol Satuan", mark: "R1", itemIds: ["risol_1"] },
  { id: "risol_3", label: "Risol Paket 3", mark: "R3", itemIds: ["risol_3"] },
];

const REPORT_ITEMS = [
  { key: "ori_dada", label: "Original Dada" },
  { key: "ori_paha", label: "Original Paha" },
  { key: "ori_sayap", label: "Original Sayap" },
  { key: "celup_dada", label: "Celup Dada" },
  { key: "celup_paha", label: "Celup Paha" },
  { key: "celup_sayap", label: "Celup Sayap" },
  { key: "risol", label: "Risol Mayo" },
];

const MONEY_BUTTONS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
const QUICK_MONEY = [50000, 100000, 150000, 200000, 250000, 300000];
const WAGE_QUICK_MONEY = [50000, 60000, 70000, 80000, 90000, 100000];
const WAGE_ADD_MONEY = [5000, 10000, 20000];
const DAILY_MOM = 20000;
const DAILY_ELECTRIC = 10000;
const STORAGE_KEY = "dcelup-chicken-state-v2";
const ADMIN_USERNAME = "admin";
// SHA-256 of the demo password (documented in README). Avoids leaving the
// plaintext sitting in source; still not a substitute for server-side auth.
const ADMIN_PASSWORD_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isAdmin() {
  return state.user?.role === "admin";
}

function logAction(type, detail) {
  state.actionLog ||= [];
  state.actionLog.push({
    type,
    detail,
    at: new Date().toLocaleString("id-ID"),
    by: state.user?.name || "system",
  });
  state.actionLog = state.actionLog.slice(-50);
}

const defaultShift = () => ({
  date: todayKey(),
  openingCash: 0,
  physicalCash: 0,
  dailyWage: 0,
  leftovers: {},
  taken: {},
  isOpen: false,
});

const defaultState = {
  user: null,
  tab: "jualan",
  selectedGroup: "original",
  cart: [],
  reportMode: "sisa",
  adminError: "",
  shift: defaultShift(),
  transactions: [],
  deletedTransactions: [],
  history: [],
  actionLog: [],
  costs: Object.fromEntries(MENU.map((item) => [item.id, item.cost])),
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return normalizeState(saved ? { ...defaultState, ...saved } : structuredClone(defaultState));
  } catch {
    return structuredClone(defaultState);
  }
}

function archiveDay(target, reason) {
  const hasData =
    (Array.isArray(target.transactions) && target.transactions.length) ||
    (Array.isArray(target.deletedTransactions) && target.deletedTransactions.length) ||
    target.shift?.isOpen;
  if (!hasData) return;
  target.history = Array.isArray(target.history) ? target.history : [];
  target.history.unshift({
    date: target.shift?.date || "unknown",
    shift: target.shift,
    transactions: target.transactions,
    deletedTransactions: target.deletedTransactions,
    actionLog: target.actionLog || [],
    archivedAt: new Date().toISOString(),
    reason,
  });
  target.history = target.history.slice(0, 30);
}

function normalizeState(next) {
  if (!Array.isArray(next.history)) next.history = [];
  if (!Array.isArray(next.actionLog)) next.actionLog = [];
  if (!next.shift || next.shift.date !== todayKey()) {
    archiveDay(next, "auto-rollover");
    next.shift = defaultShift();
    next.transactions = [];
    next.deletedTransactions = [];
    next.actionLog.push({
      type: "rollover",
      detail: "Pergantian tanggal otomatis - data hari sebelumnya diarsipkan",
      at: new Date().toLocaleString("id-ID"),
      by: "system",
    });
  }
  next.shift.leftovers ||= {};
  next.shift.taken ||= {};
  next.shift.dailyWage ||= 0;
  next.shift.physicalCash ||= 0;
  next.costs ||= Object.fromEntries(MENU.map((item) => [item.id, item.cost]));
  if (!Array.isArray(next.cart)) next.cart = [];
  if (!Array.isArray(next.transactions)) next.transactions = [];
  if (!Array.isArray(next.deletedTransactions)) next.deletedTransactions = [];
  next.tab ||= "jualan";
  if (!GROUPS.some((group) => group.id === next.selectedGroup)) next.selectedGroup = "original";
  next.reportMode ||= "sisa";
  next.adminError ||= "";
  return next;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function todayKey(date = new Date()) {
  // WIB (Asia/Jakarta), bukan UTC - toISOString() lama bikin rollover meleset
  // sekitar jam 00.00-06.59 WIB.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

function menuById(id) {
  return MENU.find((item) => item.id === id);
}

function itemCost(item) {
  return Number(state.costs[item.id] ?? item.cost);
}

function activeTransactions() {
  return state.transactions.filter((tx) => !tx.deletedAt);
}

function totalCart() {
  return state.cart.reduce((sum, line) => sum + line.price * line.qty, 0);
}

function soldTotal() {
  return activeTransactions().reduce((sum, tx) => sum + tx.total, 0);
}

function soldCost() {
  return activeTransactions().reduce(
    (sum, tx) => sum + tx.items.reduce((inner, line) => inner + line.cost * line.qty, 0),
    0
  );
}

function grossProfit() {
  return soldTotal() - soldCost();
}

function netProfit() {
  return grossProfit() - DAILY_MOM - DAILY_ELECTRIC - state.shift.dailyWage;
}

function expectedCash() {
  return state.shift.openingCash + soldTotal() - state.shift.dailyWage;
}

function cashDiff() {
  return state.shift.physicalCash - expectedCash();
}

function app(html) {
  document.querySelector("#app").innerHTML = html;
}

function render() {
  try {
    save();
    if (!state.user) {
      renderLogin();
      return;
    }
    renderShell();
  } catch (err) {
    console.error("Render error:", err);
    renderCrash();
  }
}

function renderCrash() {
  app(`
    <section class="login-wrap">
      <div class="login-card">
        <div class="login-hero">
          <div class="logo">!</div>
          <h1>Data Rusak</h1>
          <p>Aplikasi menemukan data tersimpan yang tidak valid dan tidak bisa ditampilkan.</p>
        </div>
        <button class="tap-button full warn" onclick="hardReset()">Reset Data Lokal</button>
        <div class="notice">Transaksi hari ini yang belum di-export lewat menu Admin akan hilang setelah reset.</div>
      </div>
    </section>
  `);
}

function hardReset() {
  if (!confirm("Reset seluruh data lokal? Tindakan ini tidak bisa dibatalkan.")) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function renderLogin() {
  app(`
    <section class="login-wrap">
      <div class="login-card">
        <div class="login-hero">
          <div class="logo">D</div>
          <h1>DCelup Chicken</h1>
          <p>Kasir langsung masuk. Admin pakai password.</p>
        </div>
        <div class="login-buttons">
          <button class="role-button" onclick="loginCashier()">
            <span><strong>Masuk Kasir</strong><span>Langsung buka kasir tanpa akun khusus</span></span>
            <b class="arrow">&gt;</b>
          </button>
        </div>
        <form class="admin-login" onsubmit="adminLogin(event)">
          <h2>Login Admin</h2>
          <label for="adminUsername">Username</label>
          <input id="adminUsername" autocomplete="username" />
          <label for="adminPassword">Password</label>
          <input id="adminPassword" type="password" autocomplete="current-password" />
          ${state.adminError ? `<div class="form-error">${state.adminError}</div>` : ""}
          <button class="tap-button primary full" type="submit">Masuk Admin</button>
        </form>
        <div class="notice">Admin awal: username admin, password admin123.</div>
      </div>
    </section>
  `);
}

function renderShell() {
  if (state.user.role !== "admin" && state.tab === "admin") state.tab = "jualan";
  const tabs = [
    ["jualan", "Jualan", "J"],
    ["keranjang", "Transaksi", "T"],
    ["report", "Report", "R"],
    ["admin", "Admin", "A"],
  ].filter((tab) => state.user.role === "admin" || tab[0] !== "admin");
  const content = {
    jualan: renderSales(),
    keranjang: renderCart(),
    report: renderReport(),
    admin: renderAdmin(),
  }[state.tab];

  app(`
    <section class="shell">
      <header class="topbar">
        <div class="brand">
          <div class="logo">D</div>
          <div>
            <h1 class="brand-title">DCelup Chicken</h1>
            <p class="brand-subtitle">${state.user.name} - ${todayKey()}</p>
          </div>
        </div>
        <button class="pill logout" onclick="logout()">Keluar</button>
      </header>
      ${content}
    </section>
    <nav class="bottom-nav" style="grid-template-columns: repeat(${tabs.length}, 1fr)">
      ${tabs
        .map(
          ([id, label, mark]) => `
            <button class="nav-button ${state.tab === id ? "active" : ""}" onclick="setTab('${id}')">
              <span>${mark}</span>${label}
            </button>
          `
        )
        .join("")}
    </nav>
  `);
}

function renderSales() {
  const active = GROUPS.find((group) => group.id === state.selectedGroup) || GROUPS[0];
  const activeItems = active.itemIds.map(menuById);
  return `
    ${!state.shift.isOpen ? closedShiftNotice() : ""}
    <div class="section-title"><h2>Pilih Menu</h2><span class="pill">${rupiah.format(totalCart())}</span></div>
    <div class="grid">
      ${GROUPS.map((group) => {
        const first = menuById(group.itemIds[0]);
        const last = menuById(group.itemIds[group.itemIds.length - 1]);
        const price = first.price === last.price ? rupiah.format(first.price) : `${rupiah.format(last.price)}-${rupiah.format(first.price)}`;
        return `
          <button class="menu-card ${state.selectedGroup === group.id ? "selected" : ""}" onclick="selectGroup('${group.id}')">
            <span class="menu-emoji">${group.mark}</span>
            <span class="menu-name">${group.label}</span>
            <span class="menu-price">${price}</span>
          </button>
        `;
      }).join("")}
    </div>
    <div class="section-title"><h2>${active.label}</h2><span class="pill">Tap varian</span></div>
    <div class="variant-row">
      ${activeItems
        .map(
          (item) => `
            <button class="tap-button primary" onclick="addToCart('${item.id}')">
              ${item.variant}<br>${rupiah.format(item.price)}
            </button>
          `
        )
        .join("")}
    </div>
    ${state.cart.length ? `<div class="checkout">
      <div class="total-box"><span>Total</span><strong>${rupiah.format(totalCart())}</strong></div>
      <button class="tap-button warn" onclick="clearCart()">Batal</button>
      <button class="tap-button ok" onclick="saveTransaction()" ${state.shift.isOpen ? "" : "disabled"}>Simpan</button>
    </div>` : ""}
  `;
}

function renderCart() {
  return `
    <div class="section-title"><h2>Keranjang</h2><span class="pill">${state.cart.length} item</span></div>
    ${state.cart.length ? `<div class="cart">${state.cart.map(renderCartItem).join("")}</div>` : `<div class="cart-empty">Belum ada pesanan. Tap menu dulu.</div>`}
    <div class="checkout">
      <div class="total-box"><span>Total</span><strong>${rupiah.format(totalCart())}</strong></div>
      <button class="tap-button warn" onclick="clearCart()">Kosongkan</button>
      <button class="tap-button ok" onclick="saveTransaction()" ${state.shift.isOpen && state.cart.length ? "" : "disabled"}>Simpan</button>
    </div>
    <div class="section-title"><h2>Transaksi Hari Ini</h2><span class="pill">Bisa hapus</span></div>
    <div class="history-list">
      ${activeTransactions().slice().reverse().map(renderHistory).join("") || `<div class="cart-empty">Belum ada transaksi hari ini.</div>`}
    </div>
  `;
}

function renderCartItem(line) {
  return `
    <div class="cart-item">
      <div>
        <div class="item-title">${line.name} - ${line.variant}</div>
        <div class="item-sub">${rupiah.format(line.price)} x ${line.qty}</div>
      </div>
      <div class="qty">
        <button onclick="changeCartQty('${line.id}', -1)">-</button>
        <strong>${line.qty}</strong>
        <button onclick="changeCartQty('${line.id}', 1)">+</button>
      </div>
    </div>
  `;
}

function renderHistory(tx) {
  const detail = tx.items.map((item) => `${item.name} ${item.variant} x${item.qty}`).join(", ");
  return `
    <div class="history-item">
      <div class="history-top"><span>${tx.time}</span><strong>${rupiah.format(tx.total)}</strong></div>
      <div class="history-detail">${detail}</div>
      <button class="delete-button" onclick="deleteTransaction('${tx.id}')">Hapus transaksi</button>
    </div>
  `;
}

function renderReport() {
  const isAdmin = state.user.role === "admin";
  return `
    <div class="section-title"><h2>Report Harian</h2><span class="pill">${activeTransactions().length} trx aktif</span></div>
    <div class="stats">
      <div class="stat-card"><div class="stat-label">Kembalian Admin</div><div class="stat-value">${rupiah.format(state.shift.openingCash)}</div></div>
      <div class="stat-card"><div class="stat-label">Penjualan App</div><div class="stat-value">${rupiah.format(soldTotal())}</div></div>
      <div class="stat-card"><div class="stat-label">Gaji Diambil</div><div class="stat-value">${rupiah.format(state.shift.dailyWage)}</div></div>
      <div class="stat-card highlight"><div class="stat-label">Sisa Uang Harus Ada</div><div class="stat-value">${rupiah.format(expectedCash())}</div></div>
      <div class="stat-card"><div class="stat-label">Uang Setor Fisik</div><div class="stat-value">${rupiah.format(state.shift.physicalCash)}</div></div>
      <div class="stat-card"><div class="stat-label">Selisih</div><div class="stat-value ${cashDiff() >= 0 ? "good" : "bad"}">${rupiah.format(cashDiff())}</div></div>
    </div>
    ${renderMoneyPanel("Gaji Diambil Harian", state.shift.dailyWage, "wage")}
    <div class="section-title"><h2>Ayam Sisa / Diambil</h2></div>
    <div class="variant-row">
      <button class="tap-button ${state.reportMode === "sisa" ? "primary" : ""}" onclick="setReportMode('sisa')">Sisa</button>
      <button class="tap-button ${state.reportMode === "diambil" ? "primary" : ""}" onclick="setReportMode('diambil')">Diambil</button>
      <button class="tap-button warn" onclick="resetReportCounts()">Reset</button>
    </div>
    <div class="section-title"><h2>${state.reportMode === "sisa" ? "Input Sisa" : "Input Diambil"}</h2><span class="pill">Tanpa ketik</span></div>
    <div class="report-list">
      ${REPORT_ITEMS.map((item) => renderReportRow(item)).join("")}
    </div>
    ${isAdmin ? renderAuditTrail() : ""}
  `;
}

function renderReportRow(item) {
  const target = state.reportMode === "sisa" ? state.shift.leftovers : state.shift.taken;
  const qty = target[item.key] || 0;
  return `
    <div class="report-row">
      <strong>${item.label}</strong>
      <div class="qty">
        <button onclick="changeReport('${item.key}', -1)">-</button>
        <strong>${qty}</strong>
        <button onclick="changeReport('${item.key}', 1)">+</button>
      </div>
    </div>
  `;
}

function renderAdmin() {
  if (state.user.role !== "admin") return renderReport();
  return `
    <div class="section-title"><h2>Admin</h2><span class="pill">${state.shift.isOpen ? "Buka" : "Belum buka"}</span></div>
    ${renderMoneyPanel("Kembalian Awal", state.shift.openingCash, "opening")}
    ${renderMoneyPanel("Uang Setor Fisik", state.shift.physicalCash, "physical")}
    <div class="section-title"><h2>Ringkasan Profit Admin</h2></div>
    <div class="stats">
      <div class="stat-card"><div class="stat-label">Penjualan App</div><div class="stat-value">${rupiah.format(soldTotal())}</div></div>
      <div class="stat-card"><div class="stat-label">Modal Terjual</div><div class="stat-value">${rupiah.format(soldCost())}</div></div>
      <div class="stat-card"><div class="stat-label">Gaji Diambil</div><div class="stat-value">${rupiah.format(state.shift.dailyWage)}</div></div>
      <div class="stat-card"><div class="stat-label">Ibu + Listrik</div><div class="stat-value">${rupiah.format(DAILY_MOM + DAILY_ELECTRIC)}</div></div>
      <div class="stat-card"><div class="stat-label">Profit Bersih</div><div class="stat-value ${netProfit() >= 0 ? "good" : "bad"}">${rupiah.format(netProfit())}</div></div>
      <div class="stat-card highlight"><div class="stat-label">Sisa Uang Harus Ada</div><div class="stat-value">${rupiah.format(expectedCash())}</div></div>
    </div>
    <div class="section-title"><h2>Modal Per Menu</h2><span class="pill">+/- 500</span></div>
    <div class="report-list">
      ${MENU.map(renderCostRow).join("")}
    </div>
    ${renderAuditTrail()}
    ${renderHistoryList()}
    <div class="danger-zone">
      <button class="tap-button full" onclick="exportBackup()">Export Backup (JSON)</button>
      <button class="tap-button full warn" onclick="newDay()">Tutup & Mulai Hari Baru</button>
    </div>
  `;
}

function renderMoneyPanel(title, value, type) {
  const quickAmounts = type === "wage" ? WAGE_QUICK_MONEY : QUICK_MONEY;
  const addAmounts = type === "wage" ? WAGE_ADD_MONEY : MONEY_BUTTONS;
  return `
    <div class="panel">
      <div class="money-display">
        <span><strong>${title}</strong></span>
        <strong>${rupiah.format(value)}</strong>
      </div>
      <div class="quick-grid">
        ${quickAmounts.map((amount) => `<button class="tap-button" onclick="setMoney('${type}', ${amount})">${shortMoney(amount)}</button>`).join("")}
      </div>
      <div class="section-title"><h2>Tambah Nominal</h2><button class="pill" onclick="setMoney('${type}', 0)">Reset</button></div>
      <div class="money-grid">
        ${addAmounts.map((amount) => `<button class="tap-button" onclick="addMoney('${type}', ${amount})">+${shortMoney(amount)}</button>`).join("")}
      </div>
      ${type === "opening" ? `<button class="tap-button full ok" style="margin-top:10px" onclick="openShift()">Buka Jualan</button>` : ""}
    </div>
  `;
}

function renderCostRow(item) {
  return `
    <div class="report-row">
      <div>
        <strong>${item.name} - ${item.variant}</strong>
        <div class="item-sub">Modal ${rupiah.format(itemCost(item))}</div>
      </div>
      <div class="qty">
        <button onclick="changeCost('${item.id}', -500)">-</button>
        <strong>500</strong>
        <button onclick="changeCost('${item.id}', 500)">+</button>
      </div>
    </div>
  `;
}

function renderAuditTrail() {
  return `
    <div class="section-title"><h2>Jejak Hapus Transaksi</h2><span class="pill">${state.deletedTransactions.length} hapus</span></div>
    <div class="history-list">
      ${
        state.deletedTransactions
          .slice()
          .reverse()
          .map((tx) => {
            const detail = tx.items.map((item) => `${item.name} ${item.variant} x${item.qty}`).join(", ");
            return `
              <div class="history-item audit">
                <div class="history-top"><span>${tx.deletedAt}</span><strong>${rupiah.format(tx.total)}</strong></div>
                <div class="history-detail">Dihapus oleh ${tx.deletedBy}. Transaksi jam ${tx.time}. ${detail}</div>
              </div>
            `;
          })
          .join("") || `<div class="cart-empty">Belum ada transaksi yang dihapus.</div>`
      }
    </div>
    <div class="section-title"><h2>Riwayat Aksi Admin</h2><span class="pill">${(state.actionLog || []).length} aksi</span></div>
    <div class="history-list">
      ${
        (state.actionLog || [])
          .slice()
          .reverse()
          .slice(0, 20)
          .map(
            (entry) => `
              <div class="history-item audit">
                <div class="history-top"><span>${entry.at}</span><strong>${entry.type}</strong></div>
                <div class="history-detail">${entry.detail} - oleh ${entry.by}</div>
              </div>
            `
          )
          .join("") || `<div class="cart-empty">Belum ada aksi tercatat.</div>`
      }
    </div>
  `;
}

function renderHistoryList() {
  const history = state.history || [];
  if (!history.length) return "";
  return `
    <div class="section-title"><h2>Riwayat Hari Sebelumnya</h2><span class="pill">${history.length} hari</span></div>
    <div class="history-list">
      ${history
        .map((day) => {
          const activeTx = (day.transactions || []).filter((tx) => !tx.deletedAt);
          const total = activeTx.reduce((sum, tx) => sum + tx.total, 0);
          return `
            <div class="history-item">
              <div class="history-top"><span>${day.date}</span><strong>${rupiah.format(total)}</strong></div>
              <div class="history-detail">${activeTx.length} transaksi aktif - ${day.reason === "auto-rollover" ? "arsip otomatis" : "ditutup admin"}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function closedShiftNotice() {
  return `<div class="notice">Jualan belum dibuka. Admin isi kembalian awal lalu tap Buka Jualan.</div>`;
}

function shortMoney(amount) {
  return amount >= 1000 ? `${amount / 1000}rb` : String(amount);
}

async function adminLogin(event) {
  event.preventDefault();
  const username = document.querySelector("#adminUsername").value.trim();
  const password = document.querySelector("#adminPassword").value;
  const passwordHash = await sha256Hex(password);
  if (username === ADMIN_USERNAME && passwordHash === ADMIN_PASSWORD_HASH) {
    state.adminError = "";
    state.user = { role: "admin", name: "Admin" };
    state.tab = state.shift.isOpen ? "report" : "admin";
  } else {
    state.adminError = "Username atau password admin salah.";
  }
  render();
}

function loginCashier() {
  state.adminError = "";
  state.user = { role: "kasir", name: "Kasir" };
  state.tab = "jualan";
  render();
}

function logout() {
  state.user = null;
  render();
}

function setTab(tab) {
  state.tab = tab;
  render();
}

function selectGroup(id) {
  state.selectedGroup = id;
  render();
}

function addToCart(id) {
  if (!state.shift.isOpen) return;
  const item = menuById(id);
  const existing = state.cart.find((line) => line.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      variant: item.variant,
      price: item.price,
      cost: itemCost(item),
      qty: 1,
    });
  }
  render();
}

function changeCartQty(id, delta) {
  const line = state.cart.find((item) => item.id === id);
  if (!line) return;
  line.qty += delta;
  state.cart = state.cart.filter((item) => item.qty > 0);
  render();
}

function clearCart() {
  state.cart = [];
  render();
}

function saveTransaction() {
  if (!state.shift.isOpen || state.cart.length === 0) return;
  const now = new Date();
  state.transactions.push({
    id: `trx_${Date.now()}`,
    time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    total: totalCart(),
    cashier: state.user.name,
    items: state.cart.map((line) => ({ ...line })),
  });
  state.cart = [];
  state.tab = "jualan";
  render();
}

function deleteTransaction(id) {
  const tx = state.transactions.find((item) => item.id === id && !item.deletedAt);
  if (!tx) return;
  if (!confirm("Hapus transaksi ini? Jejak hapus akan tetap terlihat oleh admin.")) return;
  const stamp = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  tx.deletedAt = stamp;
  tx.deletedBy = state.user.name;
  state.deletedTransactions.push({ ...tx, items: tx.items.map((item) => ({ ...item })) });
  render();
}

function setReportMode(mode) {
  state.reportMode = mode;
  render();
}

function changeReport(key, delta) {
  const target = state.reportMode === "sisa" ? state.shift.leftovers : state.shift.taken;
  target[key] = Math.max(0, (target[key] || 0) + delta);
  render();
}

function resetReportCounts() {
  const label = state.reportMode === "sisa" ? "Sisa" : "Diambil";
  if (!confirm(`Reset semua hitungan "${label}" ke nol?`)) return;
  if (state.reportMode === "sisa") state.shift.leftovers = {};
  if (state.reportMode === "diambil") state.shift.taken = {};
  logAction("resetReport", `Reset hitungan ${label}`);
  render();
}

function setMoney(type, amount) {
  if ((type === "opening" || type === "physical") && !isAdmin()) return;
  if (type === "opening") state.shift.openingCash = amount;
  if (type === "physical") state.shift.physicalCash = amount;
  if (type === "wage") state.shift.dailyWage = amount;
  render();
}

function addMoney(type, amount) {
  if ((type === "opening" || type === "physical") && !isAdmin()) return;
  if (type === "opening") state.shift.openingCash += amount;
  if (type === "physical") state.shift.physicalCash += amount;
  if (type === "wage") state.shift.dailyWage += amount;
  render();
}

function openShift() {
  if (!isAdmin()) return;
  state.shift.isOpen = true;
  state.tab = "jualan";
  render();
}

function changeCost(id, delta) {
  if (!isAdmin()) return;
  state.costs[id] = Math.max(0, Number(state.costs[id] || 0) + delta);
  render();
}

function exportBackup() {
  if (!isAdmin()) return;
  const payload = {
    exportedAt: new Date().toISOString(),
    ...state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dcelup-backup-${todayKey()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function newDay() {
  if (!isAdmin()) return;
  if (!confirm("Tutup hari ini dan mulai hari baru? Data hari ini akan diarsipkan (bukan dihapus).")) return;
  archiveDay(state, "manual-admin");
  logAction("newDay", "Tutup hari manual oleh admin");
  state.shift = defaultShift();
  state.transactions = [];
  state.deletedTransactions = [];
  state.cart = [];
  state.tab = "admin";
  render();
}

render();

// Rollover otomatis kalau tab dibiarkan terbuka lewat tengah malam WIB.
setInterval(() => {
  if (state.shift.date !== todayKey()) {
    state = normalizeState(state);
    render();
  }
}, 60000);
