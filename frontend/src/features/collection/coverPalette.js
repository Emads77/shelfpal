const PALETTES = [
  { background: "#b0ba99", color: "#4e220f" },
  { background: "#9d6638", color: "#ffffff" },
  { background: "#4e220f", color: "#f7f1de" },
  { background: "#dcc9a3", color: "#4e220f" },
];

export function coverPalette(title) {
  let hash = 0;
  for (const char of title) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTES[hash % PALETTES.length];
}
