import { lexicographicSortSchema, printSchema } from "graphql";
import { parseSchemaInput } from "./parse.js";

export function formatSdl(sdl: string): string {
  const schema = parseSchemaInput(sdl);
  return printSchema(lexicographicSortSchema(schema));
}
