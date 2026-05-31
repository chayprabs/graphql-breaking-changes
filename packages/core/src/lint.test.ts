import { describe, expect, it } from "vitest";
import { lintSchema } from "./lint.js";

describe("lintSchema", () => {
  it("flags missing type descriptions", () => {
    const issues = lintSchema(`type Query { hello: String }`);
    expect(issues.some((i) => i.rule === "description-type")).toBe(true);
  });
});
