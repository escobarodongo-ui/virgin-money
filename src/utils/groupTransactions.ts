import type { Transaction } from '../data/transactions'
import { formatDateHeading } from './dates'

export interface TransactionGroup {
  date: string
  label: string
  items: Transaction[]
}

export function groupTransactionsByDate(items: Transaction[]): TransactionGroup[] {
  const map = new Map<string, Transaction[]>()
  for (const tx of items) {
    const list = map.get(tx.date) ?? []
    list.push(tx)
    map.set(tx.date, list)
  }
  return [...map.entries()].map(([date, groupItems]) => ({
    date,
    label: formatDateHeading(date),
    items: groupItems,
  }))
}
