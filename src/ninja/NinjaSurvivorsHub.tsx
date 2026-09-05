import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  Bell,
  CircleHelp,
  Filter,
  Gamepad2,
  Plus,
  Search,
  Settings,
  Sparkles,
  Swords,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { DbSetupPanel } from "../components/DbSetupPanel";
import { NINJA_SURVIVORS_SETUP_SQL } from "../lib/ninja-survivors-setup-sql";
import { NinjaBoardTable } from "./NinjaBoardTable";
import { NinjaItemModal } from "./NinjaItemModal";
import { NinjaSaveToast } from "./NinjaSaveToast";
import { initialsFromName, NINJA_AREAS, type NinjaItemArea, type NinjaItemStage } from "./ninja-types";
import { nextSortOrder, planCardMove } from "./ninja-dnd";
import {
  isMissingNinjaItemsTableError,
  useNinjaItems,
  useNinjaItemsMutations,
} from "./useNinjaItems";

type Props = {
  user: string;
  onSwitchPerson: () => void;
  onBackToChooser: () => void;
};

const AREA_ICONS: Record<NinjaItemArea, typeof UserRound> = {
  character_design: UserRound,
  level_up_system: TrendingUp,
  game_design_vfx: Sparkles,
  core_gameplay: Gamepad2,
  character_progression: Award,
};

export function NinjaSurvivorsHub({ user, onSwitchPerson, onBackToChooser }: Props) {
  const { data: items = [], isLoading, error } = useNinjaItems();
  const mut = useNinjaItemsMutations();
  const [area, setArea] = useState<NinjaItemArea>("character_design");
  const [openId, setOpenId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const flashSaved = (message = "Saved") => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaveNotice(message);
    saveTimer.current = window.setTimeout(() => setSaveNotice(null), 2200);
  };

  const currentArea = NINJA_AREAS.find((entry) => entry.id === area) ?? {
    id: area,
    label: "Character Design",
  };
  const ownerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [user, ...items.map((item) => item.owner)].filter((name): name is string => Boolean(name)),
        ),
      ),
    [items, user],
  );
  const displayName = user;
  const areaItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (item.area !== area) return false;
      if (ownerFilter && item.owner !== ownerFilter) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.info.toLowerCase().includes(needle) ||
        item.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [items, area, query, ownerFilter]);
  const openItem = items.find((item) => item.id === openId) ?? null;
  const busy =
    mut.createItem.isPending ||
    mut.updateItem.isPending ||
    mut.deleteItem.isPending ||
    mut.uploadImage.isPending ||
    mut.deleteImage.isPending ||
    mut.addCheck.isPending ||
    mut.toggleCheck.isPending ||
    mut.deleteCheck.isPending ||
    mut.moveCards.isPending;
  const mutationError =
    mut.createItem.error?.message ??
    mut.updateItem.error?.message ??
    mut.moveCards.error?.message ??
    mut.deleteItem.error?.message ??
    mut.deleteImage.error?.message;

  const createCard = (title: string, stage: NinjaItemStage) => {
    mut.createItem.mutate(
      {
        title,
        info: "",
        details: "",
        stage,
        area,
        owner: user,
        dueDate: null,
        priority: "medium",
        tags: [],
        sortOrder: nextSortOrder(items, area, stage),
      },
      {
        onSuccess: (created) => {
          flashSaved("Card created");
          setOpenId(created.id);
        },
      },
    );
  };

  if (error && isMissingNinjaItemsTableError(error.message)) {
    return (
      <div className="flex min-h-screen bg-[#f4f6f8]">
        <Sidebar area={area} onAreaChange={setArea} onBackToChooser={onBackToChooser} />
        <div className="flex flex-1 items-center justify-center p-6">
          <DbSetupPanel title="Ninja Survivors database setup" sql={NINJA_SURVIVORS_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f8]">
      <Sidebar area={area} onAreaChange={setArea} onBackToChooser={onBackToChooser} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 bg-white px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6A00]">
              Ninja Survivors / {currentArea.label}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{currentArea.label}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Cards by section — click a card to add info, details, and images.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-2 text-sm text-slate-500">
              <Search size={15} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards..."
                className="w-36 bg-transparent outline-none sm:w-48"
              />
              <span className="hidden rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">
                ⌘ K
              </span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter((open) => !open)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
              >
                <Filter size={14} />
                Filter
              </button>
              {showFilter && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Owner
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerFilter("");
                      setShowFilter(false);
                    }}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                  >
                    Everyone
                  </button>
                  {ownerOptions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setOwnerFilter(name);
                        setShowFilter(false);
                      }}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => createCard("Untitled card", "idea")}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6A00] px-4 py-2 text-sm font-bold text-white hover:bg-[#e65f00]"
            >
              <Plus size={15} />
              New card
            </button>
            <button type="button" className="rounded-full p-2 text-slate-400 hover:bg-slate-100" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button
              type="button"
              onClick={onSwitchPerson}
              title="Switch person"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                {initialsFromName(displayName)}
              </span>
              <span className="hidden text-sm font-semibold text-slate-700 sm:inline">{displayName}</span>
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
          <div className="mb-3 flex gap-2 overflow-x-auto md:hidden">
            {NINJA_AREAS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setArea(entry.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                  entry.id === area ? "bg-[#FF6A00] text-white" : "bg-white text-slate-600"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {error && !isMissingNinjaItemsTableError(error.message) && (
            <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Could not load from Supabase: {error.message}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm font-medium text-slate-500">Loading board…</p>
          ) : (
            <NinjaBoardTable
              area={area}
              items={areaItems}
              busy={busy}
              onOpen={(item) => setOpenId(item.id)}
              onCreate={(input) => createCard(input.title, input.stage)}
              onMove={(itemId, stage, beforeId) => {
                const dragged = items.find((item) => item.id === itemId);
                const moves = planCardMove(items, itemId, stage, area, beforeId);
                if (!dragged || moves.length === 0) return;
                mut.moveCards.mutate({
                  moves,
                  draggedId: itemId,
                  fromStage: dragged.stage,
                  actor: user,
                });
              }}
            />
          )}

          {mutationError && <p className="mt-3 text-sm font-medium text-red-600">{mutationError}</p>}
        </main>
      </div>

      {openItem && (
        <NinjaItemModal
          item={openItem}
          ownerOptions={ownerOptions}
          busy={busy}
          uploadError={mut.uploadImage.error?.message ?? null}
          onClose={() => setOpenId(null)}
          onSave={(patch, after, silent) =>
            mut.updateItem.mutate(
              { id: openItem.id, patch, actor: user, silent },
              {
                onSuccess: () => {
                  flashSaved();
                  after?.();
                },
              },
            )
          }
          onDelete={() => {
            if (confirm(`Delete "${openItem.title}"?`)) {
              mut.deleteItem.mutate(openItem, { onSuccess: () => setOpenId(null) });
            }
          }}
          onUpload={(file) =>
            mut.uploadImage.mutate(
              { itemId: openItem.id, file, actor: user },
              { onSuccess: () => flashSaved("Image saved") },
            )
          }
          onDeleteImage={(imageId) => {
            const image = openItem.images.find((entry) => entry.id === imageId);
            if (image) {
              mut.deleteImage.mutate(image, { onSuccess: () => flashSaved("Image removed") });
            }
          }}
          onAddCheck={(title) =>
            mut.addCheck.mutate({
              itemId: openItem.id,
              title,
              sortOrder: openItem.checks.length,
              actor: user,
            })
          }
          onToggleCheck={(id, done) => mut.toggleCheck.mutate({ id, done })}
          onDeleteCheck={(id) => mut.deleteCheck.mutate(id)}
        />
      )}

      <NinjaSaveToast message={saveNotice} />
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
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="rounded-xl bg-[#FF6A00] p-2 text-white">
          <Swords size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6A00]">Studio</p>
          <h2 className="text-sm font-black text-slate-900">Ninja Survivors</h2>
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                active ? "bg-[#FF6A00] text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {entry.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onBackToChooser}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          type="button"
          onClick={onBackToChooser}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          <CircleHelp size={16} />
          Help & Support
        </button>
        <button
          type="button"
          onClick={onBackToChooser}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          Switch app
        </button>
      </div>
    </aside>
  );
}
