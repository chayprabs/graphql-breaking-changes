import {
  buildClientSchema,
  buildSchema,
  GraphQLSchema,
  IntrospectionQuery,
  lexicographicSortSchema,
  printSchema,
} from "graphql";

export function parseSchemaInput(input: string): GraphQLSchema {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Schema input is empty.");
  }

  if (trimmed.startsWith("{")) {
    const json = JSON.parse(trimmed) as { data?: IntrospectionQuery } | IntrospectionQuery;
    const introspection =
      "data" in json && json.data ? json.data : (json as IntrospectionQuery);
    return lexicographicSortSchema(buildClientSchema(introspection));
  }

  return lexicographicSortSchema(buildSchema(trimmed, { assumeValidSDL: true }));
}

export function schemaToSdl(schema: GraphQLSchema): string {
  return printSchema(schema);
}
