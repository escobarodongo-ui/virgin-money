import { useState } from "react";
import { Card, ListRow, PageHeader, Sheet } from "../components/chrome";
import { PhoneOverlay } from "../components/PhoneFrame";
import { account } from "../data/account";

export function CardView() {
  const [frozen, setFrozen] = useState(false);
  const [sheet, setSheet] = useState<"freeze" | "pin" | "wallet" | null>(null);

  return (
    <div className="min-h-full bg-[#f6f6f7] pb-[calc(76px+env(safe-area-inset-bottom))]">
      <PageHeader title="Card" />
      <div className="-mt-[22px] space-y-[7px] px-[13px]">
        <div className="rounded-[10px] bg-brand px-4 py-5 text-primary-foreground">
          <div className="text-[12px] opacity-90">{account.name}</div>
          <div className="mt-6 text-[16px] tracking-[0.14em]">•••• •••• •••• 4581</div>
          <div className="mt-4 text-[12px]">Demo card · not issued</div>
        </div>
        <Card>
          <ListRow label="Freeze card" value={frozen ? "On" : "Off"} onClick={() => setFrozen((value) => !value)} />
          <ListRow label="View PIN" onClick={() => setSheet("pin")} />
          <ListRow label="Add to wallet" divider={false} onClick={() => setSheet("wallet")} />
        </Card>
        <p className="px-1 text-[12px] leading-4 text-ink-soft">
          This card cannot be used. Freezing it only changes the demo.
        </p>
      </div>
      {sheet && (
        <PhoneOverlay>
          <Sheet title={sheet === "pin" ? "View PIN" : "Add to wallet"} onClose={() => setSheet(null)}>
            <p className="px-4 pt-4 text-[14px] leading-5 text-ink">
              {sheet === "pin"
                ? "No PIN is stored. This unofficial demo does not issue cards."
                : "Nothing is added to a wallet. This demo cannot connect to a bank."}
            </p>
          </Sheet>
        </PhoneOverlay>
      )}
    </div>
  );
}
