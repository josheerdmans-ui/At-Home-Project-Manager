import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Link2, Loader2 } from "lucide-react";
import { useBankingMutations } from "./useBanking";

type Props = {
  label?: string;
  className?: string;
};

export function ConnectBankButton({ label = "Connect bank", className }: Props) {
  const { createLinkToken, exchangePublicToken } = useBankingMutations();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadToken = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const t = await createLinkToken.mutateAsync();
      setToken(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Plaid Link");
      setToken(null);
    } finally {
      setBusy(false);
    }
    // One-shot token load; avoid re-creating link tokens on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: async (public_token, metadata) => {
      if (!public_token) {
        setError("Plaid did not return a public token");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await exchangePublicToken.mutateAsync({
          public_token,
          institution_name: metadata.institution?.name ?? undefined,
        });
        await loadToken();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not link account");
      } finally {
        setBusy(false);
      }
    },
    onExit: (err) => {
      if (err) setError(err.display_message || err.error_message || "Link closed");
    },
  });

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={!ready || busy || !token}
        onClick={() => open()}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-full border border-white/80 bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {busy || !ready ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
        {busy ? "Working…" : label}
      </button>
      {error && <p className="max-w-md text-xs text-red-600">{error}</p>}
    </div>
  );
}
