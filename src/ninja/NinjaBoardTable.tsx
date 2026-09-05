import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { NinjaItem, NinjaItemArea, NinjaItemStage } from "./ninja-types";
import { NINJA_STAGES, ninjaImagePublicUrl } from "./ninja-types";

type Props = {
  area: NinjaItemArea;
  items: NinjaItem[];
  busy: boolean;
  onCreate: (input: { title: string; stage: NinjaItemStage; area: NinjaItemArea }) => void;
  onOpen: (item: NinjaItem) => void;
};

const STAGE_BAR: Record<NinjaItemStage, string> = {
  idea: "bg-sky-400",
  working_on: "bg-[#FF6A00]",
  confirmed: "bg-violet-400",
  implemented: "bg-emerald-500",
};

export function NinjaBoardTable({ area, items, busy, onCreate, onOpen }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {NINJA_STAGES.map((stage) => (
        <CardSection
          key={stage.id}
          area={area}
          stage={stage.id}
          label={stage.label}
          items={items.filter((item) => item.stage === stage.id)}
          busy={busy}
          onCreate={onCreate}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function CardSection({
  area,
  stage,
  label,
  items,
  busy,
  onCreate,
  onOpen,
}: {
  area: NinjaItemArea;
  stage: NinjaItemStage;
  label: string;
  items: NinjaItem[];
  busy: boolean;
  onCreate: Props["onCreate"];
  onOpen: Props["onOpen"];
}) {
  const [draft, setDraft] = useState("");

  const submitDraft = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onCreate({ title, stage, area });
    setDraft("");
  };

  return (
    <section>
      <header className="mb-3 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-sm ${STAGE_BAR[stage]}`} />
        <h3 className="text-base font-black text-slate-800">{label}</h3>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-slate-500">
          {items.length}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item)}
            className="overflow-hidden rounded-2xl border border-white bg-white/50 text-left shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:bg-white/80"
          >
            {item.images[0] ? (
              <img
                src={ninjaImagePublicUrl(item.images[0].filePath)}
                alt=""
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="h-20 bg-gradient-to-br from-white/40 to-orange-50/60" />
            )}
            <div className="p-4">
              <h4 className="text-sm font-black text-slate-800">{item.title}</h4>
              {item.info ? (
                <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-600">{item.info}</p>
              ) : (
                <p className="mt-1 text-xs font-medium text-slate-400">Open to add info and images</p>
              )}
              {item.owner && (
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-[#FF6A00]">
                  {item.owner}
                </p>
              )}
            </div>
          </button>
        ))}

        <form
          onSubmit={submitDraft}
          className="flex min-h-[8.5rem] flex-col justify-end rounded-2xl border border-dashed border-white bg-white/30 p-4 backdrop-blur-xl"
        >
          <label className="flex items-center gap-2 text-slate-500">
            <Plus size={16} className="text-[#FF6A00]" />
            <input
              value={draft}
              disabled={busy}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a card"
              className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </label>
        </form>
      </div>
    </section>
  );
}
