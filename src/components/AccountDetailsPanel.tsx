import type { Account } from "../types";
import { ListRow } from "./chrome";

export function AccountDetailsPanel({
  account,
  roundUpsOn,
  scheduledOn,
  payWithPoints,
  onScheduled,
  onRoundUps,
}: {
  account: Account;
  roundUpsOn: boolean;
  scheduledOn: boolean;
  payWithPoints: boolean;
  onScheduled: () => void;
  onRoundUps: () => void;
}) {
  return (
    <div id="account-details">
      <ListRow label="Account name" value={account.name} chevron={false} />
      <ListRow label="Account number" value={account.maskedIdentifier} chevron={false} />
      <ListRow label="Account type" value={account.type} chevron={false} />
      <ListRow label="Currency" value={account.currency} chevron={false} />
      <ListRow
        label="Scheduled activity"
        value={scheduledOn ? "Weekly" : "None"}
        onClick={onScheduled}
      />
      <ListRow label="Round-ups" value={roundUpsOn ? "On" : "Off"} onClick={onRoundUps} />
      <ListRow label="Pay with points" value={payWithPoints ? "On" : "Off"} chevron={false} />
      <ListRow label="Statements" value="Digital" chevron={false} />
    </div>
  );
}
