import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { env } from "../lib/env";

type Props = {
  children: React.ReactNode;
};

export function HubAuthGate({ children }: Props) {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setError(result.error.message);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Loading…</p>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
      <div className="absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-cyan-400/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] rounded-full bg-rose-400/30 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/60 bg-white/40 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-600">Family hub</p>
        <h1 className="mb-6 text-2xl font-black text-slate-800">{env.appName}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-400"
            />
          </label>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-60"
          >
            {busy ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
          className="mt-4 w-full text-center text-sm font-medium text-slate-500 hover:text-cyan-700"
        >
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
