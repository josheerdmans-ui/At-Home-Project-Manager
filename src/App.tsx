import EerdmansHub from "./EerdmansHub";
import { HubAuthGate } from "./components/HubAuthGate";

export default function App() {
  return (
    <HubAuthGate>
      <EerdmansHub />
    </HubAuthGate>
  );
}
