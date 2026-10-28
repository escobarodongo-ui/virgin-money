import { useState } from "react";
import { AccountSummary } from "../components/AccountSummary";
import { AppHeader, type OverflowAction } from "../components/AppHeader";
import { ListRow, Sheet } from "../components/chrome";
import { PhoneOverlay } from "../components/PhoneFrame";
import { TransactionDetailPanel } from "../components/TransactionDetailPanel";
import { TransactionList } from "../components/TransactionList";
import { TransactionSearch } from "../components/TransactionSearch";
import { account, displayedBalance } from "../data/account";
import { transactions } from "../data/transactions";
import type { Transaction } from "../types";
import { ledgerBalances } from "../utils/balances";
import { filterTransactions } from "../utils/search";

export function AccountScreen({
  detailsOpen,
  onToggleDetails,
  onOpenDetails,
  query,
  onQuery,
  onClearSearch,
  showCents,
  onToggleCents,
  roundUpsOn,
  onToggleRoundUps,
  payWithPoints,
  onTogglePoints,
  scheduledOn,
  onToggleScheduled,
  onBack,
}: {
  detailsOpen: boolean;
  onToggleDetails: () => void;
  onOpenDetails: () => void;
  query: string;
  onQuery: (value: string) => void;
  onClearSearch: () => void;
  showCents: boolean;
  onToggleCents: () => void;
  roundUpsOn: boolean;
  onToggleRoundUps: () => void;
  payWithPoints: boolean;
  onTogglePoints: () => void;
  scheduledOn: boolean;
  onToggleScheduled: () => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [sheet, setSheet] = useState<"scheduled" | "display" | "about" | null>(null);
  const balances = ledgerBalances(account.openingBalance, transactions);
  const balance = balances.available;
  const visible = filterTransactions(transactions, query);

  const onMenu = (action: OverflowAction) => {
    if (action === "account") {
      onOpenDetails();
      return;
    }
    if (action === "display") setSheet("display");
    if (action === "about") setSheet("about");
  };

  return (
    <div className="min-h-full bg-white pb-[calc(76px+env(safe-area-inset-bottom))]">
      <AppHeader title={account.name} onBack={onBack} onMenuAction={onMenu} />
      <AccountSummary
        account={account}
        balance={balance}
        showCents={showCents}
        detailsOpen={detailsOpen}
        roundUpsOn={roundUpsOn}
        payWithPoints={payWithPoints}
        onToggleDetails={onToggleDetails}
        onScheduled={() => setSheet("scheduled")}
        onToggleRoundUps={onToggleRoundUps}
        onTogglePoints={onTogglePoints}
        search={<TransactionSearch query={query} onQuery={onQuery} onClear={onClearSearch} />}
        list={<TransactionList transactions={visible} showCents={showCents} onSelect={setSelected} />}
      />
      {selected && (
        <TransactionDetailPanel transaction={selected} showCents={showCents} onClose={() => setSelected(null)} />
      )}
      {sheet === "scheduled" && (
        <PhoneOverlay>
          <Sheet title="Scheduled activity" onClose={() => setSheet(null)}>
            <p className="px-4 pt-4 text-[12px] leading-4 text-ink-soft">
              Demo only. Nothing here is sent to a bank or to another person.
            </p>
            <div className="mt-4 bg-white">
              <ListRow
                label="Weekly transfer"
                value={scheduledOn ? "On" : "Off"}
                divider={false}
                onClick={onToggleScheduled}
              />
            </div>
            <p className="px-4 pt-4 text-[14px] leading-5 text-ink">
              {scheduledOn
                ? "Every Friday · $10.00 to Jordan Blake, inside this demo."
                : "No payments are scheduled."}
            </p>
          </Sheet>
        </PhoneOverlay>
      )}
      {sheet === "display" && (
        <PhoneOverlay>
          <Sheet title="Display preferences" onClose={() => setSheet(null)}>
            <div className="mt-2 bg-white">
              <ListRow label="Show cents" value={showCents ? "On" : "Off"} divider={false} onClick={onToggleCents} />
            </div>
          </Sheet>
        </PhoneOverlay>
      )}
      {sheet === "about" && (
        <PhoneOverlay>
          <Sheet title="Application information" onClose={() => setSheet(null)}>
            <div className="space-y-3 px-4 pt-4 text-[14px] leading-5 text-ink">
              <p>This is an unofficial demo recreation. It is not operated by Virgin Money.</p>
              <p>
                It does not connect to Virgin Money, does not sign in to a bank, and cannot move money. Balances and
                transactions are fictional. The figure on this screen ({displayedBalance.toFixed(2)} before formatting)
                is the ledger total.
              </p>
            </div>
          </Sheet>
        </PhoneOverlay>
      )}
    </div>
  );
}
