/** Light banking dashboard (blue/green overview style) */

export const bank = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E8EBF2",
  navy: "#1A2B88",
  navySoft: "rgba(26, 43, 136, 0.08)",
  blue: "#3B5BDB",
  blueLine: "#4C6EF5",
  green: "#12B76A",
  greenLine: "#32D583",
  red: "#F04438",
  orange: "#F79009",
  purpleGrad: "linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)",
  goldGrad: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
  cyanGrad: "linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)",
} as const;

export const cardClass =
  "rounded-2xl border border-[#E8EBF2] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]";

export function firstNameFromEmail(email: string | undefined | null): string {
  if (!email) return "";
  const local = email.split("@")[0] ?? "";
  const part = local.split(/[._-]/)[0] ?? local;
  if (!part) return "";
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export function prettyCategory(c: string): string {
  return c
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}
