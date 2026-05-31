import { diff as inspectorDiff, CriticalityLevel } from "@graphql-inspector/core";
import { GraphQLSchema } from "graphql";
import { parseSchemaInput } from "./parse.js";
import type { DiffOptions, SchemaChange, Severity } from "./types.js";

function mapCriticality(level: CriticalityLevel): Severity {
  switch (level) {
    case CriticalityLevel.Breaking:
      return "breaking";
    case CriticalityLevel.Dangerous:
      return "dangerous";
    default:
      return "safe";
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function suggestRename(path: string, removedNames: string[]): string | undefined {
  const segment = path.split(".").pop() ?? path;
  if (!segment || removedNames.length === 0) return undefined;

  let best: { name: string; distance: number } | undefined;
  for (const name of removedNames) {
    const distance = levenshtein(segment.toLowerCase(), name.toLowerCase());
    if (distance > 3) continue;
    if (!best || distance < best.distance) {
      best = { name, distance };
    }
  }
  return best?.name;
}

export function diffSchemas(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
  _opts?: DiffOptions,
): SchemaChange[] {
  const changes = inspectorDiff(oldSchema, newSchema);
  const removedFieldNames = changes
    .filter((c) => c.type.includes("Removed") && c.path)
    .map((c) => c.path!.split(".").pop()!)
    .filter(Boolean);

  return changes.map((change) => {
    const path = change.path ?? "";
    const severity = mapCriticality(change.criticality.level);
    const suggestedRename =
      severity === "breaking" && change.type.includes("Removed")
        ? suggestRename(path, removedFieldNames)
        : undefined;

    return {
      type: change.type,
      path,
      severity,
      message: change.message,
      suggestedRename,
    };
  });
}

export function diff(oldSdl: string, newSdl: string, opts?: DiffOptions): SchemaChange[] {
  const oldSchema = parseSchemaInput(oldSdl);
  const newSchema = parseSchemaInput(newSdl);
  return diffSchemas(oldSchema, newSchema, opts);
}
