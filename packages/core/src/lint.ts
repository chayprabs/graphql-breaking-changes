import {
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isUnionType,
} from "graphql";
import { parseSchemaInput } from "./parse.js";
import type { LintIssue } from "./types.js";

const TYPE_NAME_RE = /^[A-Z][a-zA-Z0-9]*$/;
const FIELD_NAME_RE = /^[a-z][a-zA-Z0-9]*$/;

export function lintSchema(sdl: string): LintIssue[] {
  const schema = parseSchemaInput(sdl);
  return lintSchemaObject(schema);
}

export function lintSchemaObject(schema: GraphQLSchema): LintIssue[] {
  const issues: LintIssue[] = [];

  for (const type of Object.values(schema.getTypeMap())) {
    if (type.name.startsWith("__")) continue;

    if (!TYPE_NAME_RE.test(type.name)) {
      issues.push({
        rule: "naming-type",
        path: type.name,
        message: `Type name "${type.name}" should be PascalCase.`,
        severity: "warning",
      });
    }

    if (
      (isObjectType(type) ||
        isInterfaceType(type) ||
        isInputObjectType(type) ||
        isEnumType(type) ||
        isUnionType(type)) &&
      !type.description
    ) {
      issues.push({
        rule: "description-type",
        path: type.name,
        message: `Type "${type.name}" is missing a description.`,
        severity: "warning",
      });
    }

    if (isObjectType(type) || isInterfaceType(type)) {
      for (const field of Object.values(type.getFields())) {
        if (!FIELD_NAME_RE.test(field.name)) {
          issues.push({
            rule: "naming-field",
            path: `${type.name}.${field.name}`,
            message: `Field "${field.name}" should be camelCase.`,
            severity: "warning",
          });
        }

        const deprecated = field.deprecationReason;
        if (deprecated && !field.description) {
          issues.push({
            rule: "deprecation-description",
            path: `${type.name}.${field.name}`,
            message: `Deprecated field "${field.name}" should have a description explaining the replacement.`,
            severity: "warning",
          });
        }
      }
    }

    if (isEnumType(type)) {
      for (const value of type.getValues()) {
        if (!value.description && value.deprecationReason) {
          issues.push({
            rule: "deprecation-description",
            path: `${type.name}.${value.name}`,
            message: `Deprecated enum value "${value.name}" should have a description.`,
            severity: "warning",
          });
        }
      }
    }

    if (isScalarType(type) && !type.description && !["String", "Int", "Float", "Boolean", "ID"].includes(type.name)) {
      issues.push({
        rule: "description-scalar",
        path: type.name,
        message: `Custom scalar "${type.name}" should have a description.`,
        severity: "warning",
      });
    }

    if (isUnionType(type) && !type.description) {
      issues.push({
        rule: "description-union",
        path: type.name,
        message: `Union "${type.name}" should have a description.`,
        severity: "warning",
      });
    }
  }

  return issues;
}
