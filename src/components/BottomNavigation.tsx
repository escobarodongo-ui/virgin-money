import type { TabId } from "../types";

const items: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "card", label: "Card" },
  { id: "accounts", label: "Accounts" },
  { id: "rewards", label: "Rewards" },
  { id: "profile", label: "Profile" },
];

export function BottomNavigation({ tab, onChange }: { tab: TabId; onChange: (tab: TabId) => void }) {
  return (
    <nav
      aria-label="Primary"
      className="absolute inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#e6e6e8] bg-white pt-2 pb-[max(12px,env(safe-area-inset-bottom))]"
    >
      {items.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className="flex h-12 items-center justify-center"
          >
            <NavIcon id={item.id} active={active} />
          </button>
        );
      })}
    </nav>
  );
}

function NavIcon({ id, active }: { id: TabId; active: boolean }) {
  const stroke = active ? "var(--color-brand)" : "#1c1c1e";
  if (id === "accounts") {
    if (active) {
      return (
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <rect x="3" y="3" width="20" height="20" rx="5" fill="var(--color-brand)" />
        </svg>
      );
    }
    return (
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" fill="none" stroke="#1c1c1e" strokeWidth="1.6">
        <rect x="4" y="4" width="7" height="7" rx="1.4" />
        <rect x="15" y="4" width="7" height="7" rx="1.4" />
        <rect x="4" y="15" width="7" height="7" rx="1.4" />
        <rect x="15" y="15" width="7" height="7" rx="1.4" />
      </svg>
    );
  }
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 26 26",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (id === "home") {
    return (
      <svg {...common}>
        <path d="M4 12 13 4l9 8v9.2a.8.8 0 0 1-.8.8H16v-5.2a3 3 0 0 0-6 0V22H4.8a.8.8 0 0 1-.8-.8Z" />
      </svg>
    );
  }
  if (id === "card") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="20" height="14" rx="2" />
        <path d="M3 10.5h20" />
      </svg>
    );
  }
  if (id === "rewards") {
    return (
      <svg {...common}>
        <path d="m13 4 2.2 4.6 5 .7-3.6 3.5.9 5L13 15.6 8.5 17.8l.9-5L5.8 9.3l5-.7Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="13" cy="10" r="3.2" />
      <path d="M6.2 20.2a6.8 6.8 0 0 1 13.6 0" />
    </svg>
  );
}
