import {
  diff,
  diffSchemas,
  operationCoverage,
  parseSchemaInput,
  reportToHtml,
  reportToMarkdown,
  reportToJson,
} from "../dist/index.js";

function probe(name, fn) {
  try {
    const result = fn();
    console.log(`\n[PROBE] ${name}`);
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.log(`\n[PROBE] ${name} — THREW: ${e.message}`);
  }
}

// Bug: Query/Object description changes not detected
const oldQ = parseSchemaInput(`"""old query""" type Query { a: String }`);
const newQ = parseSchemaInput(`"""new query""" type Query { a: String }`);
probe("Query description diff", () => diffSchemas(oldQ, newQ));

const oldScalar = parseSchemaInput(`scalar Custom @specifiedBy(url: "http://x")`);
const newScalar = parseSchemaInput(`"""new""" scalar Custom @specifiedBy(url: "http://x")`);
probe("Custom scalar description diff", () => diffSchemas(oldScalar, newScalar));

// Bug: reportToHtml missing composition + subgraphDiffs
const payload = {
  composition: { success: false, errors: [{ message: "test error" }] },
  subgraphDiffs: [{ name: "users", changes: [{ type: "X", path: "p", severity: "breaking", message: "m" }] }],
};
probe("reportToMarkdown composition", () => reportToMarkdown(payload).includes("composition") || reportToMarkdown(payload).slice(0, 200));
probe("reportToHtml has composition", () => reportToHtml(payload).includes("composition") || reportToHtml(payload).includes("Composition"));
probe("reportToHtml has subgraph", () => reportToHtml(payload).includes("Subgraph") || reportToHtml(payload).includes("users"));

// extractOperationName: multiple named ops in one string?
probe("operationCoverage multi-op in one doc", () =>
  operationCoverage([`query First { hello } query Second { hello }`], `type Query { hello: String }`),
);

// XSS in reportToHtml
const xssChanges = [{ type: "T", path: "<script>", severity: "breaking", message: "<img onerror=alert(1)>" }];
probe("reportToHtml XSS escape", () => reportToHtml({ changes: xssChanges }));

// parseSchemaInput: JSON that's not introspection
probe("parseSchemaInput random JSON", () => {
  try {
    parseSchemaInput('{"foo": "bar"}');
    return "no throw";
  } catch (e) {
    return e.message.slice(0, 120);
  }
});

// parseSchemaInput: SDL starting with { in description?
probe("parseSchemaInput SDL with leading brace in string", () => {
  try {
    parseSchemaInput('{ hello: String }'); // invalid - treated as JSON?
  } catch (e) {
    return e.message.slice(0, 120);
  }
});

// rename suggestion false positive
probe("rename suggestion snake_case", () =>
  diff(
    `type Query { u: User } type User { user_name: String }`,
    `type Query { u: User } type User { userName: String }`,
  ),
);

// empty type map diff
probe("diff minimal empty mutation", () => diff(`type Query { a: String }`, `type Query { a: String b: String }`));

// reportToJson composition field
probe("reportToJson composition preserved", () => {
  const j = reportToJson({ composition: { success: true, errors: [] } });
  return JSON.parse(j);
});
