import { diff } from "./diff.js";
import type { SchemaChange, SubgraphInput } from "./types.js";

export interface SubgraphDiffResult {
  name: string;
  changes: SchemaChange[];
}

/** F4.2 — diff each subgraph SDL in isolation (by matching name). */
export function diffSubgraphs(
  oldSubgraphs: SubgraphInput[],
  newSubgraphs: SubgraphInput[],
): SubgraphDiffResult[] {
  const newByName = new Map(newSubgraphs.map((s) => [s.name, s]));
  const results: SubgraphDiffResult[] = [];

  for (const oldSg of oldSubgraphs) {
    const newSg = newByName.get(oldSg.name);
    if (!newSg) {
      results.push({
        name: oldSg.name,
        changes: [
          {
            type: "SUBGRAPH_REMOVED",
            path: oldSg.name,
            severity: "breaking",
            message: `Subgraph '${oldSg.name}' was removed.`,
          },
        ],
      });
      continue;
    }
    results.push({ name: oldSg.name, changes: diff(oldSg.sdl, newSg.sdl) });
    newByName.delete(oldSg.name);
  }

  for (const [name] of newByName) {
    results.push({
      name,
      changes: [
        {
          type: "SUBGRAPH_ADDED",
          path: name,
          severity: "safe",
          message: `Subgraph '${name}' was added.`,
        },
      ],
    });
  }

  return results;
}
