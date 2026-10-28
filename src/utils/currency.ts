const formatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats a signed amount with currency symbol and two decimals. */
export function formatCurrency(amount: number, opts?: { signed?: boolean }): string {
  const signed = opts?.signed ?? true
  const absolute = formatter.format(Math.abs(amount))
  if (!signed) return absolute
  if (amount > 0) return `+${absolute}`
  if (amount < 0) return `-${absolute}`
  return absolute
}

export function formatBalance(amount: number): string {
  return formatter.format(amount)
}
