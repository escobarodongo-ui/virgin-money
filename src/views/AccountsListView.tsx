import { useState } from "react";
import { Card, ListRow, PageHeader, Sheet } from "../components/chrome";
import { CardGlyph, ChevronIcon, InfoIcon, LinkBankIcon, NewAccountIcon } from "../components/icons";
import { PhoneOverlay } from "../components/PhoneFrame";
import { account } from "../data/account";
import { transactions } from "../data/transactions";
import { ledgerBalances } from "../utils/balances";
import { formatBalance } from "../utils/money";

export function AccountsListView({
  showCents,
  onOpenAccount,
}: {
  showCents: boolean;
  onOpenAccount: () => void;
}) {
  const [sheet, setSheet] = useState<"services" | "signup" | "link" | "net" | null>(null);
  const balances = ledgerBalances(account.openingBalance, transactions);

  return (
    <div className="flex min-h-full flex-col bg-app-bg">
      <PageHeader title="Accounts" />
      <div className="-mt-[22px] space-y-[7px] px-[13px]">
        <Card>
          <div className="flex h-[38px] items-center justify-between border-b border-line px-[13px]">
            <span className="flex items-center gap-1">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[8px] font-bold text-primary-foreground italic">
                V
              </span>
              <span className="text-[9px] font-semibold text-brand">money</span>
            </span>
            <button type="button" aria-label="Account services" onClick={() => setSheet("services")}>
              <GearIcon dark />
            </button>
          </div>
          <button type="button" onClick={onOpenAccount} className="w-full px-[13px] pt-3 pb-3 text-left">
            <span className="flex gap-3">
              <CardGlyph />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">{account.name}</span>
                <span className="block text-[12px] text-ink">{account.displayIdentifier}</span>
              </span>
              <ChevronIcon />
            </span>
            <span className="mt-3 flex items-center justify-between pl-9">
              <span className="text-[12px] text-ink-soft">Available</span>
              <span className="text-[15px] font-semibold text-ink">{formatBalance(balances.available, showCents)}</span>
            </span>
          </button>
        </Card>
        <Card>
          <ListRow
            divider={false}
            label={
              <span className="flex items-center gap-3">
                <NewAccountIcon />
                Sign up for a new account
              </span>
            }
            onClick={() => setSheet("signup")}
          />
        </Card>
        <Card>
          <ListRow
            divider={false}
            label={
              <span className="flex items-center gap-3">
                <LinkBankIcon />
                Link accounts from other banks
              </span>
            }
            onClick={() => setSheet("link")}
          />
        </Card>
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setSheet("net")}
        className="sticky bottom-[64px] flex h-[46px] w-full items-center justify-between border-t border-line bg-app-bg px-[13px] text-[12px] text-ink"
      >
        <span className="flex items-center gap-2">
          Net balance <InfoIcon />
        </span>
        <span>{formatBalance(balances.available, showCents)}</span>
      </button>
      <div className="h-16" />
      {sheet && (
        <PhoneOverlay>
          <Sheet title={titles[sheet]} onClose={() => setSheet(null)}>
            <p className="px-[13px] pt-4 text-[13px] leading-5 text-ink">{copy[sheet]}</p>
          </Sheet>
        </PhoneOverlay>
      )}
    </div>
  );
}

const titles = {
  services: "Account services",
  signup: "Sign up",
  link: "Link accounts",
  net: "Net balance",
} as const;

const copy = {
  services: "Statements, cards, and limits in this demo are sample controls. They do not change a real account.",
  signup: "This unofficial demo cannot open an account with a bank.",
  link: "This demo cannot connect to another bank or import a real balance.",
  net: "Net balance matches the available balance on Go Account. Pending card holds are already taken off.",
} as const;

function GearIcon({ dark = false }: { dark?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={dark ? "text-ink" : "text-primary-foreground"} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
