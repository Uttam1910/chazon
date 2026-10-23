// Ring geometry shared by the hero engine and the small engine marks.

/** SVG arc around (c, c) from one angle to another (degrees, 0 = east, clockwise). sweep 0 draws it anticlockwise. */
export function arcPath(c: number, r: number, from: number, to: number, sweep: 0 | 1 = 1) {
  const point = (a: number) => `${(c + r * Math.cos((a * Math.PI) / 180)).toFixed(2)} ${(c + r * Math.sin((a * Math.PI) / 180)).toFixed(2)}`
  return `M${point(from)} A${r} ${r} 0 0 ${sweep} ${point(to)}`
}
/** Quadrant i of the ring: 0 Build (top), 1 Grow (right), 2 Convert (bottom), 3 Automate (left), with a gap at each end. */
export const quadrant = (i: number, gap: number) => [-135 + 90 * i + gap, -45 + 90 * i - gap] as const
