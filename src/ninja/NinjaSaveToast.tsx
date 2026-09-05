import { Check } from "lucide-react";

export function NinjaSaveToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[70] rounded-full border border-white bg-white/90 px-4 py-2.5 text-sm font-black text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
      <span className="inline-flex items-center gap-2">
        <Check size={16} className="text-emerald-600" />
        {message}
      </span>
    </div>
  );
}
