import type { Transaction } from '../data/transactions'
import { formatDateHeading } from './dates'

export function searchTransactions(items: Transaction[], query: string): Transaction[] {
  const q = query.trim().toLowerCase()
  if (!q) return items

  return items.filter((tx) => {
    const haystack = [
      tx.title,
      tx.sub,
      tx.category,
      tx.status,
      tx.merchant ?? '',
      tx.location ?? '',
      tx.reference,
      tx.date,
      formatDateHeading(tx.date),
      String(tx.amount),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
