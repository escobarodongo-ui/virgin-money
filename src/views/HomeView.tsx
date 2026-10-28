import { useMemo, useState } from "react";
import { Card, ListRow, PageHeader, Sheet } from "../components/chrome";
import { CardGlyph, ChevronIcon, LockAlertIcon } from "../components/icons";
import { PhoneOverlay } from "../components/PhoneFrame";
import { account } from "../data/account";
import { categoryLabels } from "../data/categories";
import { transactions } from "../data/transactions";
import { ledgerBalances } from "../utils/balances";
import { formatBalance } from "../utils/money";

export function HomeView({
  showCents,
  onOpenAccount,
}: {
  showCents: boolean;
  onOpenAccount: () => void;
}) {
  const [sheet, setSheet] = useState<"notice" | "card" | null>(null);
  const available = ledgerBalances(account.openingBalance, transactions).available;
  const spend = useMemo(() => topSpending(), []);
  const max = spend[0]?.total ?? 1;

  return (
    <div className="min-h-full bg-app-bg pb-[calc(96px+env(safe-area-inset-bottom))]">
      <PageHeader title={`Hi ${account.holderFirstName}`} weight="semibold" />
      <div className="-mt-[22px] space-y-[11px] px-[13px]">
        <Card>
          <ListRow label="Quick balance" divider={false} chevron={false} />
          <button type="button" onClick={onOpenAccount} className="w-full px-[13px] pt-1 pb-3 text-left active:bg-app-bg">
            <span className="flex items-center gap-3">
              <CardGlyph />
              <span className="flex-1 text-[13px] font-medium text-ink">{account.name}</span>
              <ChevronIcon />
            </span>
            <span className="mt-2 flex items-center justify-between pl-[38px]">
              <span className="text-[12px] text-ink-soft">Available</span>
              <span className="text-[15px] font-semibold text-ink">{formatBalance(available, showCents)}</span>
            </span>
          </button>
        </Card>
        <Card>
          <div className="flex gap-3 px-[13px] py-3">
            <LockAlertIcon />
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-ink">Bank impersonation alert</div>
              <p className="text-[12px] leading-[15.5px] text-ink-soft">
                Be cautious of anyone claiming to be from a bank and asking you to take urgent action. This demo is not a
                bank and cannot move money.
              </p>
              <button type="button" className="mt-2 text-[13px] font-semibold text-brand" onClick={() => setSheet("notice")}>
                Learn more
              </button>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex flex-col items-center px-[13px] pt-5 pb-5 text-center">
            <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-brand text-[10px] font-semibold text-primary-foreground">
              1
            </span>
            <p className="mt-4 text-[13px] font-medium text-ink">Got your debit card and ready to start spending?</p>
            <button type="button" className="mt-4 text-[13px] font-semibold text-brand" onClick={() => setSheet("card")}>
              Activate your card
            </button>
          </div>
        </Card>
        <Card>
          <ListRow label="Track spending" divider={false} chevron={false} />
          <div className="space-y-4 px-[30px] pt-2 pb-6">
            {spend.map((item) => (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-[12px] text-ink">
                  <span>{categoryLabels[item.category]}</span>
                  <span className="tabular-nums">{formatBalance(item.total, showCents)}</span>
                </div>
                <div className="h-px bg-line">
                  <div className="h-px bg-brand" style={{ width: `${Math.max(8, (item.total / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {sheet && (
        <PhoneOverlay>
          <Sheet title={sheetTitle[sheet]} onClose={() => setSheet(null)}>
            <p className="px-[13px] pt-4 text-[13px] leading-5 text-ink">{sheetCopy[sheet]}</p>
          </Sheet>
        </PhoneOverlay>
      )}
    </div>
  );
}

const sheetTitle = {
  notice: "About this demo",
  card: "Activate your card",
} as const;

const sheetCopy = {
  notice:
    "This is an unofficial demo recreation. It is not operated by Virgin Money, does not connect to Virgin Money, and cannot take payments or store real card details.",
  card: "There is no card to activate. This demo does not issue cards or collect card numbers.",
} as const;

function topSpending() {
  const totals = new Map<string, number>();
  for (const item of transactions) {
    if (item.amount < 0 && item.status === "completed") {
      totals.set(item.category, (totals.get(item.category) ?? 0) + Math.abs(item.amount));
    }
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category: category as (typeof transactions)[number]["category"], total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
}
