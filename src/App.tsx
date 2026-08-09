import { useState } from "react";
import EerdmansHub from "./EerdmansHub";
import { HubAuthGate } from "./components/HubAuthGate";
import { AppChooser, type AppDestination } from "./components/AppChooser";
import { LeagueHub } from "./league/LeagueHub";

function AuthenticatedApps() {
  const [destination, setDestination] = useState<AppDestination | null>(null);

  if (!destination) {
    return <AppChooser onChoose={setDestination} />;
  }

  if (destination === "league") {
    return <LeagueHub onBackToChooser={() => setDestination(null)} />;
  }

  return <EerdmansHub onSwitchApp={() => setDestination(null)} />;
}

export default function App() {
  return (
    <HubAuthGate>
      <AuthenticatedApps />
    </HubAuthGate>
  );
}
