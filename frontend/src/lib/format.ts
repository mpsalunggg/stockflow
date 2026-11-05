const numberFormat = new Intl.NumberFormat("id-ID");
const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const timeUnits = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
] as const;

export function formatNumber(value: number) {
  return numberFormat.format(value);
}

export function formatRupiah(value: number) {
  return `Rp ${numberFormat.format(value)}`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatTime(iso: string) {
  return timeFormat.format(new Date(iso));
}

export function timeAgo(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of timeUnits) {
    if (Math.abs(seconds) >= size) {
      return relativeFormat.format(Math.round(seconds / size), unit);
    }
  }
  return "Just now";
}
