import type { TabId } from "../types";

const items: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "accounts", label: "Accounts" },
  { id: "card", label: "Card" },
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
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (id === "accounts") {
    if (active) {
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3.2" fill="var(--color-brand)" />
        </svg>
      );
    }
    return (
      <svg {...common} stroke="#1c1c1e">
        <rect x="4" y="4" width="16" height="16" rx="3.2" />
      </svg>
    );
  }
  if (id === "home") {
    return (
      <svg {...common}>
        <path d="M4 11.2 12 4.2l8 7" />
        <path d="M6.2 10.4V19h4.2v-4.4h3.2V19h4.2v-8.6" />
      </svg>
    );
  }
  if (id === "card") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7.4v9.2" />
        <path d="M14.2 9.1c0-1.15-.95-1.7-2.2-1.7s-2.15.55-2.15 1.5.95 1.45 2.15 1.75 2.15.75 2.15 1.7-.95 1.6-2.15 1.6-2.15-.55-2.15-1.5" />
      </svg>
    );
  }
  if (id === "rewards") {
    return (
      <svg {...common}>
        <rect x="4.5" y="10.5" width="15" height="8.5" rx="1.2" />
        <path d="M4.5 14.2h15M12 10.5v8.5" />
        <path d="M12 10.5c-1.6-3.4-5.2-2.8-4.2-.8 1 1.8 4.2.8 4.2.8s3.2 1 4.2-.8c1-2-2.6-2.6-4.2.8Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="10.2" r="2.2" />
      <path d="M7.4 17.2a4.8 3.6 0 0 1 9.2 0" />
    </svg>
  );
}
