import { categoryLabels, statusLabels } from "../data/categories";
import type { Transaction } from "../types";
import { formatGroupDate, formatTime } from "../utils/dates";
import { formatSignedAmount } from "../utils/money";
import { AppHeader } from "./AppHeader";
import { PhoneOverlay } from "./PhoneFrame";

export function TransactionDetailPanel({
  transaction,
  showCents,
  onClose,
}: {
  transaction: Transaction;
  showCents: boolean;
  onClose: () => void;
}) {
  const rows: { label: string; value: string }[] = [
    { label: "Description", value: transaction.description },
    {
      label: "Amount",
      value: formatSignedAmount(transaction.amount, showCents),
    },
    { label: "Date", value: formatGroupDate(transaction.postedAt) },
    { label: "Time", value: formatTime(transaction.postedAt) },
    { label: "Category", value: categoryLabels[transaction.category] },
    { label: "Status", value: statusLabels[transaction.status] },
  ];
  if (transaction.merchant) rows.push({ label: "Merchant", value: transaction.merchant });
  if (transaction.location) rows.push({ label: "Location", value: transaction.location });
  if (transaction.secondary) rows.push({ label: "Detail", value: transaction.secondary });
  rows.push({ label: "Reference", value: transaction.reference });

  return (
    <PhoneOverlay>
      <div className="absolute inset-0 z-40 overflow-y-auto bg-app-bg">
        <AppHeader title="Transaction" onBack={onClose} showMenu={false} />
        <div className="px-[13px] pt-3 pb-10">
          <div className="overflow-hidden rounded-[6px] bg-background">
            {rows.map((row, index) => (
              <div key={row.label} className="relative flex min-h-[50px] items-center justify-between gap-4 px-[13px] py-3">
                <span className="shrink-0 text-[13px] font-medium text-ink">{row.label}</span>
                <span className="min-w-0 text-right text-[13px] break-words text-ink">
                  {row.value}
                </span>
                {index < rows.length - 1 && <span className="absolute right-0 bottom-0 left-[13px] h-px bg-line" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneOverlay>
  );
}
