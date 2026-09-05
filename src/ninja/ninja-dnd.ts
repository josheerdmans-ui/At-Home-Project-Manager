import type { NinjaItem, NinjaItemArea, NinjaItemStage } from "./ninja-types";

export type NinjaCardMove = {
  id: string;
  stage: NinjaItemStage;
  sortOrder: number;
};

function boardOrder(a: NinjaItem, b: NinjaItem) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.createdAt.localeCompare(b.createdAt);
}

export function nextSortOrder(
  items: NinjaItem[],
  area: NinjaItemArea,
  stage: NinjaItemStage,
): number {
  let max = -1;
  for (const item of items) {
    if (item.area === area && item.stage === stage) {
      max = Math.max(max, item.sortOrder);
    }
  }
  return max + 1;
}

export function applyCardMoves(items: NinjaItem[], moves: NinjaCardMove[]): NinjaItem[] {
  const byId = new Map(moves.map((move) => [move.id, move]));
  return items.map((item) => {
    const move = byId.get(item.id);
    return move ? { ...item, stage: move.stage, sortOrder: move.sortOrder } : item;
  });
}

export function planCardMove(
  items: NinjaItem[],
  draggedId: string,
  destStage: NinjaItemStage,
  destArea: NinjaItemArea,
  beforeId: string | null,
): NinjaCardMove[] {
  const dragged = items.find((item) => item.id === draggedId);
  if (!dragged) return [];
  if (draggedId === beforeId) return [];

  const dest = items
    .filter((item) => item.area === destArea && item.stage === destStage && item.id !== draggedId)
    .sort(boardOrder);

  const insertAt = beforeId ? dest.findIndex((item) => item.id === beforeId) : dest.length;
  const index = insertAt === -1 ? dest.length : insertAt;
  dest.splice(index, 0, { ...dragged, stage: destStage });

  const moves: NinjaCardMove[] = dest.map((item, sortOrder) => ({
    id: item.id,
    stage: destStage,
    sortOrder,
  }));

  if (dragged.stage !== destStage || dragged.area !== destArea) {
    const source = items
      .filter(
        (item) =>
          item.area === dragged.area && item.stage === dragged.stage && item.id !== draggedId,
      )
      .sort(boardOrder);
    for (const [sortOrder, item] of source.entries()) {
      moves.push({ id: item.id, stage: dragged.stage, sortOrder });
    }
  }

  const unchanged = moves.every((move) => {
    const item = items.find((entry) => entry.id === move.id);
    return item?.stage === move.stage && item.sortOrder === move.sortOrder;
  });
  return unchanged ? [] : moves;
}
