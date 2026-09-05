import { useState, type FormEvent } from "react";
import { env } from "../lib/env";

const STORAGE_KEY = "home-app-unlocked";
const HOME_APP_PASSWORD = "Cranberry55";

type Props = {
  children: React.ReactNode;
  onBack?: () => void;
};

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function HomeAppPasswordGate({ children, onBack }: Props) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password !== HOME_APP_PASSWORD) {
      setError("Incorrect password.");
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setError(null);
    setUnlocked(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-cyan-400/30 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] rounded-full bg-rose-400/30 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/60 bg-white/40 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-600">Home app</p>
        <h1 className="mb-1 text-2xl font-black text-slate-800">{env.appName}</h1>
        <p className="mb-6 text-sm font-medium text-slate-500">Enter the password to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Password</span>
            <input
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-400"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-700"
          >
            Unlock
          </button>
        </form>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-4 w-full text-center text-sm font-medium text-slate-500 hover:text-cyan-700"
          >
            Back to apps
          </button>
        )}
      </div>
    </div>
  );
}
