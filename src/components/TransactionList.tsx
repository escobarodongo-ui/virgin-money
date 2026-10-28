import type { Transaction } from "../types";
import { groupTransactions } from "../utils/group";
import { TransactionDateGroup } from "./TransactionDateGroup";
import { TransactionRow } from "./TransactionRow";

export function TransactionList({
  transactions,
  showCents,
  onSelect,
}: {
  transactions: Transaction[];
  showCents: boolean;
  onSelect: (transaction: Transaction) => void;
}) {
  const groups = groupTransactions(transactions);

  if (groups.length === 0) {
    return <div className="px-4 py-8 text-center text-[13px] text-ink-soft">No transactions found</div>;
  }

  return (
    <div>
      {groups.map((group) => (
        <TransactionDateGroup key={group.key} label={group.label}>
          {group.transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              showCents={showCents}
              onSelect={onSelect}
            />
          ))}
        </TransactionDateGroup>
      ))}
    </div>
  );
}
