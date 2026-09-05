import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { NinjaItemImage } from "./ninja-types";
import { ninjaImagePublicUrl } from "./ninja-types";

type Props = {
  images: NinjaItemImage[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
};

export function NinjaImageViewer({ images, index, onClose, onIndex }: Props) {
  const image = images[index];
  if (!image) return null;

  const last = images.length - 1;
  const go = (next: number) => {
    if (images.length === 0) return;
    onIndex((next + images.length) % images.length);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close image"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              go(index - 1);
            }}
            className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              go(index + 1);
            }}
            className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <figure
        className="flex max-h-full max-w-5xl flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={ninjaImagePublicUrl(image.filePath)}
          alt={image.fileName}
          className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        />
        <figcaption className="mt-3 text-center text-sm text-zinc-300">
          {image.fileName}
          {images.length > 1 && (
            <span className="ml-2 text-zinc-500">
              {index + 1} / {last + 1}
            </span>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
