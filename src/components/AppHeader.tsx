import { useEffect, useId, useRef, useState } from "react";
import { StatusBar } from "./chrome";
import { BackIcon, VerticalEllipsis } from "./icons";

export type OverflowAction = "account" | "display" | "about";

const menuItems: { id: OverflowAction; label: string }[] = [
  { id: "account", label: "Account information" },
  { id: "display", label: "Display preferences" },
  { id: "about", label: "Application information" },
];

export function AppHeader({
  title,
  onBack,
  onMenuAction,
  showMenu = true,
}: {
  title: string;
  onBack: () => void;
  onMenuAction?: (action: OverflowAction) => void;
  showMenu?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']");
    first?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ?? [])];
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        if (!items.length) return;
        event.preventDefault();
        const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="sticky top-0 z-20 bg-brand pt-[env(safe-area-inset-top)] text-primary-foreground">
      <StatusBar />
      <div className="grid h-[38px] grid-cols-[40px_1fr_40px] items-center px-[18px]">
        <button type="button" aria-label="Back" onClick={onBack} className="grid h-10 w-10 place-items-center">
          <BackIcon />
        </button>
        <h1 className="truncate text-center text-[13px] font-semibold">{title}</h1>
        <div className="relative justify-self-end">
          {showMenu && onMenuAction ? (
          <button
            ref={buttonRef}
            type="button"
            className="grid h-10 w-10 place-items-center"
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((value) => !value)}
          >
            <VerticalEllipsis />
          </button>
          ) : (
            <span className="block h-10 w-10" />
          )}
          {open && onMenuAction && (
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Account options"
              className="absolute top-10 right-0 z-30 w-[228px] overflow-hidden rounded-[6px] bg-background py-1 text-ink shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  className="block min-h-11 w-full px-[13px] py-3 text-left text-[13px] font-medium text-ink active:bg-app-bg"
                  onClick={() => {
                    setOpen(false);
                    onMenuAction(item.id);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
