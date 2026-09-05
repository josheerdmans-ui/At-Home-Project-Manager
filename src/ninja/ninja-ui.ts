export const NINJA = {
  orange: "#FF8C42",
  page: "bg-[#0F1115] text-[#F3F4F6]",
  sidebar: "border-white/8 bg-[#0C0D11]",
  header: "border-white/8 bg-[#12141A]/80 backdrop-blur-xl",
  surface: "border-white/10 bg-[#1E2028]",
  input:
    "rounded-xl border border-white/10 bg-[#16181F] px-3 py-2.5 text-sm text-[#F3F4F6] outline-none placeholder:text-zinc-500 focus:border-[#FF8C42]",
  orangeBtn:
    "bg-gradient-to-br from-[#FF8C42] to-[#FF5C2E] text-white shadow-[0_8px_24px_rgba(255,140,66,0.28)] hover:from-[#FF9A58] hover:to-[#FF6A3D]",
  muted: "text-zinc-400",
  label: "text-zinc-300",
} as const;

const TAG_STYLES = [
  "bg-cyan-400/15 text-cyan-300",
  "bg-emerald-400/15 text-emerald-300",
  "bg-orange-400/15 text-orange-300",
  "bg-violet-400/15 text-violet-300",
  "bg-rose-400/15 text-rose-300",
  "bg-amber-400/15 text-amber-300",
];

export function tagStyle(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash + tag.charCodeAt(i) * (i + 1)) % TAG_STYLES.length;
  }
  return TAG_STYLES[hash] ?? TAG_STYLES[0]!;
}
