import type { ReactNode } from "react";
import type { Category } from "../types";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={2.2}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function VerticalEllipsis() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5.2" r="1.45" fill="currentColor" />
      <circle cx="12" cy="12" r="1.45" fill="currentColor" />
      <circle cx="12" cy="18.8" r="1.45" fill="currentColor" />
    </svg>
  );
}

export function ReceiptIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="text-brand" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3.5h10a1 1 0 0 1 1 1V20l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V4.5a1 1 0 0 1 1-1Z" />
      <path d="M9.2 8h5.6M9.2 11.5h5.6M9.2 15h3.4" />
    </svg>
  );
}

export function MiniCardIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true" className="text-brand" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1" y="1.5" width="16" height="11" rx="1.4" />
      <path d="M1 5h16" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...stroke} strokeWidth={1.7}>
      <circle cx="12" cy="12" r="10.5" />
      <circle cx="7.5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="16.5" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg width="9" height="14" viewBox="0 0 9 14" aria-hidden="true" className="shrink-0 text-ink-soft" {...stroke} strokeWidth={1.7}>
      <path d="M2 1.5 7.5 7 2 12.5" />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg width="4" height="16" viewBox="0 0 4 16" aria-hidden="true" className="text-ink">
      <circle cx="2" cy="2" r="1.6" fill="currentColor" />
      <circle cx="2" cy="8" r="1.6" fill="currentColor" />
      <circle cx="2" cy="14" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true" className="text-ink" {...stroke}>
      <circle cx="7.2" cy="7.2" r="5.7" />
      <path d="m11.4 11.4 4.3 4.3" />
    </svg>
  );
}

export function MessageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" {...stroke}>
      <path d="M3 3.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.5 3.5v-3.5H3a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" />
      <circle cx="7" cy="10" r=".9" fill="currentColor" />
      <circle cx="11" cy="10" r=".9" fill="currentColor" />
      <circle cx="15" cy="10" r=".9" fill="currentColor" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" aria-hidden="true" {...stroke}>
      <path d="M10 2a6 6 0 0 0-6 6v4.5L2 16h16l-2-3.5V8a6 6 0 0 0-6-6ZM7.5 18.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" className="text-brand" {...stroke}>
      <circle cx="8" cy="8" r="6.8" />
      <path d="M8 7.2v4M8 4.8v.1" />
    </svg>
  );
}

export function LockAlertIcon() {
  return (
    <svg width="22" height="24" viewBox="0 0 22 24" aria-hidden="true" className="shrink-0 text-brand" {...stroke} strokeWidth={1.4}>
      <rect x="3" y="10" width="16" height="12" rx="1" />
      <path d="M6.5 10V7a4.5 4.5 0 0 1 9 0v3" />
      <circle cx="11" cy="15.5" r="1.4" />
    </svg>
  );
}

export function CardGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" className="text-brand" {...stroke} strokeWidth={1.3}>
      <path d="M13 17.5H3.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6" />
      <circle cx="8" cy="8.5" r=".6" fill="currentColor" />
      <path d="M6 7a3 3 0 0 1 4-.2" />
      <circle cx="18" cy="17.5" r="4.6" />
      <path d="M18 15.3v4.4M19.2 16h-1.8a.8.8 0 0 0 0 1.6h1.2a.8.8 0 0 1 0 1.6h-1.9" />
      <path d="M13 14.5a5 5 0 0 1 1-1.8M23 20.5a5 5 0 0 1-1 1.8" />
    </svg>
  );
}

export function NewAccountIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="text-brand" {...stroke} strokeWidth={1.4}>
      <rect x="2.5" y="4" width="17" height="13" rx="1.5" />
      <path d="M2.5 8h17" />
      <circle cx="17" cy="16.5" r="4.5" fill="var(--color-background)" />
      <path d="M17 14.3v4.4M14.8 16.5h4.4" />
    </svg>
  );
}

export function LinkBankIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="text-brand" {...stroke} strokeWidth={1.4}>
      <path d="M3 8.5 12 3l9 5.5M4 8.5h16M6 11v7M10 11v7M14 11v3M3 20h9" />
      <path d="m15.5 18.5 2-2 2 2M17.5 16.5v6M21.5 14.5l-2 2" />
    </svg>
  );
}

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className="text-brand" {...stroke} strokeWidth={1.5}>
      {children}
    </svg>
  );
}

function TransferGlyph() {
  return (
    <IconFrame>
      <circle cx="20.5" cy="10" r="5.6" />
      <path d="M20.5 7.4v5.2M21.9 8.3h-2.1a.95.95 0 0 0 0 1.9h1.5a.95.95 0 0 1 0 1.9h-2.2" />
      <circle cx="11" cy="21.5" r="5.6" />
      <path d="M11 18.9v5.2M12.4 19.8h-2.1a.95.95 0 0 0 0 1.9h1.5a.95.95 0 0 1 0 1.9H9.6" />
      <path d="M8.6 4.6 4.6 8.6M4.6 8.6l.1-3.4M4.6 8.6l3.4-.1" />
      <path d="M23.4 27.4l4-4M27.4 23.4l-.1 3.4M27.4 23.4l-3.4.1" />
    </IconFrame>
  );
}

function CardPurchaseGlyph() {
  return (
    <IconFrame>
      <path d="M6 12.5 9.2 6.5h13.6L26 12.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 6 25.5Z" />
      <path d="M6 12.5h20M16 6.5v6" />
      <path d="M13 20.5h6" />
    </IconFrame>
  );
}

function DepositGlyph() {
  return (
    <IconFrame>
      <path d="M5 6h22v5.5h-3.5M8.5 11.5H5V6" />
      <path d="M10 9v15h12V9" />
      <path d="M16 12.5v7M17.4 13.6h-2a1 1 0 0 0 0 2h1.2a1 1 0 0 1 0 2h-2.2" />
      <path d="M7.5 27h17" />
    </IconFrame>
  );
}

function BillGlyph() {
  return (
    <IconFrame>
      <path d="M9 4.5h14v23l-2.2-1.6L18.5 27.5 16 26l-2.5 1.5-2.3-1.6L9 27.5Z" />
      <path d="M12.5 10h7M12.5 14h7M12.5 18h4" />
    </IconFrame>
  );
}

function FeeGlyph() {
  return (
    <IconFrame>
      <circle cx="16" cy="16" r="10" />
      <path d="M16 10.5v8M16 21.8v.2" />
    </IconFrame>
  );
}

function RefundGlyph() {
  return (
    <IconFrame>
      <path d="M16 7a9 9 0 1 0 3.2 17.4" />
      <path d="M16 3.5v6h6" />
      <path d="M16 14.2v5.2M17.4 15.2h-2.1a1 1 0 0 0 0 2h1.4a1 1 0 0 1 0 2H14" />
    </IconFrame>
  );
}

function WithdrawalGlyph() {
  return (
    <IconFrame>
      <rect x="6" y="7" width="20" height="14" rx="1.5" />
      <path d="M6 12h20" />
      <path d="M16 16v7M12.5 19.5 16 23l3.5-3.5" />
    </IconFrame>
  );
}

function PendingGlyph() {
  return (
    <IconFrame>
      <circle cx="16" cy="16" r="10" />
      <path d="M16 10v6l4 2" />
    </IconFrame>
  );
}

function InternalGlyph() {
  return (
    <IconFrame>
      <path d="M8 11h14M18 7l4 4-4 4" />
      <path d="M24 21H10M14 17l-4 4 4 4" />
    </IconFrame>
  );
}

const categoryIcons: Record<Category, () => ReactNode> = {
  incoming_transfer: TransferGlyph,
  outgoing_transfer: TransferGlyph,
  card_purchase: CardPurchaseGlyph,
  pending_payment: PendingGlyph,
  refund: RefundGlyph,
  deposit: DepositGlyph,
  withdrawal: WithdrawalGlyph,
  bill_payment: BillGlyph,
  fee: FeeGlyph,
  internal_transfer: InternalGlyph,
};

export function CategoryIcon({ category }: { category: Category }) {
  const Glyph = categoryIcons[category];
  return <Glyph />;
}

export function HomeNavIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.5 10.2 12 2.5l9.5 7.7V21a.5.5 0 0 1-.5.5h-5.5V16a3.5 3.5 0 0 0-7 0v5.5H3a.5.5 0 0 1-.5-.5Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M3 10.5 12 3l9 7.5V21h-5.5v-5a3.5 3.5 0 0 0-7 0v5H3Z" />
    </svg>
  );
}

export function AccountsNavIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="1.5" fill="currentColor" />
        <rect x="15" y="9.5" width="7" height="5" rx="2.5" fill="var(--color-background)" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
      <rect x="15.5" y="9.5" width="6" height="5" rx="2.5" />
    </svg>
  );
}

export function PayNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M20.5 9A9 9 0 0 0 4.2 7.3M3.5 15a9 9 0 0 0 16.3 1.7" />
      <path d="M4 3.5v4h4M20 20.5v-4h-4" />
      <path d="M12 6.8v10.4M14.6 8.8H11a1.8 1.8 0 0 0 0 3.6h2a1.8 1.8 0 0 1 0 3.6H9.2" />
    </svg>
  );
}

export function RewardsNavIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <rect x="3" y="8" width="18" height="4" />
      <path d="M4.5 12v9h15v-9M12 8v13M12 8S10.5 3 7.8 3.6 8 8 12 8Zm0 0s1.5-5 4.2-4.4S16 8 12 8Z" />
    </svg>
  );
}

export function ProfileNavIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.5" fill="currentColor" />
        <circle cx="12" cy="9.5" r="3.6" fill="var(--color-background)" />
        <path d="M5.5 18.5a7.5 5 0 0 1 13 0" fill="var(--color-background)" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="9.5" r="3.5" />
      <path d="M5.8 18.6a7.5 5 0 0 1 12.4 0" />
    </svg>
  );
}

export function StatusIcons() {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true">
        <rect x="0" y="7" width="3" height="4" rx=".7" />
        <rect x="4.5" y="5" width="3" height="6" rx=".7" />
        <rect x="9" y="2.5" width="3" height="8.5" rx=".7" opacity=".45" />
        <rect x="13.5" y="0" width="3" height="11" rx=".7" opacity=".45" />
      </svg>
      <svg width="16" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
        <path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0Zm-4-4L2.6 6a7.6 7.6 0 0 1 10.8 0L12 7.5a5.6 5.6 0 0 0-8 0ZM.9 4.3-.4 2.9a11.3 11.3 0 0 1 16.8 0l-1.3 1.4a9.4 9.4 0 0 0-14.2 0Z" />
      </svg>
      <span className="relative grid h-[13px] w-[25px] place-items-center rounded-[4px] border border-current">
        <span className="h-[7px] w-[16px] rounded-[1px] bg-current" />
      </span>
    </span>
  );
}
