import { describe, expect, it } from "vitest";
import { diff, extractPath } from "./diff.js";
import { operationCoverage } from "./operation-coverage.js";
import {
  FEDERATION_CONFLICT_SUBGRAPH,
  FEDERATION_SUBGRAPHS,
  SAMPLE_NEW_SDL,
  SAMPLE_OLD_SDL,
  SAMPLE_OPERATION,
} from "./fixtures/samples.js";
import { composeFederation } from "./federation.js";

describe("extractPath", () => {
  it("parses optional arg additions", () => {
    expect(extractPath("An optional arg y on Query.f was added.", "OPTIONAL_ARG_ADDED")).toBe(
      "Query.f.y",
    );
  });

  it("parses standard scalar removal", () => {
    expect(
      extractPath("Standard scalar ID was removed because it is not used.", "TYPE_REMOVED"),
    ).toBe("ID");
  });
});

describe("diff", () => {
  it("A1: detects breaking changes in sample SDL pair", () => {
    const changes = diff(SAMPLE_OLD_SDL, SAMPLE_NEW_SDL);
    const breaking = changes.filter((c) => c.severity === "breaking");
    expect(breaking.length).toBeGreaterThanOrEqual(1);
    expect(changes.some((c) => c.path === "User.email" && c.severity === "breaking")).toBe(true);
    const nameRemoval = changes.find((c) => c.path === "User.name" && c.type === "FIELD_REMOVED");
    expect(nameRemoval?.suggestedRename).toBe("fullName");
  });

  it("reports description-only changes as safe", () => {
    const changes = diff(
      `"""old""" type Query { hello: String }`,
      `"""new""" type Query { hello: String }`,
    );
    expect(changes.some((c) => c.type === "DESCRIPTION_CHANGED" && c.path === "Query")).toBe(true);
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
      { name: "users", sdl: FEDERATION_SUBGRAPHS.users },
      { name: "conflict", sdl: FEDERATION_CONFLICT_SUBGRAPH },
    ]);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
