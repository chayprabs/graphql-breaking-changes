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

function normalizeFieldName(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, "");
}

function suggestRenameForRemoval(
  typeName: string,
  removedField: string,
  addedByType: Map<string, Set<string>>,
): string | undefined {
  const added = addedByType.get(typeName);
  if (!added || added.size === 0) return undefined;

  const removedNorm = normalizeFieldName(removedField);
  let best: { name: string; score: number } | undefined;

  for (const candidate of added) {
    const distance = levenshtein(removedNorm, normalizeFieldName(candidate));
    const contains =
      removedNorm.includes(normalizeFieldName(candidate)) ||
      normalizeFieldName(candidate).includes(removedNorm);
    const score = contains ? Math.min(distance, 2) : distance;
    if (score > 5) continue;
    if (!best || score < best.score) {
      best = { name: candidate, score };
    }
  }

  return best?.name;
}

export function extractPath(description: string, changeType: string): string {
  const scalarRemoved = description.match(/^Standard scalar (\w+) was removed/i);
  if (scalarRemoved) return scalarRemoved[1];

  const optionalArgAdded = description.match(/^An optional arg (\w+) on (\S+) was added/i);
  if (optionalArgAdded) return `${optionalArgAdded[2]}.${optionalArgAdded[1]}`;

  const requiredArgAdded = description.match(/^A required arg (\w+) on (\S+) was added/i);
  if (requiredArgAdded) return `${requiredArgAdded[2]}.${requiredArgAdded[1]}`;

  const fieldRemoved = description.match(/^(\w+(?:\.\w+)+)\s+was removed\.?$/);
  if (fieldRemoved) return fieldRemoved[1];

  const argRemoved = description.match(/^(\w+\.\w+)\s+arg\s+(\w+)\s+was removed\.?$/);
  if (argRemoved) return `${argRemoved[1]}.${argRemoved[2]}`;

  const enumRemoved = description.match(/^(\w+)\s+was removed from enum type (\w+)\.?$/);
  if (enumRemoved) return `${enumRemoved[2]}.${enumRemoved[1]}`;

  const directiveRemoved = description.match(/^(\w+)\s+directive was removed\.?$/);
  if (directiveRemoved) return directiveRemoved[1];

  const typeRemoved = description.match(/^(\w+)\s+was removed\.?$/);
  if (typeRemoved && changeType.includes("TYPE")) return typeRemoved[1];

  return description;
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

    if (oldType.description !== newType.description) {
      safe.push({
        type: "DESCRIPTION_CHANGED",
        path: name,
        severity: "safe",
        message: `Description changed for type '${name}'`,
      });
    }

    if (isObjectType(oldType) && isObjectType(newType)) {
      for (const fieldName of Object.keys(newType.getFields())) {
        const oldField = oldType.getFields()[fieldName];
        const newField = newType.getFields()[fieldName];
        if (!oldField) {
          safe.push({
            type: "FIELD_ADDED",
            path: `${name}.${fieldName}`,
            severity: "safe",
            message: `Field '${fieldName}' was added to object type '${name}'`,
          });
        } else if (oldField.description !== newField.description) {
          safe.push({
            type: "DESCRIPTION_CHANGED",
            path: `${name}.${fieldName}`,
            severity: "safe",
            message: `Description changed for field '${name}.${fieldName}'`,
          });
        }
      }
    }

    if (isInterfaceType(oldType) && isInterfaceType(newType)) {
      for (const fieldName of Object.keys(newType.getFields())) {
        const oldField = oldType.getFields()[fieldName];
        const newField = newType.getFields()[fieldName];
        if (!oldField) {
          safe.push({
            type: "FIELD_ADDED",
            path: `${name}.${fieldName}`,
            severity: "safe",
            message: `Field '${fieldName}' was added to interface '${name}'`,
          });
        } else if (oldField.description !== newField.description) {
          safe.push({
            type: "DESCRIPTION_CHANGED",
            path: `${name}.${fieldName}`,
            severity: "safe",
            message: `Description changed for field '${name}.${fieldName}'`,
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

  }

  return safe;
}

function collectAddedFieldsByType(safeChanges: SchemaChange[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const change of safeChanges) {
    if (change.type !== "FIELD_ADDED") continue;
    const [typeName, fieldName] = change.path.split(".");
    if (!typeName || !fieldName) continue;
    if (!map.has(typeName)) map.set(typeName, new Set());
    map.get(typeName)!.add(fieldName);
  }
  return map;
}

export function diffSchemas(
  oldSchema: GraphQLSchema,
  newSchema: GraphQLSchema,
  opts?: DiffOptions,
): SchemaChange[] {
  const breaking = findBreakingChanges(oldSchema, newSchema).map((c) => ({
    type: c.type,
    path: extractPath(c.description, c.type),
    severity: "breaking" as Severity,
    message: c.description,
  }));

  const dangerous = findDangerousChanges(oldSchema, newSchema).map((c) => ({
    type: c.type,
    path: extractPath(c.description, c.type),
    severity: "dangerous" as Severity,
    message: c.description,
  }));

  const safe = opts?.ignoreDescriptionChanges
    ? findSafeChanges(oldSchema, newSchema).filter((c) => c.type !== "DESCRIPTION_CHANGED")
    : findSafeChanges(oldSchema, newSchema);

  const addedByType = collectAddedFieldsByType(safe);

  return [...breaking, ...dangerous, ...safe].map((change) => {
    if (change.type !== "FIELD_REMOVED" || change.severity !== "breaking") {
      return change;
    }
    const [typeName, fieldName] = change.path.split(".");
    const suggestedRename =
      typeName && fieldName
        ? suggestRenameForRemoval(typeName, fieldName, addedByType)
        : undefined;
    return { ...change, suggestedRename };
  });
}

export function diff(oldSdl: string, newSdl: string, opts?: DiffOptions): SchemaChange[] {
  const oldSchema = parseSchemaInput(oldSdl);
  const newSchema = parseSchemaInput(newSdl);
  return diffSchemas(oldSchema, newSchema, opts);
}
