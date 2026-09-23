/**
 * Layout helpers that keep grids balanced whatever the number of items —
 * no lone tile/card left on its own on the last row. Every class is a full
 * literal so Tailwind picks it up.
 */

/**
 * Category mosaic: 2 columns below `lg` (or 1 then 2 from `sm` when
 * `mobileSingleColumn`), then a 4-column mosaic whose first tile is a 2×2
 * feature. Spans are chosen so every row is exactly filled.
 */
export function mosaicTileClass(index: number, count: number, { mobileSingleColumn = false } = {}): string {
  const classes: string[] = [];

  // Two-column breakpoints: an odd count makes the first tile full width.
  if (count % 2 === 1 && index === 0 && count > 1) {
    classes.push(mobileSingleColumn ? "sm:col-span-2" : "col-span-2");
  }

  // lg: 4 columns — tile 0 spans 2×2, the next ≤4 fill the 2×2 block beside it,
  // the rest flow in rows of 4 with the last row stretched to full width.
  if (index === 0) {
    classes.push(count === 1 ? "lg:col-span-4 lg:row-span-2" : "lg:col-span-2 lg:row-span-2");
    return classes.join(" ");
  }

  const besideFeature = Math.min(count - 1, 4);
  if (index <= 4) {
    if (besideFeature === 1) classes.push("lg:col-span-2 lg:row-span-2");
    else if (besideFeature === 2) classes.push("lg:col-span-2");
    else if (besideFeature === 3 && index === 1) classes.push("lg:col-span-2");
    else classes.push("lg:col-span-1");
    return classes.join(" ");
  }

  const position = index - 5;
  const rest = count - 5;
  const remainder = rest % 4;
  const lastRowStart = rest - remainder;
  if (position < lastRowStart || remainder === 0) classes.push("lg:col-span-1");
  else if (remainder === 1) classes.push("lg:col-span-4");
  else if (remainder === 2) classes.push("lg:col-span-2");
  else classes.push(position === lastRowStart ? "lg:col-span-2" : "lg:col-span-1");
  return classes.join(" ");
}

/**
 * Curated property selections (home, /acheter, similar biens) shown in a
 * 1 / 2 (`sm`) / 3 (`lg`) column grid: drops the trailing items that would
 * sit alone on the last row at each breakpoint. Never use it on search
 * results — every result must stay visible there.
 */
export function balancedCardClass(index: number, count: number): string {
  const visibleSm = count >= 2 ? count - (count % 2) : count;
  const visibleLg = count >= 3 ? count - (count % 3) : count;
  const classes: string[] = [];
  if (index >= visibleSm) classes.push("sm:hidden");
  if (index >= visibleSm && index < visibleLg) classes.push("lg:block");
  if (index < visibleSm && index >= visibleLg) classes.push("lg:hidden");
  return classes.join(" ");
}
