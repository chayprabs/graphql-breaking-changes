import { describe, expect, it } from "vitest";
import { reportToHtml, reportToMarkdown, reportToJson } from "./reports.js";
import { diffSubgraphs } from "./subgraph-diff.js";
import { FEDERATION_SUBGRAPHS } from "./fixtures/samples.js";

describe("reports", () => {
  it("includes subgraph diffs in HTML and Markdown", () => {
    const subgraphDiffs = diffSubgraphs(
      [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }],
      [
        {
          name: "users",
          sdl: FEDERATION_SUBGRAPHS.users.replace("name: String!", "displayName: String!"),
        },
      ],
    );
    const html = reportToHtml({ subgraphDiffs });
    const md = reportToMarkdown({ subgraphDiffs });
    expect(html).toContain("Subgraph diffs");
    expect(html).toContain("users");
    expect(md).toContain("Subgraph diffs");
  });

  it("includes composition in HTML and Markdown", () => {
    const composition = { success: false, errors: [{ message: "test error" }] };
    const html = reportToHtml({ composition });
    const md = reportToMarkdown({ composition });
    expect(html).toContain("Federation Composition");
    expect(html).toContain("test error");
    expect(md).toContain("Federation Composition");
    expect(reportToJson({ composition })).toContain("test error");
  });
});
