import { useEffect, useMemo, useState } from "react";
import { HomeClockWeather } from "./HomeClockWeather";
import { useImageVault, imagePublicUrl } from "../rooms/image-vault/useImageVault";

const IDLE_MS = 60_000;
const SLIDE_MS = 8_000;

type Props = {
  enabled: boolean;
};

export function HomeScreensaver({ enabled }: Props) {
  const [idle, setIdle] = useState(false);
  const [slide, setSlide] = useState(0);
  const { data: photos = [] } = useImageVault();

  const urls = useMemo(
    () => photos.map((p) => imagePublicUrl(p.file_path)).filter(Boolean),
    [photos],
  );

  useEffect(() => {
    if (!enabled) {
      setIdle(false);
      return;
    }

    let timer = window.setTimeout(() => setIdle(true), IDLE_MS);

    const bump = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), IDLE_MS);
    };

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", bump, opts);
    window.addEventListener("pointermove", bump, opts);
    window.addEventListener("keydown", bump);
    window.addEventListener("touchstart", bump, opts);
    window.addEventListener("wheel", bump, opts);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("touchstart", bump);
      window.removeEventListener("wheel", bump);
    };
  }, [enabled]);

  useEffect(() => {
    if (!idle || urls.length === 0) return;
    const id = window.setInterval(() => {
      setSlide((s) => (s + 1) % urls.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [idle, urls.length]);

  if (!enabled || !idle) return null;

  const bg = urls.length > 0 ? urls[slide % urls.length] : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col bg-slate-900"
      role="presentation"
      onPointerDown={() => setIdle(false)}
    >
      {bg ? (
        <img
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/35" />
      <div className="relative z-10 flex h-full flex-col items-end justify-between p-10 sm:p-14">
        <HomeClockWeather compact />
        <p className="w-full text-center text-sm font-semibold tracking-wide text-white/70">
          Touch anywhere to return
        </p>
      </div>
    </div>
  );
}
