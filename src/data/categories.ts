import type { Category, TransactionStatus } from "../types";

export const categoryLabels: Record<Category, string> = {
  incoming_transfer: "Incoming transfer",
  outgoing_transfer: "Outgoing transfer",
  card_purchase: "Card purchase",
  pending_payment: "Pending payment",
  refund: "Refund",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  bill_payment: "Bill payment",
  fee: "Fee",
  internal_transfer: "Internal transfer",
};

export const statusLabels: Record<TransactionStatus, string> = {
  completed: "Completed",
  pending: "Pending",
};
