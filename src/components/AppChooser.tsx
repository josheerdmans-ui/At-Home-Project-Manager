import { Home, Swords } from "lucide-react";
import { env } from "../lib/env";

export type AppDestination = "home" | "league";

type Props = {
  onChoose: (app: AppDestination) => void;
};

export function AppChooser({ onChoose }: Props) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-6">
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-cyan-400/30 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] rounded-full bg-rose-400/30 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[45vw] w-[45vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/20 blur-[140px]" />

      <div className="relative z-10 w-full max-w-3xl">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-cyan-600">
          {env.appName}
        </p>
        <h1 className="mb-2 text-center text-4xl font-black tracking-tight text-slate-800 sm:text-5xl">
          Choose an app
        </h1>
        <p className="mb-10 text-center text-base font-medium text-slate-500">
          Pick where you want to go after sign-in.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onChoose("home")}
            className="group flex flex-col items-start gap-4 rounded-[2rem] border border-white/80 bg-white/50 p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]"
          >
            <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700 transition group-hover:bg-cyan-600 group-hover:text-white">
              <Home size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">Home app</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                Family hub — calendar, chores, meals, banking, garage, and more.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChoose("league")}
            className="group flex flex-col items-start gap-4 rounded-[2rem] border border-white/80 bg-white/50 p-8 text-left shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)]"
          >
            <div className="rounded-2xl bg-violet-100 p-4 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white">
              <Swords size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">League of Legends</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                Look up Riot IDs, rank, and recent matches via the Riot API.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
