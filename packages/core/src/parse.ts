import {
  buildClientSchema,
  buildSchema,
  GraphQLSchema,
  IntrospectionQuery,
  lexicographicSortSchema,
  printSchema,
} from "graphql";

function isIntrospectionQuery(value: unknown): value is IntrospectionQuery {
  return (
    typeof value === "object" &&
    value !== null &&
    "__schema" in value &&
    typeof (value as IntrospectionQuery).__schema === "object"
  );
}

function parseIntrospectionJson(trimmed: string): GraphQLSchema {
  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    throw new Error(
      "Invalid schema input: expected GraphQL SDL or introspection JSON (JSON parse failed).",
    );
  }

  if (typeof json === "object" && json !== null && "errors" in json) {
    const errors = (json as { errors?: unknown[] }).errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const msg = errors
        .map((e) => (typeof e === "object" && e && "message" in e ? String(e.message) : String(e)))
        .join("; ");
      throw new Error(`Introspection response contains errors: ${msg}`);
    }
  }

  let introspection: IntrospectionQuery | undefined;
  if (typeof json === "object" && json !== null && "data" in json) {
    const data = (json as { data?: unknown }).data;
    if (isIntrospectionQuery(data)) {
      introspection = data;
    }
  } else if (isIntrospectionQuery(json)) {
    introspection = json;
  }

  if (!introspection) {
    throw new Error(
      "Invalid introspection JSON: expected { __schema: ... } or { data: { __schema: ... } }.",
    );
  }

  return lexicographicSortSchema(buildClientSchema(introspection));
}

export function parseSchemaInput(input: string): GraphQLSchema {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Schema input is empty.");
  }

  if (trimmed.startsWith("{")) {
    try {
      return parseIntrospectionJson(trimmed);
    } catch (err) {
      if (err instanceof Error && err.message.includes("JSON parse failed")) {
        throw err;
      }
      throw err;
    }
  }

  return lexicographicSortSchema(buildSchema(trimmed, { assumeValidSDL: true }));
}

export function schemaToSdl(schema: GraphQLSchema): string {
  return printSchema(schema);
}
