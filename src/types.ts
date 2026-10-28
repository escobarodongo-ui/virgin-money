export const CATEGORIES = [
  "incoming_transfer",
  "outgoing_transfer",
  "card_purchase",
  "pending_payment",
  "refund",
  "deposit",
  "withdrawal",
  "bill_payment",
  "fee",
  "internal_transfer",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type TransactionStatus = "completed" | "pending";

export interface Transaction {
  id: string;
  description: string;
  secondary?: string;
  merchant?: string;
  location?: string;
  category: Category;
  status: TransactionStatus;
  /** Signed AUD amount. Credits are positive, debits are negative. */
  amount: number;
  postedAt: string;
  reference: string;
}

export interface Account {
  id: string;
  name: string;
  holderName: string;
  holderFirstName: string;
  type: string;
  currency: string;
  currencyName: string;
  /** Fictional BSB and account number shown on summary rows. */
  displayIdentifier: string;
  /** Masked form used in account details. */
  maskedIdentifier: string;
  /** Ledger balance before the demo transactions in this file. */
  openingBalance: number;
}

export interface DateGroup {
  key: string;
  label: string;
  transactions: Transaction[];
}

export type TabId = "home" | "card" | "accounts" | "rewards" | "profile";
