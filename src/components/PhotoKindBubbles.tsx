import type { ImagePhotoKind } from "../../types";

type Props = {
  onPick: (kind: ImagePhotoKind) => void;
  onClose: () => void;
};

export function PhotoKindBubbles({ onPick, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-md"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex items-center gap-8"
        role="group"
        aria-label="Photo type"
      >
        <button
          type="button"
          onClick={() => onPick("memory")}
          className="min-w-[160px] rounded-full bg-blue-600 px-14 py-6 text-2xl font-black text-white shadow-[0_12px_40px_rgb(37,99,235,0.45)] transition hover:bg-blue-500 hover:scale-105 active:scale-100"
        >
          Memory
        </button>
        <button
          type="button"
          onClick={() => onPick("person")}
          className="min-w-[160px] rounded-full bg-purple-600 px-14 py-6 text-2xl font-black text-white shadow-[0_12px_40px_rgb(147,51,234,0.45)] transition hover:bg-purple-500 hover:scale-105 active:scale-100"
        >
          Person
        </button>
      </div>
    </div>
  );
}
