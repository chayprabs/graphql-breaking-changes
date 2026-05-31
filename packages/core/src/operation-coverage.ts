import { parse, validate, GraphQLSchema } from "graphql";
import { parseSchemaInput } from "./parse.js";
import type { OperationCoverage, OperationCoverageItem } from "./types.js";

function extractOperationName(doc: string, index: number): string {
  const nameMatch = doc.match(/(?:query|mutation|subscription)\s+(\w+)/i);
  if (nameMatch) return nameMatch[1];
  return `AnonymousOperation${index + 1}`;
}

export function operationCoverage(
  operations: string[],
  newSchemaSdl: string,
): OperationCoverage {
  const schema: GraphQLSchema = parseSchemaInput(newSchemaSdl);
  const items: OperationCoverageItem[] = operations.map((op, index) => {
    const name = extractOperationName(op, index);
    try {
      const document = parse(op);
      const errors = validate(schema, document);
      return {
        name,
        valid: errors.length === 0,
        reasons: errors.map((e) => e.message),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { name, valid: false, reasons: [message] };
    }
  });

  const valid = items.filter((i) => i.valid).length;
  return {
    total: items.length,
    valid,
    invalid: items.length - valid,
    items,
  };
}
