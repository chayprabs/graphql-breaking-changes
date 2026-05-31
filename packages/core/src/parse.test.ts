import { describe, expect, it } from "vitest";
import { parseSchemaInput, formatSdl } from "./index.js";
import { buildSchema, introspectionFromSchema, lexicographicSortSchema } from "graphql";

describe("parseSchemaInput", () => {
  it("parses SDL", () => {
    const schema = parseSchemaInput("type Query { hello: String }");
    expect(schema.getQueryType()?.name).toBe("Query");
  });

  it("rejects empty input", () => {
    expect(() => parseSchemaInput("  ")).toThrow(/empty/i);
  });

  it("rejects invalid JSON with clear message", () => {
    expect(() => parseSchemaInput("{ not json")).toThrow(/JSON parse failed/i);
  });

  it("rejects introspection with errors array", () => {
    const intro = introspectionFromSchema(
      lexicographicSortSchema(buildSchema("type Query { x: String }")),
    );
    expect(() =>
      parseSchemaInput(JSON.stringify({ data: intro, errors: [{ message: "partial" }] })),
    ).toThrow(/errors/i);
  });
});

describe("formatSdl", () => {
  it("sorts and prints schema", () => {
    const formatted = formatSdl("type Query { z: String a: String }");
    expect(formatted).toContain("type Query");
  });
});
