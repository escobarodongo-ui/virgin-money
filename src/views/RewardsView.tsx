import { useState } from "react";
import { Card, ListRow, PageHeader, Sheet } from "../components/chrome";
import { PhoneOverlay } from "../components/PhoneFrame";

const offers = [
  { id: "coffee", title: "Weekend coffee", detail: "A sample offer. 200 demo points." },
  { id: "grocer", title: "Grocer bonus", detail: "A sample offer. 350 demo points on a fictional shop." },
  { id: "travel", title: "Travel credit", detail: "A sample offer. Not a real reward and not redeemable." },
];

export function RewardsView() {
  const [offer, setOffer] = useState<(typeof offers)[number] | null>(null);

  return (
    <div className="min-h-full bg-app-bg pb-[calc(96px+env(safe-area-inset-bottom))]">
      <PageHeader title="Rewards" />
      <div className="-mt-[22px] space-y-[7px] px-[13px]">
        <Card>
          <div className="px-[13px] py-4">
            <div className="text-[12px] text-ink-soft">Demo points</div>
            <div className="text-[25px] leading-tight font-bold tracking-tight text-ink">1,840</div>
            <p className="mt-1 text-[12px] text-ink-soft">Points are fictional and cannot be redeemed.</p>
          </div>
        </Card>
        <Card>
          {offers.map((item, index) => (
            <ListRow
              key={item.id}
              label={item.title}
              divider={index < offers.length - 1}
              onClick={() => setOffer(item)}
            />
          ))}
        </Card>
      </div>
      {offer && (
        <PhoneOverlay>
          <Sheet title={offer.title} onClose={() => setOffer(null)}>
            <p className="px-[13px] pt-4 text-[13px] leading-5 text-ink">{offer.detail}</p>
          </Sheet>
        </PhoneOverlay>
      )}
    </div>
  );
}
