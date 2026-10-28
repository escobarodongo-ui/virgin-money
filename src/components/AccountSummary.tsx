import type { ReactNode } from "react";
import type { Account } from "../types";
import { formatBalance } from "../utils/money";
import { AccountDetailsPanel } from "./AccountDetailsPanel";
import { MiniCardIcon } from "./icons";

export function AccountSummary({
  account,
  balance,
  showCents,
  detailsOpen,
  roundUpsOn,
  payWithPoints,
  onToggleDetails,
  onScheduled,
  onToggleRoundUps,
  onTogglePoints,
  search,
  list,
}: {
  account: Account;
  balance: number;
  showCents: boolean;
  detailsOpen: boolean;
  roundUpsOn: boolean;
  payWithPoints: boolean;
  onToggleDetails: () => void;
  onScheduled: () => void;
  onToggleRoundUps: () => void;
  onTogglePoints: () => void;
  search: ReactNode;
  list: ReactNode;
}) {
  return (
    <>
      <div className="bg-white">
        <div className="px-4 pt-3 text-[15px] font-semibold text-ink">{account.name}</div>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-2 text-left"
          aria-expanded={detailsOpen}
          aria-controls="account-details"
          onClick={onToggleDetails}
        >
          <MiniCardIcon />
          <span className="text-[13px] font-medium text-ink">{account.name}</span>
          <span className="ml-auto min-w-0 truncate text-[13px] text-ink-soft">{account.displayIdentifier}</span>
        </button>
        <div className="px-4 pt-1 pb-3 text-[34px] leading-none font-bold tracking-tight text-ink">
          {formatBalance(balance, showCents)}
        </div>
        {detailsOpen && (
          <AccountDetailsPanel account={account} />
        )}
        <button
          type="button"
          onClick={onScheduled}
          className="flex h-[48px] w-full items-center justify-between border-t border-[#ededed] px-4 text-left"
        >
          <span className="text-[15px] text-ink">Scheduled activity</span>
          <Chevron />
        </button>
        <div className="flex h-[48px] items-center justify-between border-t border-[#ededed] px-4">
          <span className="text-[15px] text-ink">Round-ups</span>
          <Toggle pressed={roundUpsOn} label="Round-ups" onClick={onToggleRoundUps} />
        </div>
        <div className="flex h-[48px] items-center justify-between border-t border-[#ededed] px-4">
          <span className="text-[15px] text-ink">Pay with points</span>
          <Toggle pressed={payWithPoints} label="Pay with points" onClick={onTogglePoints} />
        </div>
      </div>
      <div className="border-t border-[#ededed]">{search}</div>
      {list}
    </>
  );
}

function Chevron() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true" className="text-[#8e8e93]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1.5 6.5 7 1 12.5" />
    </svg>
  );
}

function Toggle({ pressed, label, onClick }: { pressed: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={label}
      onClick={onClick}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${pressed ? "bg-brand" : "bg-[#e5e5ea]"}`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform ${pressed ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
