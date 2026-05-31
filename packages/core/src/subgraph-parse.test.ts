import { describe, expect, it } from "vitest";
import { parseSubgraphBlocks } from "./subgraph-parse.js";

describe("parseSubgraphBlocks", () => {
  it("parses flexible --- separators and hyphenated names", () => {
    const blocks = parseSubgraphBlocks(`my-service:
type Query { x: String }
---
other:
type Query { y: String }`);
    expect(blocks.map((b) => b.name)).toEqual(["my-service", "other"]);
  });

  it("rejects missing name prefix", () => {
    expect(() => parseSubgraphBlocks("type Query { x: String }")).toThrow(/name prefix/i);
  });

  it("rejects duplicate names", () => {
    expect(() =>
      parseSubgraphBlocks(`a:\ntype Query { x: String }\n---\na:\ntype Query { y: String }`),
    ).toThrow(/Duplicate/);
  });
});
