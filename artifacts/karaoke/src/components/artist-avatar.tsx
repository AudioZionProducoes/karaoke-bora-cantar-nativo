function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const PALETTE = [
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-sky-500/20 text-sky-300 border-sky-500/30",
  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
];

export function ArtistAvatar({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colorIdx = hashString(name) % PALETTE.length;
  const colorClass = PALETTE[colorIdx];

  return (
    <div
      className={`flex items-center justify-center rounded-full border font-bold shrink-0 ${colorClass} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initials || "?"}
    </div>
  );
}
