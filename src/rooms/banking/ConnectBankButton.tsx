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
      setToken(await createLinkToken.mutateAsync());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Plaid Link");
      setToken(null);
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: async (public_token, metadata) => {
      if (!public_token) return;
      setBusy(true);
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
          "inline-flex items-center gap-2 rounded-2xl bg-[#6C5DD3] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(108,93,211,0.35)] transition hover:bg-[#5B4FC9] disabled:opacity-50"
        }
      >
        {busy || !ready ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
        {busy ? "Working…" : label}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
