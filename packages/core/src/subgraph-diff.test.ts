import { describe, expect, it } from "vitest";
import { diffSubgraphs } from "./subgraph-diff.js";
import { FEDERATION_SUBGRAPHS } from "./fixtures/samples.js";

describe("diffSubgraphs", () => {
  it("diffs named subgraphs in isolation", () => {
    const oldSg = [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }];
    const newSg = [
      {
        name: "users",
        sdl: FEDERATION_SUBGRAPHS.users.replace("name: String!", "displayName: String!"),
      },
    ];
    const results = diffSubgraphs(oldSg, newSg);
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("users");
  });
});
