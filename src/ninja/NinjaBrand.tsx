import { NINJA_ICON_SRC, NINJA_LOGO_SRC } from "./ninja-brand";

export function NinjaIcon({
  className = "h-10 w-10",
  alt = "Ninjatards",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={NINJA_ICON_SRC}
      alt={alt}
      className={`rounded-2xl object-cover ${className}`}
    />
  );
}

export function NinjaLogo({
  className = "h-10 w-auto",
  alt = "Ninjatards",
}: {
  className?: string;
  alt?: string;
}) {
  return <img src={NINJA_LOGO_SRC} alt={alt} className={`object-contain ${className}`} />;
}
