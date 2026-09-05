import { useState } from "react";
import EerdmansHub from "./EerdmansHub";
import { HubAuthGate } from "./components/HubAuthGate";
import { HomeAppPasswordGate } from "./components/HomeAppPasswordGate";
import { AppChooser, type AppDestination } from "./components/AppChooser";
import { NinjaSurvivorsHub } from "./ninja/NinjaSurvivorsHub";
import { NinjaWhoAreYou } from "./ninja/NinjaWhoAreYou";

function AuthenticatedApps() {
  const [destination, setDestination] = useState<AppDestination | null>(null);

  if (!destination) {
    return <AppChooser onChoose={setDestination} />;
  }

  if (destination === "ninja") {
    return (
      <NinjaWhoAreYou onBack={() => setDestination(null)}>
        {(user, switchPerson) => (
          <NinjaSurvivorsHub
            user={user}
            onSwitchPerson={switchPerson}
            onBackToChooser={() => setDestination(null)}
          />
        )}
      </NinjaWhoAreYou>
    );
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
