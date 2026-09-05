import { useState, type DragEvent } from "react";
import { CalendarDays, Image as ImageIcon, MoreHorizontal, Plus } from "lucide-react";
import type { NinjaItem, NinjaItemArea, NinjaItemStage } from "./ninja-types";
import {
  formatDueDate,
  initialsFromName,
  NINJA_STAGES,
  ninjaImagePublicUrl,
} from "./ninja-types";
import { tagStyle } from "./ninja-ui";

type Props = {
  area: NinjaItemArea;
  items: NinjaItem[];
  busy: boolean;
  onCreate: (input: { title: string; stage: NinjaItemStage; area: NinjaItemArea }) => void;
  onOpen: (item: NinjaItem) => void;
  onViewImage: (item: NinjaItem, imageId: string) => void;
  onMove: (itemId: string, stage: NinjaItemStage, beforeId: string | null) => void;
};

const STAGE_DOT: Record<NinjaItemStage, string> = {
  idea: "bg-[#2DD4BF] shadow-[0_0_10px_rgba(45,212,191,0.7)]",
  working_on: "bg-[#FF8C42] shadow-[0_0_10px_rgba(255,140,66,0.7)]",
  confirmed: "bg-[#D946EF] shadow-[0_0_10px_rgba(217,70,239,0.7)]",
  implemented: "bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.55)]",
};

const CARD_MIME = "text/ninja-card";

export function NinjaBoardTable({ area, items, busy, onCreate, onOpen, onViewImage, onMove }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ stage: NinjaItemStage; beforeId: string | null } | null>(null);

  const dropOn = (stage: NinjaItemStage, beforeId: string | null) => {
    if (!dragId) return;
    onMove(dragId, stage, beforeId);
    setDragId(null);
    setOver(null);
  };

  return (
    <div className="grid min-h-0 flex-1 gap-4 overflow-x-auto pb-2 lg:grid-cols-4">
      {NINJA_STAGES.map((stage) => (
        <KanbanColumn
          key={stage.id}
          area={area}
          stage={stage.id}
          label={stage.label}
          items={items
            .filter((item) => item.stage === stage.id)
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))}
          busy={busy}
          dragId={dragId}
          over={over?.stage === stage.id ? over : null}
          onCreate={onCreate}
          onOpen={onOpen}
          onViewImage={onViewImage}
          onDragStart={setDragId}
          onDragEnd={() => {
            setDragId(null);
            setOver(null);
          }}
          onHover={(beforeId) => setOver({ stage: stage.id, beforeId })}
          onDrop={dropOn}
        />
      ))}
    </div>
  );
}

function KanbanColumn({
  area,
  stage,
  label,
  items,
  busy,
  dragId,
  over,
  onCreate,
  onOpen,
  onViewImage,
  onDragStart,
  onDragEnd,
  onHover,
  onDrop,
}: {
  area: NinjaItemArea;
  stage: NinjaItemStage;
  label: string;
  items: NinjaItem[];
  busy: boolean;
  dragId: string | null;
  over: { stage: NinjaItemStage; beforeId: string | null } | null;
  onCreate: Props["onCreate"];
  onOpen: Props["onOpen"];
  onViewImage: Props["onViewImage"];
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onHover: (beforeId: string | null) => void;
  onDrop: (stage: NinjaItemStage, beforeId: string | null) => void;
}) {
  const allowDrop = (event: DragEvent) => {
    if (!dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  return (
    <section
      onDragOver={(event) => {
        allowDrop(event);
        if (event.defaultPrevented) onHover(null);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(stage, null);
      }}
      className={`flex min-h-[28rem] min-w-[260px] flex-col rounded-3xl p-3 transition ${
        over ? "bg-white/8 ring-2 ring-[#FF8C42]/40" : "bg-[#16181F]/80"
      }`}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${STAGE_DOT[stage]}`} />
        <h3 className="text-sm font-bold text-white">{label}</h3>
        <span className="text-xs font-semibold text-zinc-500">{items.length}</span>
        <MoreHorizontal size={14} className="ml-auto text-zinc-600" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-0.5">
        {items.map((item) => (
          <div key={item.id}>
            {over?.beforeId === item.id && <DropLine />}
            <BoardCard
              item={item}
              dragging={dragId === item.id}
              onOpen={onOpen}
              onViewImage={onViewImage}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={(event) => {
                allowDrop(event);
                if (!event.defaultPrevented) return;
                event.stopPropagation();
                onHover(item.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDrop(stage, item.id);
              }}
            />
          </div>
        ))}
        {over && over.beforeId === null && items.length > 0 && <DropLine />}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => onCreate({ title: "Untitled card", stage, area })}
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#FF8C42]/40 bg-[#FF8C42]/10 py-2.5 text-sm font-semibold text-[#FF8C42] hover:border-[#FF8C42] hover:bg-[#FF8C42]/20 disabled:opacity-50"
      >
        <Plus size={14} />
        Add a card
      </button>
    </section>
  );
}

function DropLine() {
  return <div className="mb-3 h-1 rounded-full bg-[#FF8C42] shadow-[0_0_12px_rgba(255,140,66,0.8)]" />;
}

function BoardCard({
  item,
  dragging,
  onOpen,
  onViewImage,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: NinjaItem;
  dragging: boolean;
  onOpen: (item: NinjaItem) => void;
  onViewImage: (item: NinjaItem, imageId: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
}) {
  const done = item.checks.filter((check) => check.done).length;
  const total = item.checks.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const preview = item.images.slice(0, 4);
  const [suppressClick, setSuppressClick] = useState(false);

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(CARD_MIME, item.id);
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
        setSuppressClick(true);
        onDragStart(item.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={(event) => {
        if (suppressClick) {
          setSuppressClick(false);
          return;
        }
        const target = event.target;
        if (target instanceof HTMLImageElement && target.dataset.imageId) {
          onViewImage(item, target.dataset.imageId);
          return;
        }
        onOpen(item);
      }}
      className={`w-full cursor-grab rounded-2xl border border-white/8 bg-[#1E2028] p-3 text-left shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_18px_40px_rgba(0,0,0,0.5)] active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      }`}
    >
      {preview.length === 1 && (
        <img
          src={ninjaImagePublicUrl(preview[0]!.filePath)}
          alt=""
          data-image-id={preview[0]!.id}
          draggable={false}
          className="mb-3 h-28 w-full rounded-lg object-cover"
        />
      )}
      {preview.length > 1 && (
        <div className="mb-3 grid grid-cols-2 gap-1">
          {preview.map((image) => (
            <img
              key={image.id}
              src={ninjaImagePublicUrl(image.filePath)}
              alt=""
              data-image-id={image.id}
              draggable={false}
              className="h-14 w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      <h4 className="text-sm font-bold text-white">{item.title}</h4>
      {item.info && <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-400">{item.info}</p>}

      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagStyle(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex justify-end text-[10px] font-semibold text-zinc-500">
            {done}/{total}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#FF8C42]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {item.owner ? (
            <>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF8C42]/20 text-[9px] font-bold text-[#FF8C42]">
                {initialsFromName(item.owner)}
              </span>
              <span className="truncate text-xs font-medium text-zinc-300">{item.owner}</span>
            </>
          ) : (
            <span className="text-xs text-zinc-500">Unassigned</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-medium text-zinc-500">
          {item.images.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon size={11} />
              {item.images.length}
            </span>
          )}
          {item.dueDate && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} />
              {formatDueDate(item.dueDate)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
