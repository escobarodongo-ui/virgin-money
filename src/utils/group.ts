import type { DateGroup, Transaction } from "../types";
import { dateKey, formatGroupDate } from "./dates";

export function groupTransactions(items: Transaction[]): DateGroup[] {
  const sorted = [...items].sort((a, b) => (a.postedAt < b.postedAt ? 1 : a.postedAt > b.postedAt ? -1 : 0));
  const groups: DateGroup[] = [];
  for (const item of sorted) {
    const key = dateKey(item.postedAt);
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) {
      groups.push({
        key,
        label: formatGroupDate(item.postedAt),
        transactions: [item],
      });
    } else {
      last.transactions.push(item);
    }
  }
  return groups;
}
