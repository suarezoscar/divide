const AVATAR_COLORS = [
  "#07819C", "#E57373", "#64B5F6", "#81C784",
  "#FFB74D", "#BA68C8", "#4DB6AC", "#F06292",
];

export function getMemberColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
