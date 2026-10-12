/**
 * Deterministic UUID (v4 layout) from a string key. Used so the demo catalogue and the
 * generated seed.sql share the same ids.
 */
export function stableId(key: string): string {
  const hash = (seed: number) => {
    let h = seed ^ 0x811c9dc5
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    return (h >>> 0).toString(16).padStart(8, '0')
  }
  const hex = hash(1) + hash(2) + hash(3) + hash(4)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-')
}
