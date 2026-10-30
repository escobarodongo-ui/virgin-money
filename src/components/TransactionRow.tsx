import type { Transaction } from "../types";
import { formatSignedAmount } from "../utils/money";
import { TransactionGlyph } from "./icons";

export function TransactionRow({
  transaction,
  showCents,
  onSelect,
}: {
  transaction: Transaction;
  showCents: boolean;
  onSelect: (transaction: Transaction) => void;
}) {
  const pending = transaction.status === "pending";
  return (
    <button
      type="button"
      onClick={() => onSelect(transaction)}
      className="flex w-full items-start gap-5 border-b border-[#ededed] px-4 py-3.5 text-left active:bg-[#fafafa]"
    >
      <span className="mt-0.5 shrink-0">
        <TransactionGlyph category={transaction.category} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] leading-[18px] font-medium text-ink">{transaction.description}</span>
        {transaction.secondary && (
          <span className="mt-0.5 block truncate text-[12px] leading-4 text-ink-soft">{transaction.secondary}</span>
        )}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[14px] leading-[18px] font-medium whitespace-nowrap text-ink tabular-nums">
          {formatSignedAmount(transaction.amount, showCents)}
        </span>
        {pending && <span className="mt-0.5 block text-[11px] leading-4 text-ink-soft">Pending</span>}
      </span>
    </button>
  );
}
