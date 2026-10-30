import type { ReactNode } from "react";
import type { Account } from "../types";
import { formatBalance } from "../utils/money";
import { AccountDetailsPanel } from "./AccountDetailsPanel";
import { DotsIcon } from "./icons";

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
          className="flex w-full items-center gap-2 px-4 pt-1.5 pb-1 text-left"
          aria-expanded={detailsOpen}
          aria-controls="account-details"
          onClick={onToggleDetails}
        >
          <span className="text-[13px] font-medium text-ink">{account.name}</span>
          <span className="ml-auto flex min-w-0 items-center gap-2">
            <span className="truncate text-[13px] text-ink-soft">{account.displayIdentifier}</span>
            <DotsIcon />
          </span>
        </button>
        <div className="px-4 pt-0.5 pb-2.5 text-[34px] leading-none font-bold tracking-tight text-ink">
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
        <button
          type="button"
          onClick={onToggleRoundUps}
          className="flex h-[48px] w-full items-center justify-between border-t border-[#ededed] px-4 text-left"
          aria-pressed={roundUpsOn}
        >
          <span className="text-[15px] text-ink">Round-ups</span>
          <span className="flex items-center gap-2 text-[#8e8e93]">
            <span className="text-[15px]">{roundUpsOn ? "On" : "Off"}</span>
            <Chevron />
          </span>
        </button>
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
    <svg width="7" height="12" viewBox="0 0 7 12" aria-hidden="true" className="text-[#a1a1a6]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1.2 5.6 6 1 10.8" />
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
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${pressed ? "bg-brand" : "bg-[#e9e9ee]"}`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.18)] transition-transform ${pressed ? "translate-x-5" : ""}`}
      />
    </button>
  );
}
