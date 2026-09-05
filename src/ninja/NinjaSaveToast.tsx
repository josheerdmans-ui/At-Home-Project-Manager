import { Check } from "lucide-react";

export function NinjaSaveToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[70] rounded-full border border-white/10 bg-[#1E2028]/90 px-4 py-2.5 text-sm font-black text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <span className="inline-flex items-center gap-2">
        <Check size={16} className="text-[#2DD4BF]" />
        {message}
      </span>
    </div>
  );
}
