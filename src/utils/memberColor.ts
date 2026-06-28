const MEMBER_COLORS = [
  "#07819C", // teal
  "#E57373", // coral
  "#64B5F6", // blue
  "#81C784", // green
  "#FFB74D", // amber
  "#BA68C8", // purple
  "#4DB6AC", // mint
  "#F06292", // pink
  "#FF8A65", // deep orange
  "#9575CD", // deep purple
  "#4FC3F7", // light blue
  "#AED581", // light green
];

export function getMemberColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}
