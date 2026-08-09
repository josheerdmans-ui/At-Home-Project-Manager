import { useEffect, useMemo, useState } from "react";
import { Images, Pause, Play } from "lucide-react";
import { DbSetupPanel } from "../components/DbSetupPanel";
import { WALL_DISPLAY_SETUP_SQL } from "../lib/wall-display-setup-sql";
import { IMAGE_VAULT_SETUP_SQL } from "../lib/image-vault-setup-sql";
import {
  isMissingSettingsTableError,
  useHouseholdSettings,
  useHouseholdSettingsMutations,
} from "../hooks/useHouseholdSettings";
import {
  isMissingImageVaultTableError,
  useImageVault,
} from "../rooms/image-vault/useImageVault";
import { imagePublicUrl } from "../rooms/image-vault/image-vault-utils";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function WallFrameMode() {
  const { data: photos = [], error: photosError, isLoading } = useImageVault();
  const { data: settings, error: settingsError } = useHouseholdSettings();
  const updateSettings = useHouseholdSettingsMutations();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const includePerson = settings?.frame_include_person ?? true;
  const intervalSec = settings?.frame_interval_sec ?? 8;
  const doShuffle = settings?.frame_shuffle ?? true;

  const framePhotos = useMemo(() => {
    const filtered = photos.filter(
      (p) => p.photo_kind === "memory" || (includePerson && p.photo_kind === "person"),
    );
    return doShuffle ? shuffle(filtered) : filtered;
  }, [photos, includePerson, doShuffle]);

  useEffect(() => {
    setIndex(0);
  }, [framePhotos.length, doShuffle, includePerson]);

  useEffect(() => {
    if (paused || framePhotos.length <= 1) return;
    const ms = Math.max(3, intervalSec) * 1000;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % framePhotos.length);
    }, ms);
    return () => clearInterval(t);
  }, [paused, framePhotos.length, intervalSec]);

  if (photosError && isMissingImageVaultTableError(photosError.message)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <DbSetupPanel title="Image Vault database setup" sql={IMAGE_VAULT_SETUP_SQL} />
      </div>
    );
  }

  if (settingsError && isMissingSettingsTableError(settingsError.message)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <DbSetupPanel title="Family wall database setup" sql={WALL_DISPLAY_SETUP_SQL} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-xl text-slate-500">Loading photos…</div>
    );
  }

  if (framePhotos.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white/40 p-10 text-center">
        <Images size={48} className="text-slate-400" />
        <p className="max-w-md text-2xl font-semibold text-slate-700">
          No photos in Image Vault yet. Add memory photos from the Image room, then return here.
        </p>
      </div>
    );
  }

  const current = framePhotos[index % framePhotos.length]!;
  const url = imagePublicUrl(current.file_path);

  return (
    <div
      className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-white/70 bg-slate-900 shadow-[0_12px_40px_rgb(0,0,0,0.2)]"
      onClick={() => setPaused((p) => !p)}
      role="presentation"
    >
      <img
        src={url}
        alt={current.notes || current.file_name}
        className="h-full w-full object-cover transition-opacity duration-700"
        key={current.id}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-6 pb-6 pt-16">
        <p className="text-4xl font-black tabular-nums text-white drop-shadow sm:text-5xl">
          {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </p>
        <p className="text-lg font-semibold text-white/90 sm:text-xl">
          {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>
      <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-black/40 px-4 py-2 font-bold text-white backdrop-blur-md"
        >
          {paused ? <Play size={18} /> : <Pause size={18} />}
          {paused ? "Play" : "Pause"}
        </button>
        <label className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-black/40 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md">
          Interval
          <select
            value={intervalSec}
            onChange={(e) => updateSettings.mutate({ frame_interval_sec: Number(e.target.value) })}
            className="rounded-lg border-0 bg-white/20 px-2 py-1 text-white"
          >
            {[5, 8, 12, 20, 30].map((n) => (
              <option key={n} value={n} className="text-slate-800">
                {n}s
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => updateSettings.mutate({ frame_shuffle: !doShuffle })}
          className="rounded-2xl border border-white/40 bg-black/40 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md"
        >
          Shuffle: {doShuffle ? "On" : "Off"}
        </button>
        <button
          type="button"
          onClick={() => updateSettings.mutate({ frame_include_person: !includePerson })}
          className="rounded-2xl border border-white/40 bg-black/40 px-3 py-2 text-sm font-semibold text-white backdrop-blur-md"
        >
          People photos: {includePerson ? "On" : "Off"}
        </button>
      </div>
      <p className="absolute bottom-4 right-6 text-sm font-medium text-white/70">
        {index + 1} / {framePhotos.length} · tap photo to pause
      </p>
    </div>
  );
}
