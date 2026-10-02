const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const moneyExact = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const behindPercent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});
const dateShort = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatOrdinal(rank: number) {
  const tens = rank % 100;
  const ones = rank % 10;
  if (tens >= 11 && tens <= 13) return `${rank}th`;
  if (ones === 1) return `${rank}st`;
  if (ones === 2) return `${rank}nd`;
  if (ones === 3) return `${rank}rd`;
  return `${rank}th`;
}

export function formatInteger(value: number) {
  return integer.format(value);
}

export function formatValue(value: number | null) {
  return value == null ? "—" : integer.format(value);
}

export function formatMoney(value: number | null) {
  return value == null ? "—" : money.format(value);
}

export function formatListPrice(value: number | null) {
  return value == null ? "—" : `$${moneyExact.format(value)}`;
}

export function formatLatency(value: number) {
  return `${integer.format(value)} ms`;
}

export function formatClients(count: number) {
  return count === 1 ? "1 client" : `${count} clients`;
}

export function formatDateShort(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return dateShort.format(date);
}

export function formatBehindLead(value: number | null, bestValue: number) {
  if (value === null || bestValue === 0) return "—";
  const gap = Math.abs((value - bestValue) / bestValue) * 100;
  return `${behindPercent.format(gap)}% behind`;
}
