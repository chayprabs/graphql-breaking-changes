import type { SubgraphInput } from "./types.js";

const NAME_PREFIX = /^([\w-]+):\s*\n?/;

/** Parse federation subgraph blocks separated by `---` (flexible whitespace). */
export function parseSubgraphBlocks(text: string): SubgraphInput[] {
  const parts = text
    .split(/\n\s*---\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("At least one subgraph block is required.");
  }

  const seen = new Set<string>();
  const result: SubgraphInput[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const nameMatch = part.match(NAME_PREFIX);
    if (!nameMatch) {
      throw new Error(
        `Subgraph block ${i + 1} is missing a name prefix (expected "name:" before SDL, e.g. "users:").`,
      );
    }
    const name = nameMatch[1];
    if (seen.has(name)) {
      throw new Error(`Duplicate subgraph name "${name}". Each subgraph must have a unique name.`);
    }
    seen.add(name);
    result.push({ name, sdl: part.replace(NAME_PREFIX, "").trim() });
  }

  return result;
}
