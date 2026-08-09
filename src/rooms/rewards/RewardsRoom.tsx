import { useMemo, useState, type FormEvent } from "react";
import { Gift, Plus, Sparkles } from "lucide-react";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { KID_ECONOMY_SETUP_SQL } from "../../lib/kid-economy-setup-sql";
import { HOUSEHOLD_SETUP_SQL } from "../../lib/household-setup-sql";
import {
  isMissingMembersTableError,
  useHouseholdMembers,
} from "../../hooks/useHouseholdMembers";
import {
  balancesFromLedger,
  isMissingKidEconomyTableError,
  useKidEconomyMutations,
  useRewardRedemptions,
  useRewards,
  useTokenLedger,
} from "../../hooks/useKidEconomy";

export function RewardsRoom() {
  const { data: members = [], error: membersError } = useHouseholdMembers();
  const { data: rewards = [], error, isLoading } = useRewards();
  const { data: ledger = [] } = useTokenLedger();
  const { data: redemptions = [] } = useRewardRedemptions();
  const mut = useKidEconomyMutations();

  const [buyerId, setBuyerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(10);
  const [shopError, setShopError] = useState<string | null>(null);

  const balances = useMemo(() => balancesFromLedger(ledger), [ledger]);
  const rewardTitle = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of rewards) map[r.id] = r.title;
    return map;
  }, [rewards]);

  if (membersError && isMissingMembersTableError(membersError.message)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DbSetupPanel title="Household database setup" sql={HOUSEHOLD_SETUP_SQL} />
      </div>
    );
  }

  if (error && isMissingKidEconomyTableError(error.message)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DbSetupPanel title="Rewards database setup" sql={KID_ECONOMY_SETUP_SQL} />
      </div>
    );
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    mut.createReward.mutate(
      { title: trimmed, description, token_cost: cost },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setCost(10);
        },
      },
    );
  };

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 overflow-auto p-6 sm:p-10">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-violet-100 p-4 text-violet-700">
          <Gift size={36} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">Rewards</h1>
          <p className="text-sm font-semibold text-slate-500">
            Spend tokens on rewards
          </p>
        </div>
      </div>

      {members.length > 0 && (
        <div className="rounded-3xl border border-white/80 bg-white/50 p-4 shadow-sm backdrop-blur-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Shopper balances
          </p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setBuyerId(m.id);
                  setShopError(null);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  buyerId === m.id
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-white/80 bg-white/80 text-slate-700 hover:bg-white"
                }`}
              >
                {m.display_name}
                <span className="ml-2 inline-flex items-center gap-1 text-xs opacity-90">
                  <Sparkles size={12} />
                  {balances[m.id] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="rounded-3xl border border-white/80 bg-white/50 p-5 shadow-sm backdrop-blur-xl"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
          Add reward
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_7rem_auto]">
          <label className="text-sm font-semibold text-slate-700">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Pick movie night"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Optional"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Cost
            <input
              type="number"
              min={1}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
            />
          </label>
          <button
            type="submit"
            disabled={mut.createReward.isPending || !title.trim()}
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-center text-slate-500">Loading rewards…</p>
      ) : rewards.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center text-lg font-semibold text-slate-500">
          No rewards yet. Add something worth earning.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rewards.map((reward) => {
            const balance = buyerId ? balances[buyerId] ?? 0 : 0;
            const canBuy = Boolean(buyerId) && balance >= reward.token_cost;
            return (
              <li
                key={reward.id}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-white/80 bg-white/60 p-5 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="text-lg font-bold text-slate-800">{reward.title}</p>
                  {reward.description && (
                    <p className="mt-1 text-sm font-medium text-slate-500">{reward.description}</p>
                  )}
                  <p className="mt-3 text-sm font-bold text-violet-700">
                    {reward.token_cost} tokens
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canBuy || mut.purchaseReward.isPending}
                    onClick={() => {
                      setShopError(null);
                      mut.purchaseReward.mutate(
                        { reward, memberId: buyerId, balance },
                        {
                          onError: (err) =>
                            setShopError(err instanceof Error ? err.message : "Purchase failed"),
                        },
                      );
                    }}
                    className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-40"
                  >
                    Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      mut.updateReward.mutate({ id: reward.id, patch: { is_active: false } })
                    }
                    className="rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {shopError && <p className="text-center text-red-600">{shopError}</p>}

      {redemptions.length > 0 && (
        <section className="rounded-3xl border border-white/80 bg-white/50 p-5 shadow-sm backdrop-blur-xl">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Redemptions
          </h2>
          <ul className="flex flex-col gap-2">
            {redemptions.slice(0, 12).map((r) => {
              const member = members.find((m) => m.id === r.member_id);
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-slate-700">
                    {member?.display_name ?? "Member"} ·{" "}
                    {rewardTitle[r.reward_id] ?? "Reward"} · {r.token_cost} tok
                  </span>
                  {r.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => mut.fulfillRedemption.mutate(r.id)}
                      className="rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700"
                    >
                      Mark fulfilled
                    </button>
                  ) : (
                    <span className="text-xs font-bold uppercase text-slate-400">{r.status}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {error && !isMissingKidEconomyTableError(error.message) && (
        <p className="text-center text-red-600">{error.message}</p>
      )}
    </div>
  );
}
