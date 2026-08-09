import { CloudSun } from "lucide-react";
import { useNow, useWeather, weatherLabel } from "../hooks/useWeather";

function formatClock(date: Date): { time: string; dateLine: string } {
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateLine = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return { time, dateLine };
}

export function HomeClockWeather({ compact = false }: { compact?: boolean }) {
  const now = useNow();
  const { data, error, isLoading } = useWeather();
  const { time, dateLine } = formatClock(now);

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1 text-right text-slate-800">
        <p className="text-5xl font-black tracking-tight tabular-nums sm:text-6xl">{time}</p>
        <p className="text-sm font-semibold text-slate-600">{dateLine}</p>
        {isLoading && <p className="text-sm font-medium text-slate-500">Loading weather…</p>}
        {error && <p className="text-sm font-medium text-slate-500">Weather unavailable</p>}
        {data && (
          <p className="text-lg font-bold text-slate-700">
            {Math.round(data.temperatureF)}°F · {weatherLabel(data.weatherCode)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed top-8 right-8 z-40 flex max-w-sm flex-col items-end gap-3">
      <div className="rounded-[2rem] border border-white/80 bg-white/50 px-6 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
        <p className="text-5xl font-black tracking-tight text-slate-800 tabular-nums sm:text-6xl">
          {time}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-600">{dateLine}</p>
        <div className="mt-4 flex items-center gap-3 text-slate-700">
          <div className="rounded-2xl bg-cyan-100/80 p-2 text-cyan-700">
            <CloudSun size={22} />
          </div>
          <div>
            {isLoading && <p className="text-sm font-medium text-slate-500">Loading weather…</p>}
            {error && !data && (
              <p className="text-sm font-medium text-slate-500">Weather unavailable</p>
            )}
            {data && (
              <>
                <p className="text-2xl font-black tabular-nums">
                  {Math.round(data.temperatureF)}°F
                </p>
                <p className="text-sm font-semibold text-slate-600">
                  {weatherLabel(data.weatherCode)}
                  <span className="text-slate-400"> · </span>
                  {Math.round(data.windSpeedKmh)} km/h wind
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
