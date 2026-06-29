const GOLDEN_ANGLE = 137.508;

export function getMemberColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const hue = ((Math.abs(h) * GOLDEN_ANGLE) % 360 + 360) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}
