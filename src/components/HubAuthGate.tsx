import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { env } from "../lib/env";

type Props = {
  children: React.ReactNode;
};

type Mode = "signIn" | "signUp" | "forgot" | "updatePassword";

function recoveryInUrl(): boolean {
  try {
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    if (hashParams.get("type") === "recovery") return true;
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("type") === "recovery") return true;
  } catch {
    /* ignore */
  }
  return false;
}

function authRedirectUrl(): string {
  // Must match an entry under Supabase → Authentication → URL configuration → Redirect URLs
  return `${window.location.origin}/`;
}

export function HubAuthGate({ children }: Props) {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>(() => (recoveryInUrl() ? "updatePassword" : "signIn"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Supabase recovery links open the app with a session + PASSWORD_RECOVERY event
  useEffect(() => {
    if (recoveryInUrl()) setMode("updatePassword");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("updatePassword");
        setError(null);
        setInfo("Choose a new password for your account.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSignInOrUp = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    setBusy(true);
    const result =
      mode === "signUp"
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) setError(result.error.message);
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    setBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authRedirectUrl(),
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo(
      "If an account exists for that email, a reset link was sent. Open it on this device (check spam).",
    );
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    // Clean recovery fragments from the address bar
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      /* ignore */
    }
    setPassword("");
    setPassword2("");
    setMode("signIn");
    setInfo("Password updated. You’re signed in.");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Loading…</p>
      </div>
    );
  }

  // After password reset, user has a session — still show update form until done
  if (user && mode !== "updatePassword") return <>{children}</>;

  const title =
    mode === "signUp"
      ? "Create account"
      : mode === "forgot"
        ? "Reset password"
        : mode === "updatePassword"
          ? "Set new password"
          : "Sign in";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-cyan-400/30 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] rounded-full bg-rose-400/30 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/60 bg-white/40 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-600">Family hub</p>
        <h1 className="mb-1 text-2xl font-black text-slate-800">{env.appName}</h1>
        <p className="mb-6 text-sm font-medium text-slate-500">{title}</p>

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter your email and we&apos;ll send a link to choose a new password.
            </p>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-600">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-400"
              />
            </label>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            {info && <p className="text-sm font-medium text-emerald-700">{info}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => {
                clearMessages();
                setMode("signIn");
              }}
              className="w-full text-center text-sm font-medium text-slate-500 hover:text-cyan-700"
            >
              Back to sign in
            </button>
          </form>
        ) : mode === "updatePassword" ? (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-sm text-slate-600">
              Enter your new password below. Use the same link from your email only once.
            </p>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-600">New password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-600">Confirm password</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-400"
              />
            </label>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            {info && <p className="text-sm font-medium text-emerald-700">{info}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Update password"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignInOrUp} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-600">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
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
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-400"
              />
            </label>
            {mode === "signIn" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setMode("forgot");
                  }}
                  className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            {info && <p className="text-sm font-medium text-emerald-700">{info}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-cyan-600 py-3 font-bold text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signUp" ? "Create account" : "Sign in"}
            </button>
          </form>
        )}

        {(mode === "signIn" || mode === "signUp") && (
          <button
            type="button"
            onClick={() => {
              clearMessages();
              setMode((m) => (m === "signUp" ? "signIn" : "signUp"));
            }}
            className="mt-4 w-full text-center text-sm font-medium text-slate-500 hover:text-cyan-700"
          >
            {mode === "signUp" ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        )}
      </div>
    </div>
  );
}
