import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  Bell,
  CircleHelp,
  Filter,
  Gamepad2,
  LayoutDashboard,
  Plus,
  Rocket,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { DbSetupPanel } from "../components/DbSetupPanel";
import { NINJA_SURVIVORS_SETUP_SQL } from "../lib/ninja-survivors-setup-sql";
import { NinjaBoardTable } from "./NinjaBoardTable";
import { NinjaDashboard } from "./NinjaDashboard";
import { NinjaGodotProgress } from "./NinjaGodotProgress";
import { NinjaItemModal } from "./NinjaItemModal";
import { NinjaSaveToast } from "./NinjaSaveToast";
import { initialsFromName, NINJA_AREAS, type NinjaItemArea, type NinjaItemStage } from "./ninja-types";
import { NinjaImageViewer } from "./NinjaImageViewer";
import { nextSortOrder, planCardMove } from "./ninja-dnd";
import { NinjaIcon, NinjaLogo } from "./NinjaBrand";
import { NINJA } from "./ninja-ui";
import {
  isMissingNinjaItemsTableError,
  useNinjaItems,
  useNinjaItemsMutations,
} from "./useNinjaItems";
import { useNinjaIdeas, useNinjaIdeasMutations } from "./useNinjaIdeas";
import { useNinjaProgress, useNinjaProgressMutations } from "./useNinjaProgress";

type HubScreen = "dashboard" | "progress" | NinjaItemArea;

function isBoardScreen(screen: HubScreen): screen is NinjaItemArea {
  return screen !== "dashboard" && screen !== "progress";
}

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
  const ideasQuery = useNinjaIdeas();
  const ideaMut = useNinjaIdeasMutations();
  const progressQuery = useNinjaProgress();
  const progressMut = useNinjaProgressMutations();
  const [screen, setScreen] = useState<HubScreen>("dashboard");
  const area: NinjaItemArea = isBoardScreen(screen) ? screen : "character_design";
  const [openId, setOpenId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ itemId: string; imageId: string } | null>(null);
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

  const currentArea =
    screen === "dashboard"
      ? { id: "dashboard" as const, label: "Dashboard" }
      : screen === "progress"
        ? { id: "progress" as const, label: "Godot Progress" }
        : (NINJA_AREAS.find((entry) => entry.id === screen) ?? {
            id: screen,
            label: "Character Design",
          });
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
  const areaCounts = useMemo(() => {
    const counts = Object.fromEntries(NINJA_AREAS.map((entry) => [entry.id, 0])) as Record<
      NinjaItemArea,
      number
    >;
    for (const item of items) {
      counts[item.area] += 1;
    }
    return counts;
  }, [items]);
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
  const previewItem = preview ? (items.find((item) => item.id === preview.itemId) ?? null) : null;
  const previewImages = previewItem?.images ?? [];
  const previewIndex = preview ? previewImages.findIndex((image) => image.id === preview.imageId) : -1;
  const busy =
    mut.createItem.isPending ||
    mut.updateItem.isPending ||
    mut.deleteItem.isPending ||
    mut.uploadImage.isPending ||
    mut.deleteImage.isPending ||
    mut.addCheck.isPending ||
    mut.toggleCheck.isPending ||
    mut.deleteCheck.isPending ||
    mut.moveCards.isPending ||
    ideaMut.createIdea.isPending ||
    ideaMut.toggleVote.isPending ||
    ideaMut.deleteIdea.isPending ||
    progressMut.createUpdate.isPending ||
    progressMut.deleteUpdate.isPending;
  const mutationError =
    mut.createItem.error?.message ??
    mut.updateItem.error?.message ??
    mut.moveCards.error?.message ??
    mut.deleteItem.error?.message ??
    mut.deleteImage.error?.message;

  const createCard = (
    title: string,
    stage: NinjaItemStage,
    destArea: NinjaItemArea = area,
    extra?: { info?: string; tags?: string[] },
  ) => {
    mut.createItem.mutate(
      {
        title,
        info: extra?.info ?? "",
        details: "",
        stage,
        area: destArea,
        owner: user,
        dueDate: null,
        priority: "medium",
        tags: extra?.tags ?? [],
        sortOrder: nextSortOrder(items, destArea, stage),
      },
      {
        onSuccess: (created) => {
          flashSaved("Card created");
          setScreen(destArea);
          setOpenId(created.id);
        },
      },
    );
  };

  if (error && isMissingNinjaItemsTableError(error.message)) {
    return (
      <div className={`relative flex min-h-screen overflow-hidden ${NINJA.page}`}>
        <Sidebar
          screen={screen}
          counts={areaCounts}
          ideaCount={0}
          progressCount={0}
          onScreenChange={setScreen}
          onBackToChooser={onBackToChooser}
        />
        <div className="flex flex-1 items-center justify-center p-6">
          <DbSetupPanel title="Ninja Survivors database setup" sql={NINJA_SURVIVORS_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-screen overflow-hidden ${NINJA.page}`}>
      <div className="pointer-events-none absolute -top-28 right-10 h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#FF8C42]/10 blur-[120px]" />
      <Sidebar
        screen={screen}
        counts={areaCounts}
        ideaCount={ideasQuery.data?.length ?? 0}
        progressCount={progressQuery.data?.length ?? 0}
        onScreenChange={setScreen}
        onBackToChooser={onBackToChooser}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className={`relative z-10 flex flex-wrap items-start justify-between gap-4 border-b px-6 py-4 ${NINJA.header}`}>
          {screen === "progress" ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8C42]">
                Ninjatards / Godot Progress
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8C42]">
                Ninjatards / {currentArea.label}
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">{currentArea.label}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {screen === "dashboard"
                  ? "Studio snapshot, newest cards, and quick ideas the team can vote on."
                  : "Cards by section — click a card to add info, details, and images."}
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {isBoardScreen(screen) && (
              <>
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-[#16181F] px-3 py-2 text-sm text-zinc-400">
              <Search size={15} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cards..."
                className="w-36 bg-transparent text-white outline-none placeholder:text-zinc-500 sm:w-48"
              />
              <span className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 sm:inline">
                ⌘ K
              </span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter((open) => !open)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#1E2028] px-3 py-2 text-sm font-semibold text-zinc-300"
              >
                <Filter size={14} />
                Filter
              </button>
              {showFilter && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#1E2028] p-2 shadow-2xl">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                    Owner
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOwnerFilter("");
                      setShowFilter(false);
                    }}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/5"
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
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/5"
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
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold disabled:opacity-50 ${NINJA.orangeBtn}`}
            >
              <Plus size={15} />
              New card
            </button>
              </>
            )}
            <button type="button" className="rounded-full p-2 text-zinc-400 hover:bg-white/5" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <button
              type="button"
              onClick={onSwitchPerson}
              title="Switch person"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-white/5"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8C42]/20 text-[10px] font-bold text-[#FF8C42]">
                {initialsFromName(displayName)}
              </span>
              <span className="hidden text-sm font-semibold text-zinc-200 sm:inline">{displayName}</span>
            </button>
          </div>
        </header>

        <main className="relative z-10 flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center gap-3 md:hidden">
            <NinjaIcon className="h-10 w-10 shrink-0" />
            <NinjaLogo className="h-8 min-w-0 flex-1" />
          </div>
          <div className="mb-3 flex gap-2 overflow-x-auto md:hidden">
            <button
              type="button"
              onClick={() => setScreen("dashboard")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                screen === "dashboard" ? "bg-[#FF8C42] text-white" : "bg-[#1E2028] text-zinc-300"
              }`}
            >
              Dashboard
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] ${
                  screen === "dashboard" ? "bg-white/20 text-white" : "bg-[#FF8C42] text-white"
                }`}
              >
                {ideasQuery.data?.length ?? 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setScreen("progress")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                screen === "progress" ? "bg-[#FF8C42] text-white" : "bg-[#1E2028] text-zinc-300"
              }`}
            >
              Godot Progress
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] ${
                  screen === "progress" ? "bg-white/20 text-white" : "bg-[#FF8C42] text-white"
                }`}
              >
                {progressQuery.data?.length ?? 0}
              </span>
            </button>
            {NINJA_AREAS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setScreen(entry.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                  entry.id === screen ? "bg-[#FF8C42] text-white" : "bg-[#1E2028] text-zinc-300"
                }`}
              >
                {entry.label}
                <span
                  className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] ${
                    entry.id === screen ? "bg-white/20 text-white" : "bg-[#FF8C42] text-white"
                  }`}
                >
                  {areaCounts[entry.id]}
                </span>
              </button>
            ))}
          </div>

          {error && !isMissingNinjaItemsTableError(error.message) && (
            <p className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
              Could not load from Supabase: {error.message}
            </p>
          )}

          {isLoading ? (
            <p className="text-sm font-medium text-zinc-400">Loading board…</p>
          ) : screen === "dashboard" ? (
            <NinjaDashboard
              user={user}
              items={items}
              ideas={ideasQuery.data ?? []}
              ideasLoading={ideasQuery.isLoading}
              ideasError={
                ideasQuery.error
                  ? `Could not load ideas: ${ideasQuery.error.message}`
                  : (ideaMut.createIdea.error?.message ??
                    ideaMut.toggleVote.error?.message ??
                    ideaMut.deleteIdea.error?.message ??
                    null)
              }
              busy={busy}
              onOpenItem={(item) => setOpenId(item.id)}
              onAddIdea={(title) =>
                ideaMut.createIdea.mutate(
                  { title, createdBy: user },
                  { onSuccess: () => flashSaved("Idea added") },
                )
              }
              onVote={(idea) => ideaMut.toggleVote.mutate({ idea, voter: user })}
              onPromoteIdea={(idea, destArea) => {
                mut.createItem.mutate(
                  {
                    title: idea.title,
                    info: idea.voters.length > 0 ? `Hearted by: ${idea.voters.join(", ")}` : "",
                    details: "",
                    stage: "idea",
                    area: destArea,
                    owner: user,
                    dueDate: null,
                    priority: "medium",
                    tags: ["quick-idea"],
                    sortOrder: nextSortOrder(items, destArea, "idea"),
                  },
                  {
                    onSuccess: (created) => {
                      ideaMut.deleteIdea.mutate(idea.id);
                      flashSaved("Moved to board");
                      setScreen(destArea);
                      setOpenId(created.id);
                    },
                  },
                );
              }}
              updates={progressQuery.data ?? []}
              updatesLoading={progressQuery.isLoading}
              updatesError={
                progressQuery.error
                  ? `Could not load updates: ${progressQuery.error.message}`
                  : null
              }
              onOpenProgress={() => setScreen("progress")}
              onDeleteIdea={(idea) => {
                if (confirm(`Delete idea "${idea.title}"?`)) {
                  ideaMut.deleteIdea.mutate(idea.id, { onSuccess: () => flashSaved("Idea removed") });
                }
              }}
            />
          ) : screen === "progress" ? (
            <NinjaGodotProgress
              user={user}
              updates={progressQuery.data ?? []}
              loading={progressQuery.isLoading}
              error={
                progressQuery.error
                  ? `Could not load updates: ${progressQuery.error.message}`
                  : (progressMut.createUpdate.error?.message ??
                    progressMut.deleteUpdate.error?.message ??
                    null)
              }
              busy={busy}
              onPublish={({ version, title, releasedOn, category, body }) =>
                progressMut.createUpdate.mutate(
                  { version, title, releasedOn, category, body, createdBy: user },
                  { onSuccess: () => flashSaved("Progress posted") },
                )
              }
              onDelete={(update) => {
                if (confirm(`Delete Godot ${update.version} update?`)) {
                  progressMut.deleteUpdate.mutate(update.id, {
                    onSuccess: () => flashSaved("Update removed"),
                  });
                }
              }}
            />
          ) : (
            <NinjaBoardTable
              area={area}
              items={areaItems}
              busy={busy}
              onOpen={(item) => setOpenId(item.id)}
              onViewImage={(item, imageId) => setPreview({ itemId: item.id, imageId })}
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

          {mutationError && <p className="mt-3 text-sm font-medium text-rose-400">{mutationError}</p>}
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
          onUpload={(files) =>
            mut.uploadImage.mutate(
              { itemId: openItem.id, files, actor: user },
              {
                onSuccess: (uploaded) =>
                  flashSaved(uploaded.length === 1 ? "Image saved" : `${uploaded.length} images saved`),
              },
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

      {preview && previewIndex >= 0 && (
        <NinjaImageViewer
          images={previewImages}
          index={previewIndex}
          onClose={() => setPreview(null)}
          onIndex={(next) => {
            const image = previewImages[next];
            if (image) setPreview({ itemId: preview.itemId, imageId: image.id });
          }}
        />
      )}

      <NinjaSaveToast message={saveNotice} />
    </div>
  );
}

function Sidebar({
  screen,
  counts,
  ideaCount,
  progressCount,
  onScreenChange,
  onBackToChooser,
}: {
  screen: HubScreen;
  counts: Record<NinjaItemArea, number>;
  ideaCount: number;
  progressCount: number;
  onScreenChange: (screen: HubScreen) => void;
  onBackToChooser: () => void;
}) {
  return (
    <aside className={`relative z-10 hidden w-64 shrink-0 flex-col border-r px-3 py-5 md:flex ${NINJA.sidebar}`}>
      <div className="mb-6 px-1">
        <div className="mb-3 flex items-center gap-3">
          <NinjaIcon className="h-12 w-12 shrink-0 ring-1 ring-[#FF8C42]/30" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF8C42]">Studio</p>
        </div>
        <NinjaLogo className="h-11 w-full" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <button
          type="button"
          onClick={() => onScreenChange("dashboard")}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
            screen === "dashboard"
              ? "bg-[#FF8C42]/15 text-white shadow-[0_0_24px_rgba(255,140,66,0.12)]"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          <LayoutDashboard size={16} className={`shrink-0 ${screen === "dashboard" ? "text-[#FF8C42]" : ""}`} />
          <span className="min-w-0 flex-1 truncate">Dashboard</span>
          <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FF8C42] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {ideaCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onScreenChange("progress")}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
            screen === "progress"
              ? "bg-[#FF8C42]/15 text-white shadow-[0_0_24px_rgba(255,140,66,0.12)]"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
          }`}
        >
          <Rocket size={16} className={`shrink-0 ${screen === "progress" ? "text-[#FF8C42]" : ""}`} />
          <span className="min-w-0 flex-1 truncate">Godot Progress</span>
          <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FF8C42] px-1.5 py-0.5 text-[10px] font-bold text-white">
            {progressCount}
          </span>
        </button>
        {NINJA_AREAS.map((entry) => {
          const Icon = AREA_ICONS[entry.id];
          const active = entry.id === screen;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onScreenChange(entry.id)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                active
                  ? "bg-[#FF8C42]/15 text-white shadow-[0_0_24px_rgba(255,140,66,0.12)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <Icon size={16} className={`shrink-0 ${active ? "text-[#FF8C42]" : ""}`} />
              <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[#FF8C42] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {counts[entry.id]}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/8 pt-3">
        <button
          type="button"
          onClick={onBackToChooser}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          type="button"
          onClick={onBackToChooser}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
        >
          <CircleHelp size={16} />
          Help & Support
        </button>
        <button
          type="button"
          onClick={onBackToChooser}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
        >
          <ArrowLeft size={16} />
          Switch app
        </button>
      </div>
    </aside>
  );
}
