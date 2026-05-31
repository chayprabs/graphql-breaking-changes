import { describe, expect, it } from "vitest";
import { parseSchemaInput, formatSdl } from "./index.js";

describe("parseSchemaInput", () => {
  it("parses SDL", () => {
    const schema = parseSchemaInput("type Query { hello: String }");
    expect(schema.getQueryType()?.name).toBe("Query");
  });

  it("rejects empty input", () => {
    expect(() => parseSchemaInput("  ")).toThrow();
  });
});

describe("formatSdl", () => {
  it("sorts and prints schema", () => {
    const formatted = formatSdl("type Query { z: String a: String }");
    expect(formatted).toContain("type Query");
  });
});
