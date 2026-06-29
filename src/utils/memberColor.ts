const GOLDEN_ANGLE = 137.508;

/**
 * Pre-computed palette of 50 visually distinct colors.
 * Hues are spread by the golden angle for maximum separation;
 * saturation and lightness alternate slightly for extra distinction.
 */
const MEMBER_COLORS: string[] = (() => {
  const colors: string[] = [];
  for (let i = 0; i < 50; i++) {
    const hue = ((i * GOLDEN_ANGLE) % 360 + 360) % 360;
    const sat = 50 + (i % 3) * 5;   // 50, 55, 60
    const lig = 50 + (i % 2) * 8;   // 50, 58
    colors.push(`hsl(${Math.round(hue)}, ${sat}%, ${lig}%)`);
  }
  return colors;
})();

export function getMemberColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return MEMBER_COLORS[Math.abs(h) % MEMBER_COLORS.length];
}
