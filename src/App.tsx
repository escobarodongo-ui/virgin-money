import { useState } from "react";
import { BottomNavigation } from "./components/BottomNavigation";
import { PhoneFrame } from "./components/PhoneFrame";
import type { TabId } from "./types";
import { AccountScreen } from "./views/AccountScreen";
import { AccountsListView } from "./views/AccountsListView";
import { CardView } from "./views/CardView";
import { DemoGate } from "./views/DemoGate";
import { HomeView } from "./views/HomeView";
import { ProfileView } from "./views/ProfileView";
import { RewardsView } from "./views/RewardsView";

export default function App() {
  const [entered, setEntered] = useState(true);
  const [tab, setTab] = useState<TabId>("accounts");
  const [accountOpen, setAccountOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showCents, setShowCents] = useState(true);
  const [roundUpsOn, setRoundUpsOn] = useState(false);
  const [payWithPoints, setPayWithPoints] = useState(false);
  const [scheduledOn, setScheduledOn] = useState(false);

  const openAccount = () => {
    setTab("accounts");
    setAccountOpen(true);
  };

  return (
    <PhoneFrame dock={<BottomNavigation tab={tab} onChange={setTab} />}>
      {tab === "home" && <HomeView showCents={showCents} onOpenAccount={openAccount} />}
      {tab === "card" && <CardView />}
      {tab === "accounts" &&
        (accountOpen ? (
          <AccountScreen
            detailsOpen={detailsOpen}
            onToggleDetails={() => setDetailsOpen((value) => !value)}
            onOpenDetails={() => setDetailsOpen(true)}
            query={query}
            onQuery={setQuery}
            onClearSearch={() => setQuery("")}
            showCents={showCents}
            onToggleCents={() => setShowCents((value) => !value)}
            roundUpsOn={roundUpsOn}
            onToggleRoundUps={() => setRoundUpsOn((value) => !value)}
            payWithPoints={payWithPoints}
            onTogglePoints={() => setPayWithPoints((value) => !value)}
            scheduledOn={scheduledOn}
            onToggleScheduled={() => setScheduledOn((value) => !value)}
            onBack={() => setAccountOpen(false)}
          />
        ) : (
          <AccountsListView showCents={showCents} onOpenAccount={openAccount} />
        ))}
      {tab === "rewards" && <RewardsView />}
      {tab === "profile" && <ProfileView onLogout={() => setEntered(false)} />}
      {!entered && <DemoGate onEnter={() => setEntered(true)} />}
    </PhoneFrame>
  );
}
