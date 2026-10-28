import { useEffect, useState, type ReactNode } from "react";
import { BellIcon, MessageIcon, StatusIcons } from "./icons";
import { PhoneOverlay } from "./PhoneFrame";

export function StatusBar() {
  const [time, setTime] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => setTime(formatClock(new Date())), 15000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-[50px] items-center justify-between px-8 pt-1 text-[16px] font-semibold text-primary-foreground">
      <span className="flex items-center gap-1 tracking-tight">
        {time}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M10.5 7.5A5 5 0 0 1 4.5 1.5a5 5 0 1 0 6 6Z" fill="currentColor" />
        </svg>
      </span>
      <StatusIcons />
    </div>
  );
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-[6px] bg-background ${className}`}>{children}</div>;
}

export function ListRow({
  label,
  value,
  onClick,
  divider = true,
  chevron = true,
  right,
  expanded,
  controls,
}: {
  label: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  divider?: boolean;
  chevron?: boolean;
  right?: ReactNode;
  expanded?: boolean;
  controls?: string;
}) {
  const className = "relative flex h-[50px] w-full items-center justify-between px-[13px] text-left active:bg-app-bg";
  const content = (
    <>
      <span className="min-w-0 text-[13px] font-medium text-ink">{label}</span>
      <span className="flex min-w-0 items-center gap-3">
        {right ?? (
          <>
            {value != null && value !== "" && <span className="truncate text-[13px] text-ink-soft">{value}</span>}
            {chevron && <Chevron />}
          </>
        )}
      </span>
      {divider && <span className="absolute bottom-0 left-[13px] right-0 h-px bg-line" />}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={onClick}
        aria-expanded={expanded}
        aria-controls={controls}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function Chevron() {
  return (
    <svg width="9" height="14" viewBox="0 0 9 14" aria-hidden="true" className="shrink-0 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 1.5 7.5 7 2 12.5" />
    </svg>
  );
}

export function PageHeader({
  title,
  weight = "bold",
  actions,
}: {
  title: string;
  weight?: "bold" | "semibold";
  actions?: ReactNode;
}) {
  const [sheet, setSheet] = useState<"messages" | "alerts" | null>(null);
  return (
    <div className="bg-brand text-primary-foreground">
      <StatusBar />
      <div className="flex h-[34px] items-center justify-end gap-5 px-[13px]">
        {actions ?? (
          <>
            <button type="button" aria-label="Messages" onClick={() => setSheet("messages")}>
              <MessageIcon />
            </button>
            <button type="button" aria-label="Alerts" onClick={() => setSheet("alerts")}>
              <BellIcon />
            </button>
          </>
        )}
      </div>
      <h1 className={`px-[13px] pb-[36px] pt-1 text-[24px] tracking-tight ${weight === "bold" ? "font-bold" : "font-semibold"}`}>
        {title}
      </h1>
      {sheet && (
        <PhoneOverlay>
          <Sheet title={sheet === "messages" ? "Messages" : "Alerts"} onClose={() => setSheet(null)}>
            <p className="px-[13px] pt-4 text-[13px] leading-5 text-ink">
              {sheet === "messages"
                ? "No new messages. This inbox is part of the demo and is not connected to a bank."
                : "No security alerts. This demo does not monitor a real account."}
            </p>
          </Sheet>
        </PhoneOverlay>
      )}
    </div>
  );
}

export function Wordmark({ size = 34 }: { size?: number }) {
  const badge = size * 2.05;
  return (
    <span className="flex items-center gap-[0.3em] text-primary-foreground" style={{ fontSize: size }}>
      <span
        className="grid shrink-0 place-items-center rounded-full bg-background"
        style={{ width: badge, height: badge }}
      >
        <span className="font-virgin -rotate-6 text-[0.9em] leading-none font-bold tracking-tight whitespace-nowrap text-brand">
          Virgin
        </span>
      </span>
      <span className="leading-none font-light tracking-tight">money</span>
    </span>
  );
}

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="h-14 shrink-0" aria-label="Dismiss" onClick={onClose} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-[10px] bg-app-bg pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="grid h-12 shrink-0 grid-cols-[64px_1fr_64px] items-center px-[13px]">
          <button type="button" onClick={onClose} className="text-left text-[13px] font-semibold text-brand">
            Close
          </button>
          <h2 className="truncate text-center text-[13px] font-medium text-ink">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
