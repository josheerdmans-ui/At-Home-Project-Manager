import { useState } from "react";
import EerdmansHub from "./EerdmansHub";
import { HubAuthGate } from "./components/HubAuthGate";
import { HomeAppPasswordGate } from "./components/HomeAppPasswordGate";
import { AppChooser, type AppDestination } from "./components/AppChooser";
import { NinjaSurvivorsHub } from "./ninja/NinjaSurvivorsHub";

function AuthenticatedApps() {
  const [destination, setDestination] = useState<AppDestination | null>(null);

  if (!destination) {
    return <AppChooser onChoose={setDestination} />;
  }

  if (destination === "ninja") {
    return <NinjaSurvivorsHub onBackToChooser={() => setDestination(null)} />;
  }

  return (
    <HomeAppPasswordGate onBack={() => setDestination(null)}>
      <EerdmansHub onSwitchApp={() => setDestination(null)} />
    </HomeAppPasswordGate>
  );
}

export default function App() {
  return (
    <HubAuthGate>
      <AuthenticatedApps />
    </HubAuthGate>
  );
}
