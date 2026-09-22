/**
 * Deterministic decorative gradients — used only when a bien has no real
 * cover photo yet. No external dependency, no randomness: the same
 * bien always resolves to the same gradient across renders/requests.
 */

const PLACEHOLDER_GRADIENTS = [
  "from-anthracite-900 via-anthracite-700 to-gold-500/30",
  "from-anthracite-950 via-anthracite-800 to-anthracite-600",
  "from-anthracite-800 via-gold-600/20 to-anthracite-950",
  "from-gold-600/40 via-anthracite-800 to-anthracite-950",
  "from-anthracite-800 via-anthracite-600 to-gold-400/30",
  "from-anthracite-900 via-gold-600/20 to-anthracite-700",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function gradientForKey(key: string): string {
  return PLACEHOLDER_GRADIENTS[hashString(key) % PLACEHOLDER_GRADIENTS.length];
}
