// WIB (Asia/Jakarta), bukan UTC - dipakai server & client supaya rollover
// hari konsisten dan tidak meleset di jam 00.00-06.59 WIB.
export function todayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

export function nowTimeWIB(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function nowDateTimeWIB(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
