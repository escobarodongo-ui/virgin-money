import type { Transaction } from "../types";
import { roundMoney } from "./money";

export interface LedgerBalances {
  current: number;
  available: number;
  posted: number;
  pending: number;
}

/**
 * Current balance counts completed transactions only.
 * Available balance also applies pending amounts (holds reduce it).
 */
export function ledgerBalances(openingBalance: number, items: Transaction[]): LedgerBalances {
  let posted = 0;
  let pending = 0;
  for (const item of items) {
    if (item.status === "pending") pending += item.amount;
    else posted += item.amount;
  }
  posted = roundMoney(posted);
  pending = roundMoney(pending);
  const current = roundMoney(openingBalance + posted);
  const available = roundMoney(current + pending);
  return { current, available, posted, pending };
}
