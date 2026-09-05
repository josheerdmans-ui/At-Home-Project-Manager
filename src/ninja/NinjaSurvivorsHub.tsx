import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  Gamepad2,
  Sparkles,
  Swords,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { DbSetupPanel } from "../components/DbSetupPanel";
import { NINJA_SURVIVORS_SETUP_SQL } from "../lib/ninja-survivors-setup-sql";
import { NinjaBoardTable } from "./NinjaBoardTable";
import { NinjaItemModal } from "./NinjaItemModal";
import { NINJA_AREAS, type NinjaItemArea } from "./ninja-types";
import {
  isMissingNinjaItemsTableError,
  useNinjaItems,
  useNinjaItemsMutations,
} from "./useNinjaItems";

type Props = {
  onBackToChooser: () => void;
};

const AREA_ICONS: Record<NinjaItemArea, typeof UserRound> = {
  character_design: UserRound,
  level_up_system: TrendingUp,
  game_design_vfx: Sparkles,
  core_gameplay: Gamepad2,
  character_progression: Award,
};

export function NinjaSurvivorsHub({ onBackToChooser }: Props) {
  const { data: items = [], isLoading, error } = useNinjaItems();
  const mut = useNinjaItemsMutations();
  const [area, setArea] = useState<NinjaItemArea>("character_design");
  const [openId, setOpenId] = useState<string | null>(null);

  const currentArea = NINJA_AREAS.find((entry) => entry.id === area) ?? {
    id: area,
    label: "Character Design",
  };
  const areaItems = useMemo(() => items.filter((item) => item.area === area), [items, area]);
  const openItem = items.find((item) => item.id === openId) ?? null;
  const busy =
    mut.createItem.isPending ||
    mut.updateItem.isPending ||
    mut.deleteItem.isPending ||
    mut.uploadImage.isPending ||
    mut.deleteImage.isPending;
  const mutationError =
    mut.createItem.error?.message ??
    mut.updateItem.error?.message ??
    mut.deleteItem.error?.message ??
    mut.deleteImage.error?.message;

  if (error && isMissingNinjaItemsTableError(error.message)) {
    return (
      <div className="flex min-h-screen bg-[linear-gradient(180deg,#eef2f6_0%,#e8edf2_100%)]">
        <Sidebar area={area} onAreaChange={setArea} onBackToChooser={onBackToChooser} />
        <div className="flex flex-1 items-center justify-center p-6">
          <DbSetupPanel title="Ninja Survivors database setup" sql={NINJA_SURVIVORS_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#eef2f6_0%,#e8edf2_100%)]">
      <Sidebar area={area} onAreaChange={setArea} onBackToChooser={onBackToChooser} />

      <main className="min-w-0 flex-1 overflow-auto px-4 py-6 sm:px-8">
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
            {NINJA_AREAS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setArea(entry.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                  entry.id === area ? "bg-[#FF6A00] text-white" : "bg-white/70 text-slate-600"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onBackToChooser}
            className="shrink-0 rounded-full border border-white bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-600"
          >
            Switch app
          </button>
        </div>
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6A00]">
            Ninja Survivors
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">{currentArea.label}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Cards by section — click a card to add info, details, and images.
          </p>
        </div>

        {error && !isMissingNinjaItemsTableError(error.message) && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-700">
            <p>Could not load from Supabase: {error.message}</p>
            <p className="mt-2 font-semibold text-slate-700">
              If the project is paused, restore it in the{" "}
              <a
                href="https://supabase.com/dashboard/project/jyqkveskilclsdfwhpyi"
                target="_blank"
                rel="noreferrer"
                className="text-[#FF6A00] underline"
              >
                Supabase dashboard
              </a>{" "}
              and refresh this page.
            </p>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm font-medium text-slate-500">Loading board…</p>
        ) : (
          <NinjaBoardTable
            area={area}
            items={areaItems}
            busy={busy}
            onOpen={(item) => setOpenId(item.id)}
            onCreate={(input) =>
              mut.createItem.mutate(
                {
                  title: input.title,
                  info: "",
                  details: "",
                  stage: input.stage,
                  area: input.area,
                  owner: null,
                },
                { onSuccess: (created) => setOpenId(created.id) },
              )
            }
          />
        )}

        {mutationError && <p className="mt-6 text-sm font-medium text-red-600">{mutationError}</p>}
      </main>

      {openItem && (
        <NinjaItemModal
          item={openItem}
          busy={busy}
          uploadError={mut.uploadImage.error?.message ?? null}
          onClose={() => setOpenId(null)}
          onSave={(patch) => mut.updateItem.mutate({ id: openItem.id, patch })}
          onDelete={() => {
            if (confirm(`Delete "${openItem.title}"?`)) {
              mut.deleteItem.mutate(openItem, { onSuccess: () => setOpenId(null) });
            }
          }}
          onUpload={(file) => mut.uploadImage.mutate({ itemId: openItem.id, file })}
          onDeleteImage={(imageId) => {
            const image = openItem.images.find((entry) => entry.id === imageId);
            if (image) mut.deleteImage.mutate(image);
          }}
        />
      )}
    </div>
  );
}

function Sidebar({
  area,
  onAreaChange,
  onBackToChooser,
}: {
  area: NinjaItemArea;
  onAreaChange: (area: NinjaItemArea) => void;
  onBackToChooser: () => void;
}) {
  return (
    <aside className="hidden w-[15.5rem] shrink-0 flex-col border-r border-white/70 bg-white/40 px-3 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl md:flex">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="rounded-2xl bg-orange-100 p-2.5 text-[#FF6A00]">
          <Swords size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6A00]">Studio</p>
          <h2 className="text-sm font-black text-slate-800">Ninja Survivors</h2>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NINJA_AREAS.map((entry) => {
          const Icon = AREA_ICONS[entry.id];
          const active = entry.id === area;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onAreaChange(entry.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                active
                  ? "bg-[#FF6A00] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-800"
              }`}
            >
              <Icon size={16} />
              {entry.label}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={onBackToChooser}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-white bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-[#FF6A00] hover:text-white"
      >
        <ArrowLeft size={14} />
        Switch app
      </button>
    </aside>
  );
}
