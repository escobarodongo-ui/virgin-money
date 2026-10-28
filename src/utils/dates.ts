function asDate(iso: string): Date {
  return new Date(iso);
}

export function dateKey(iso: string): string {
  const date = asDate(iso);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "Monday, 19 October 2026" */
export function formatGroupDate(iso: string): string {
  const date = asDate(iso);
  const weekday = new Intl.DateTimeFormat("en-AU", { weekday: "long" }).format(date);
  const rest = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return `${weekday}, ${rest}`;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(asDate(iso));
}

export function formatNumericDate(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(asDate(iso));
}

export function searchDateText(iso: string): string {
  return [formatGroupDate(iso), formatNumericDate(iso), formatTime(iso)].join(" ");
}
