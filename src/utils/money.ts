export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function formatBalance(amount: number, showCents = true): string {
  const negative = amount < 0;
  const absolute = Math.abs(amount);
  const body = absolute.toLocaleString("en-AU", {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  return `${negative ? "-$" : "$"}${body}`;
}

/** Transaction amounts keep a leading sign, including "+" for credits. */
export function formatSignedAmount(amount: number, showCents = true): string {
  const sign = amount < 0 ? "-" : "+";
  const absolute = Math.abs(amount);
  const body = absolute.toLocaleString("en-AU", {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  return `${sign}$${body}`;
}
