import {
  findBreakingChanges,
  findDangerousChanges,
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from "graphql";
import { parseSchemaInput } from "./parse.js";
import type { DiffOptions, SchemaChange, Severity } from "./types.js";

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

function extractPath(description: string): string {
  const match = description.match(/^[^:]+:\s*([^\s]+)/);
  return match?.[1] ?? description;
}

function findSafeChanges(oldSchema: GraphQLSchema, newSchema: GraphQLSchema): SchemaChange[] {
  const safe: SchemaChange[] = [];
  const oldTypes = oldSchema.getTypeMap();
  const newTypes = newSchema.getTypeMap();

  for (const name of Object.keys(newTypes)) {
    if (name.startsWith("__")) continue;
    if (!oldTypes[name]) {
      safe.push({
        type: "TYPE_ADDED",
        path: name,
        severity: "safe",
        message: `Type '${name}' was added`,
      });
      continue;
    }

    const oldType = oldTypes[name];
    const newType = newTypes[name];

    if (isObjectType(oldType) && isObjectType(newType)) {
      for (const fieldName of Object.keys(newType.getFields())) {
        if (!oldType.getFields()[fieldName]) {
          safe.push({
            type: "FIELD_ADDED",
            path: `${name}.${fieldName}`,
            severity: "safe",
            message: `Field '${fieldName}' was added to object type '${name}'`,
          });
        }
      }
    }

    if (isInterfaceType(oldType) && isInterfaceType(newType)) {
      for (const fieldName of Object.keys(newType.getFields())) {
        if (!oldType.getFields()[fieldName]) {
          safe.push({
            type: "FIELD_ADDED",
            path: `${name}.${fieldName}`,
            severity: "safe",
            message: `Field '${fieldName}' was added to interface '${name}'`,
          });
        }
      }
    }

    if (isEnumType(oldType) && isEnumType(newType)) {
      const oldValues = new Set(oldType.getValues().map((v) => v.name));
      for (const v of newType.getValues()) {
        if (!oldValues.has(v.name)) {
          safe.push({
            type: "ENUM_VALUE_ADDED",
            path: `${name}.${v.name}`,
            severity: "safe",
            message: `Enum value '${v.name}' was added to enum '${name}'`,
          });
        }
      }
    }

    if (isInputObjectType(oldType) && isInputObjectType(newType)) {
      for (const fieldName of Object.keys(newType.getFields())) {
        if (!oldType.getFields()[fieldName]) {
          safe.push({
            type: "INPUT_FIELD_ADDED",
            path: `${name}.${fieldName}`,
            severity: "safe",
            message: `Input field '${fieldName}' was added to input object '${name}'`,
          });
        }
      }
    }

    if (isUnionType(oldType) && isUnionType(newType)) {
      const oldMembers = new Set(oldType.getTypes().map((t) => t.name));
      for (const member of newType.getTypes()) {
        if (!oldMembers.has(member.name)) {
          safe.push({
            type: "UNION_MEMBER_ADDED",
            path: `${name}.${member.name}`,
            severity: "safe",
            message: `Member '${member.name}' was added to union '${name}'`,
          });
        }
      }
    }

    if (isScalarType(oldType) && isScalarType(newType) && oldType.description !== newType.description) {
      safe.push({
        type: "DESCRIPTION_CHANGED",
        path: name,
        severity: "safe",
        message: `Description changed for scalar '${name}'`,
      });
    }
  }

  return safe;
}

export function diffSchemas(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
  opts?: DiffOptions,
): SchemaChange[] {
  const breaking = findBreakingChanges(oldSchema, newSchema).map((c) => ({
    type: c.type,
    path: extractPath(c.description),
    severity: "breaking" as Severity,
    message: c.description,
  }));

  const dangerous = findDangerousChanges(oldSchema, newSchema).map((c) => ({
    type: c.type,
    path: extractPath(c.description),
    severity: "dangerous" as Severity,
    message: c.description,
  }));

  const safe = opts?.ignoreDescriptionChanges
    ? findSafeChanges(oldSchema, newSchema).filter((c) => c.type !== "DESCRIPTION_CHANGED")
    : findSafeChanges(oldSchema, newSchema);

  const removedNames = breaking
    .filter((c) => c.type.includes("REMOVED") || c.type.includes("Removed"))
    .map((c) => c.path.split(".").pop()!)
    .filter(Boolean);

  return [...breaking, ...dangerous, ...safe].map((change) => ({
    ...change,
    suggestedRename:
      change.severity === "breaking" &&
      (change.type.includes("REMOVED") || change.message.toLowerCase().includes("removed"))
        ? suggestRename(change.path, removedNames)
        : undefined,
  }));
}

export function diff(oldSdl: string, newSdl: string, opts?: DiffOptions): SchemaChange[] {
  const oldSchema = parseSchemaInput(oldSdl);
  const newSchema = parseSchemaInput(newSdl);
  return diffSchemas(oldSchema, newSchema, opts);
}
