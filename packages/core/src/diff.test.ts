import { describe, expect, it } from "vitest";
import { diff, operationCoverage } from "./index.js";
import {
  FEDERATION_BROKEN_SUBGRAPH,
  FEDERATION_SUBGRAPHS,
  SAMPLE_NEW_SDL,
  SAMPLE_OLD_SDL,
  SAMPLE_OPERATION,
} from "./fixtures/samples.js";
import { composeFederation } from "./federation.js";

describe("diff", () => {
  it("A1: detects breaking changes in sample SDL pair", () => {
    const changes = diff(SAMPLE_OLD_SDL, SAMPLE_NEW_SDL);
    const breaking = changes.filter((c) => c.severity === "breaking");
    expect(breaking.length).toBeGreaterThanOrEqual(1);
    const hasFieldRemoval = changes.some(
      (c) => c.message.toLowerCase().includes("email") || c.path.includes("email"),
    );
    const hasRename = changes.some(
      (c) => c.path.includes("fullName") || c.message.toLowerCase().includes("name"),
    );
    expect(hasFieldRemoval || hasRename).toBe(true);
  });
});

describe("operationCoverage", () => {
  it("A2: detects operation breakage against new schema", () => {
    const coverage = operationCoverage([SAMPLE_OPERATION], SAMPLE_NEW_SDL);
    expect(coverage.invalid).toBeGreaterThanOrEqual(1);
    expect(coverage.items[0].valid).toBe(false);
    expect(coverage.items[0].reasons.length).toBeGreaterThan(0);
  });
});

describe("composeFederation", () => {
  it("A3: composes valid federation subgraphs", () => {
    const result = composeFederation([
      { name: "users", sdl: FEDERATION_SUBGRAPHS.users },
      { name: "products", sdl: FEDERATION_SUBGRAPHS.products },
    ]);
    expect(result.success).toBe(true);
    expect(result.supergraphSdl).toBeTruthy();
  });

  it("raises composition errors for invalid subgraph set", () => {
    const result = composeFederation([
      { name: "users", sdl: FEDERATION_BROKEN_SUBGRAPH },
      { name: "products", sdl: FEDERATION_SUBGRAPHS.products },
    ]);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
