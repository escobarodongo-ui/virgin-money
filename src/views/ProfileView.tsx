import { useState } from "react";
import { Card, ListRow, PageHeader, Sheet } from "../components/chrome";
import { PhoneOverlay } from "../components/PhoneFrame";
import { account } from "../data/account";

const rows: { id: string; label: string; group: number; body: string }[] = [
  { id: "details", label: "My details", group: 0, body: `${account.holderName}. This profile is fictional and is not a customer record.` },
  { id: "security", label: "Security Centre", group: 1, body: "No sign-in, password, or device binding is stored. This demo has nothing to secure." },
  { id: "notifications", label: "Notifications", group: 1, body: "Notifications are off. This demo does not send email or push messages." },
  { id: "help", label: "Help & Support", group: 2, body: "There is no support line. This screen is an unofficial interface recreation." },
  { id: "cards", label: "Manage cards", group: 3, body: "No card is issued here, and card numbers are not collected." },
  { id: "payid", label: "Manage PayID", group: 3, body: "" },
  { id: "balance", label: "Manage quick balance", group: 3, body: "Quick balance on Home uses the same available balance as Go Account." },
  { id: "limits", label: "Manage payment limits", group: 3, body: "Limits are not applied. Payments on the Pay tab are not sent." },
  { id: "sharing", label: "Manage data sharing", group: 3, body: "This demo does not share data with a bank or another app." },
  { id: "statements", label: "Statements and documents", group: 4, body: "No statements are generated. The transaction list is the whole demo ledger." },
  { id: "tour", label: "Guided tour", group: 5, body: "Open Accounts, expand account information, search a merchant, then tap a transaction for its detail." },
];

export function ProfileView({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const current = rows.find((row) => row.id === open);

  const groups = rows.reduce<typeof rows[]>((all, row) => {
    if (!all[row.group]) all[row.group] = [];
    all[row.group].push(row);
    return all;
  }, []);

  return (
    <div className="min-h-full bg-app-bg pb-[calc(96px+env(safe-area-inset-bottom))]">
      <PageHeader title="Profile" />
      <div className="-mt-[22px] space-y-[10px] px-[13px]">
        {groups.map((group) => (
          <Card key={group[0].id}>
            {group.map((row, index) => (
              <ListRow
                key={row.id}
                label={row.label}
                divider={index < group.length - 1}
                onClick={() => setOpen(row.id)}
              />
            ))}
          </Card>
        ))}
        <Card>
          <ListRow label="Log out" chevron={false} divider={false} onClick={onLogout} />
        </Card>
      </div>
      {current && current.id !== "payid" && (
        <PhoneOverlay>
          <Sheet title={current.label} onClose={() => setOpen(null)}>
            <p className="px-[13px] pt-4 text-[13px] leading-5 text-ink">{current.body}</p>
          </Sheet>
        </PhoneOverlay>
      )}
      {open === "payid" && (
        <PhoneOverlay>
          <Sheet title="Manage PayID" onClose={() => setOpen(null)}>
            <p className="px-[13px] pt-4 text-[11.5px] leading-[15px] text-ink-soft">
              Sample PayIDs for this demo. They are not registered and cannot receive payments.
            </p>
            <div className="px-[13px] pt-6 pb-2 text-[11.5px] text-ink-soft">Your PayIDs</div>
            <div className="bg-background">
              <PayIdRow name="alex.demo@example.com" detail={account.maskedIdentifier} />
              <PayIdRow name="demo.unverified@example.com" detail="Unverified email address" last />
            </div>
          </Sheet>
        </PhoneOverlay>
      )}
    </div>
  );
}

function PayIdRow({ name, detail, last = false }: { name: string; detail: string; last?: boolean }) {
  return (
    <div className={`px-[13px] py-[13px] ${last ? "" : "border-b border-line"}`}>
      <span className="block text-[12.5px] font-medium text-ink">{name}</span>
      <span className="block text-[12px] text-ink-soft">{detail}</span>
    </div>
  );
}
