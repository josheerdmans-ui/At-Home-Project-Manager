const TAG_STYLES = [
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-800",
];

export function tagStyle(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash + tag.charCodeAt(i) * (i + 1)) % TAG_STYLES.length;
  }
  return TAG_STYLES[hash] ?? TAG_STYLES[0]!;
}
