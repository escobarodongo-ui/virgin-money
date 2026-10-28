import { categoryLabels, statusLabels } from "../data/categories";
import type { Transaction } from "../types";
import { searchDateText } from "./dates";

export function transactionHaystack(item: Transaction): string {
  return [
    item.description,
    item.secondary ?? "",
    item.merchant ?? "",
    item.location ?? "",
    categoryLabels[item.category],
    item.category,
    statusLabels[item.status],
    item.status,
    item.reference,
    searchDateText(item.postedAt),
  ]
    .join(" ")
    .toLowerCase();
}

export function filterTransactions(items: Transaction[], query: string): Transaction[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => transactionHaystack(item).includes(needle));
}
