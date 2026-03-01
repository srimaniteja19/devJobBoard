const TAG_COLORS = [
  "bg-[#1a1a2e] text-[#818cf8]",
  "bg-[#0f1f1a] text-[#34d399]",
  "bg-[#1a1528] text-[#a78bfa]",
  "bg-[#1f1a0f] text-[#fbbf24]",
  "bg-[#1f0f17] text-[#f472b6]",
  "bg-[#0f1a1f] text-[#22d3ee]",
  "bg-[#1a1a0f] text-[#e8ff47]",
  "bg-[#0f1f1f] text-[#2dd4bf]",
];

export function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function parseStack(stack: string): string[] {
  try {
    return JSON.parse(stack);
  } catch {
    return [];
  }
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
