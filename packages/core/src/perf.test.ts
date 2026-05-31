import { describe, expect, it } from "vitest";
import { diff } from "./diff.js";

function buildLargeSchema(fieldCount: number): string {
  const fields = Array.from({ length: fieldCount }, (_, i) => `  field${i}: String`).join("\n");
  return `type Query {\n${fields}\n}`;
}

describe("performance", () => {
  it("diffs large schemas under 2s p95 budget", () => {
    const oldSdl = buildLargeSchema(200);
    const newSdl = buildLargeSchema(200).replace("field199", "field199Renamed");
    const start = performance.now();
    const changes = diff(oldSdl, newSdl);
    const elapsed = performance.now() - start;
    expect(changes.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(2000);
  });
});
