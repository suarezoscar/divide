// 8 vibrant but soft colors for group theming — hash-based, deterministic
const GROUP_COLORS = [
  "#07819C", // teal (default)
  "#E57373", // coral
  "#5C6BC0", // indigo
  "#FF8A65", // amber
  "#66BB6A", // green
  "#AB47BC", // violet
  "#26C6DA", // cyan
  "#EC407A", // rose
] as const;

export function getGroupColor(groupName: string): string {
  let hash = 0;
  for (const c of groupName) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

export function getGroupColorRgba(groupName: string, alpha: number): string {
  const hex = getGroupColor(groupName);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
