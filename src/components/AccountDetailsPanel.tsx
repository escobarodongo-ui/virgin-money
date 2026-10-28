import type { Account } from "../types";
import { ListRow } from "./chrome";

export function AccountDetailsPanel({ account }: { account: Account }) {
  return (
    <div id="account-details">
      <ListRow label="Account name" value={account.name} chevron={false} />
      <ListRow label="Account number" value={account.maskedIdentifier} chevron={false} />
      <ListRow label="Account type" value={account.type} chevron={false} />
      <ListRow label="Currency" value={account.currency} chevron={false} />
      <ListRow label="Statements" value="Digital" chevron={false} />
    </div>
  );
}
