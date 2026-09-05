import { useState, type DragEvent, type FormEvent } from "react";
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
  onMove: (itemId: string, stage: NinjaItemStage, beforeId: string | null) => void;
};

const STAGE_DOT: Record<NinjaItemStage, string> = {
  idea: "bg-sky-400",
  working_on: "bg-[#FF6A00]",
  confirmed: "bg-violet-400",
  implemented: "bg-emerald-500",
};

const CARD_MIME = "text/ninja-card";

export function NinjaBoardTable({ area, items, busy, onCreate, onOpen, onMove }: Props) {
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
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onHover: (beforeId: string | null) => void;
  onDrop: (stage: NinjaItemStage, beforeId: string | null) => void;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const submitDraft = (e: FormEvent) => {
    e.preventDefault();
    const title = draft.trim();
    if (!title) {
      setAdding(false);
      return;
    }
    onCreate({ title, stage, area });
    setDraft("");
    setAdding(false);
  };

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
      className={`flex min-h-[28rem] min-w-[260px] flex-col rounded-2xl p-3 transition ${
        over ? "bg-[#e4eaf1] ring-2 ring-[#FF6A00]/30" : "bg-[#eef2f6]"
      }`}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-sm ${STAGE_DOT[stage]}`} />
        <h3 className="text-sm font-bold text-slate-800">{label}</h3>
        <span className="text-xs font-semibold text-slate-400">{items.length}</span>
        <MoreHorizontal size={14} className="ml-auto text-slate-300" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pr-0.5">
        {items.map((item) => (
          <div key={item.id}>
            {over?.beforeId === item.id && <DropLine />}
            <BoardCard
              item={item}
              dragging={dragId === item.id}
              onOpen={onOpen}
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

      {adding ? (
        <form onSubmit={submitDraft} className="mt-3">
          <input
            autoFocus
            value={draft}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (!draft.trim()) setAdding(false);
            }}
            placeholder="Card title"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white/60 py-2.5 text-sm font-semibold text-slate-500 hover:border-[#FF6A00] hover:text-[#FF6A00]"
        >
          <Plus size={14} />
          Add a card
        </button>
      )}
    </section>
  );
}

function DropLine() {
  return <div className="mb-3 h-1 rounded-full bg-[#FF6A00]" />;
}

function BoardCard({
  item,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: NinjaItem;
  dragging: boolean;
  onOpen: (item: NinjaItem) => void;
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
      onClick={() => {
        if (suppressClick) {
          setSuppressClick(false);
          return;
        }
        onOpen(item);
      }}
      className={`w-full cursor-grab rounded-xl bg-white p-3 text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.1)] active:cursor-grabbing ${
        dragging ? "opacity-40" : ""
      }`}
    >
      {preview.length === 1 && (
        <img
          src={ninjaImagePublicUrl(preview[0]!.filePath)}
          alt=""
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
              draggable={false}
              className="h-14 w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
      {item.info && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.info}</p>}

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
          <div className="mb-1 flex justify-end text-[10px] font-semibold text-slate-400">
            {done}/{total}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {item.owner ? (
            <>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
                {initialsFromName(item.owner)}
              </span>
              <span className="truncate text-xs font-medium text-slate-600">{item.owner}</span>
            </>
          ) : (
            <span className="text-xs text-slate-400">Unassigned</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-medium text-slate-400">
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
