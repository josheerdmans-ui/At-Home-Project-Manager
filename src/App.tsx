import { env } from "./lib/env";

export default function App() {
  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="app-eyebrow">Foundation Ready</p>
        <h1 className="app-title">{env.appName}</h1>
        <p className="app-meta">
          Data-layer-first base is initialized. Next step: schema planning and typed Supabase
          contracts.
        </p>
      </section>
    </main>
  );
}
