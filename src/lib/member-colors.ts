/** Color tokens for household members (wall calendar chips) */

export type MemberColorToken =
  | "sky"
  | "orange"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "indigo";

export const MEMBER_COLOR_TOKENS: MemberColorToken[] = [
  "sky",
  "orange",
  "violet",
  "emerald",
  "rose",
  "amber",
  "cyan",
  "indigo",
];

export type MemberColorStyle = {
  chip: string;
  solid: string;
  ring: string;
  label: string;
};

export const MEMBER_COLOR_STYLES: Record<MemberColorToken, MemberColorStyle> = {
  sky: {
    chip: "bg-sky-100 text-sky-800 border-sky-200",
    solid: "bg-sky-500",
    ring: "ring-sky-400",
    label: "Sky",
  },
  orange: {
    chip: "bg-orange-100 text-orange-800 border-orange-200",
    solid: "bg-orange-500",
    ring: "ring-orange-400",
    label: "Orange",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800 border-violet-200",
    solid: "bg-violet-500",
    ring: "ring-violet-400",
    label: "Violet",
  },
  emerald: {
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200",
    solid: "bg-emerald-500",
    ring: "ring-emerald-400",
    label: "Emerald",
  },
  rose: {
    chip: "bg-rose-100 text-rose-800 border-rose-200",
    solid: "bg-rose-500",
    ring: "ring-rose-400",
    label: "Rose",
  },
  amber: {
    chip: "bg-amber-100 text-amber-900 border-amber-200",
    solid: "bg-amber-500",
    ring: "ring-amber-400",
    label: "Amber",
  },
  cyan: {
    chip: "bg-cyan-100 text-cyan-800 border-cyan-200",
    solid: "bg-cyan-500",
    ring: "ring-cyan-400",
    label: "Cyan",
  },
  indigo: {
    chip: "bg-indigo-100 text-indigo-800 border-indigo-200",
    solid: "bg-indigo-500",
    ring: "ring-indigo-400",
    label: "Indigo",
  },
};

export function colorStyle(token: string): MemberColorStyle {
  if (token in MEMBER_COLOR_STYLES) {
    return MEMBER_COLOR_STYLES[token as MemberColorToken];
  }
  return MEMBER_COLOR_STYLES.sky;
}

export function chipClassFromToken(token: string): string {
  return colorStyle(token).chip;
}
