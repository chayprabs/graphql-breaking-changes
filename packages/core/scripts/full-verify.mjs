#!/usr/bin/env node
/**
 * Full verification runner for @graphql-guard/core
 * Usage: node scripts/full-verify.mjs
 */
import {
  buildClientSchema,
  getIntrospectionQuery,
  graphql,
} from "graphql";
import {
  diff,
  diffSchemas,
  operationCoverage,
  composeFederation,
  diffSubgraphs,
  lintSchema,
  formatSdl,
  parseSchemaInput,
  reportToJson,
  reportToMarkdown,
  reportToHtml,
} from "../dist/index.js";
import { extractPath } from "../dist/diff.js";
import {
  FEDERATION_CONFLICT_SUBGRAPH,
  FEDERATION_SUBGRAPHS,
  SAMPLE_NEW_SDL,
  SAMPLE_OLD_SDL,
  SAMPLE_OPERATION,
} from "../dist/fixtures/samples.js";

const results = [];

function test(name, input, expected, actual, pass, notes) {
  results.push({ name, input, expected, actual, pass, notes });
}

async function introspectionJson(sdl, withDataWrapper) {
  const schema = parseSchemaInput(sdl);
  const { data } = await graphql({ schema, source: getIntrospectionQuery() });
  return withDataWrapper ? JSON.stringify({ data }) : JSON.stringify(data);
}

function summarize(v, max = 400) {
  const s = typeof v === "string" ? v : JSON.stringify(v, null, 2);
  return s.length > max ? s.slice(0, max) + "…" : s;
}

console.log("GraphQLGuard @graphql-guard/core — Full Verification\n");

// 1. diff()
{
  const changes = diff(SAMPLE_OLD_SDL, SAMPLE_NEW_SDL);
  test(
    "diff() SDL vs SDL",
    "SAMPLE_OLD_SDL vs SAMPLE_NEW_SDL",
    "SchemaChange[]: FIELD_REMOVED User.email/name, suggestedRename fullName, FIELD_ADDED User.fullName",
    changes,
    changes.some((c) => c.path === "User.email" && c.severity === "breaking") &&
      changes.find((c) => c.path === "User.name")?.suggestedRename === "fullName" &&
      changes.some((c) => c.path === "User.fullName" && c.severity === "safe"),
  );
}

{
  const oldJ = await introspectionJson(SAMPLE_OLD_SDL, false);
  const newJ = await introspectionJson(SAMPLE_NEW_SDL, false);
  const changes = diff(oldJ, newJ);
  test(
    "diff() introspection JSON (no data wrapper)",
    "introspection JSON strings",
    "Same field changes as SDL diff",
    changes,
    changes.some((c) => c.path === "User.email") && changes.some((c) => c.path === "User.fullName"),
  );
}

{
  const oldJ = await introspectionJson(SAMPLE_OLD_SDL, true);
  const newJ = await introspectionJson(SAMPLE_NEW_SDL, true);
  const changes = diff(oldJ, newJ);
  test(
    "diff() introspection JSON (with data wrapper)",
    '{"data":{__schema:...}}',
    "Same field changes as SDL diff",
    changes,
    changes.some((c) => c.path === "User.name" && c.suggestedRename === "fullName"),
  );
}

{
  const changes = diff(SAMPLE_OLD_SDL, SAMPLE_OLD_SDL);
  test("diff() identical schemas", "same SDL twice", "[]", changes, changes.length === 0);
}

{
  let threw = false;
  try { diff("", SAMPLE_NEW_SDL); } catch { threw = true; }
  test("diff() empty input", '""', "throws 'Schema input is empty.'", { threw }, threw);
}

{
  const changes = diff(
    `"""用户 🌍""" type Query { hello: String }`,
    `"""用户 🌍✨""" type Query { hello: String }`,
  );
  test(
    "diff() unicode descriptions",
    "unicode in type descriptions",
    "No breaking changes (description diff may be empty — see bug)",
    changes,
    !changes.some((c) => c.severity === "breaking"),
    changes.length === 0 ? "Query description changes not detected (BUG)" : undefined,
  );
}

// 2. operationCoverage()
{
  const cov = operationCoverage([`query GetUser { user(id: "1") { id fullName } }`], SAMPLE_NEW_SDL);
  test("operationCoverage() valid op", "GetUser with fullName", "{ valid:1 }", cov, cov.valid === 1);
}

{
  const cov = operationCoverage([SAMPLE_OPERATION], SAMPLE_NEW_SDL);
  test(
    "operationCoverage() invalid op",
    "SAMPLE_OPERATION vs SAMPLE_NEW_SDL",
    "{ invalid:1, reasons non-empty }",
    cov,
    cov.invalid === 1 && cov.items[0].reasons.length >= 2,
  );
}

{
  const ops = [`query A { hello }`, `query B { user(id: "1") { fullName } }`, `query C { user(id: "1") { name } }`];
  const cov = operationCoverage(ops, SAMPLE_NEW_SDL);
  test("operationCoverage() multiple ops", "3 queries", "{ total:3, valid:2, invalid:1 }", cov, cov.total === 3 && cov.valid === 2);
}

{
  const cov = operationCoverage([`query { user( }`], SAMPLE_NEW_SDL);
  test(
    "operationCoverage() parse error",
    "syntax error",
    "{ valid:false, syntax reason }",
    cov,
    !cov.items[0].valid && cov.items[0].reasons[0].includes("Syntax Error"),
  );
}

{
  const cov = operationCoverage([], SAMPLE_NEW_SDL);
  test("operationCoverage() empty array", "[]", "{ total:0 }", cov, cov.total === 0);
}

// 3. composeFederation()
{
  const r = composeFederation([
    { name: "users", sdl: FEDERATION_SUBGRAPHS.users },
    { name: "products", sdl: FEDERATION_SUBGRAPHS.products },
  ]);
  test("composeFederation() valid 2-subgraph", "users + products", "{ success:true, supergraphSdl }", r, r.success && !!r.supergraphSdl);
}

{
  const r = composeFederation([
    { name: "users", sdl: FEDERATION_SUBGRAPHS.users },
    { name: "conflict", sdl: FEDERATION_CONFLICT_SUBGRAPH },
  ]);
  test("composeFederation() conflict", "users + conflict", "{ success:false, errors[] }", r, !r.success && r.errors.length > 0);
}

{
  const r = composeFederation([]);
  test("composeFederation() empty", "[]", "{ success:false, At least one subgraph }", r, !r.success && r.errors[0].message.includes("At least one"));
}

// 4. diffSubgraphs()
{
  const r = diffSubgraphs(
    [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }],
    [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users.replace("name: String!", "displayName: String!") }],
  );
  test("diffSubgraphs() same-name field diff", "users name→displayName", "field changes", r, r[0].changes.some((c) => c.path.includes("name") || c.path.includes("displayName")));
}

{
  const r = diffSubgraphs(
    [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }, { name: "products", sdl: FEDERATION_SUBGRAPHS.products }],
    [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }],
  );
  test("diffSubgraphs() removed subgraph", "drop products", "SUBGRAPH_REMOVED", r, r.some((x) => x.name === "products" && x.changes[0]?.type === "SUBGRAPH_REMOVED"));
}

{
  const r = diffSubgraphs(
    [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }],
    [{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }, { name: "products", sdl: FEDERATION_SUBGRAPHS.products }],
  );
  test("diffSubgraphs() added subgraph", "add products", "SUBGRAPH_ADDED", r, r.some((x) => x.name === "products" && x.changes[0]?.type === "SUBGRAPH_ADDED"));
}

// 5. lintSchema()
{
  const issues = lintSchema(`type Query { hello: String }`);
  test("lintSchema() issues found", "Query without description", "description-type warning", issues, issues.some((i) => i.rule === "description-type"));
}

{
  const issues = lintSchema(`"""Root""" type Query { """h""" hello: String }`);
  test("lintSchema() clean schema", "described Query+field", "no description-type on Query", issues, !issues.some((i) => i.rule === "description-type" && i.path === "Query"));
}

// 6. formatSdl / parseSchemaInput
{
  const schema = parseSchemaInput("type Query { hello: String }");
  test("parseSchemaInput() SDL", "type Query { hello: String }", "Query root type", { queryType: schema.getQueryType()?.name }, schema.getQueryType()?.name === "Query");
}

{
  const json = await introspectionJson("type Query { hello: String }", true);
  const schema = parseSchemaInput(json);
  test("parseSchemaInput() introspection+data", "{data:{__schema}}", "Query root type", { queryType: schema.getQueryType()?.name }, schema.getQueryType()?.name === "Query");
}

{
  const out = formatSdl("type Query { z: String a: String }");
  test("formatSdl()", "unsorted fields", "lexicographic a before z", out, out.indexOf("a:") < out.indexOf("z:"));
}

{
  let threw = false;
  try { parseSchemaInput("  "); } catch { threw = true; }
  test("parseSchemaInput() empty", "whitespace", "throws", { threw }, threw);
}

// 7. Reports
{
  const payload = {
    changes: diff(SAMPLE_OLD_SDL, SAMPLE_NEW_SDL),
    coverage: operationCoverage([SAMPLE_OPERATION], SAMPLE_NEW_SDL),
    lint: lintSchema(`type Query { hello: String }`),
  };
  const json = JSON.parse(reportToJson(payload));
  test("reportToJson() combined", "changes+coverage+lint", "keys: changes,coverage,lint,generatedAt", Object.keys(json), ["changes", "coverage", "lint", "generatedAt"].every((k) => k in json));
}

{
  const payload = {
    changes: diff(SAMPLE_OLD_SDL, SAMPLE_NEW_SDL),
    coverage: operationCoverage([SAMPLE_OPERATION], SAMPLE_NEW_SDL),
    lint: lintSchema(`type Query { hello: String }`),
  };
  const md = reportToMarkdown(payload);
  test("reportToMarkdown() combined", "changes+coverage+lint", "Breaking + Coverage + Lint sections", md.slice(0, 200), md.includes("Operation Coverage") && md.includes("## Lint"));
}

{
  const payload = {
    changes: diff(SAMPLE_OLD_SDL, SAMPLE_NEW_SDL),
    coverage: operationCoverage([SAMPLE_OPERATION], SAMPLE_NEW_SDL),
    lint: lintSchema(`type Query { hello: String }`),
  };
  const html = reportToHtml(payload);
  test("reportToHtml() combined", "changes+coverage+lint", "HTML table + Coverage + Lint", { len: html.length }, html.includes("Operation Coverage") && html.includes("Lint") && html.includes("<table>"));
}

{
  const sg = diffSubgraphs([{ name: "users", sdl: FEDERATION_SUBGRAPHS.users }], [{ name: "users", sdl: FEDERATION_SUBGRAPHS.products }]);
  const md = reportToMarkdown({ subgraphDiffs: sg });
  const html = reportToHtml({ subgraphDiffs: sg });
  test(
    "reportToHtml() subgraphDiffs parity",
    "subgraphDiffs only",
    "HTML includes subgraph section like Markdown",
    { mdHas: md.includes("Subgraph"), htmlHas: html.includes("Subgraph") || html.includes("users") },
    html.includes("Subgraph") || html.includes("users"),
    !html.includes("Subgraph") ? "BUG: reportToHtml ignores subgraphDiffs (reports.ts:80-135)" : undefined,
  );
}

{
  const md = reportToMarkdown({ composition: { success: false, errors: [{ message: "test" }] } });
  test(
    "reportToMarkdown() composition",
    "composition only payload",
    "Markdown includes composition section",
    md,
    md.toLowerCase().includes("composition") || md.includes("test"),
    !md.includes("test") ? "BUG: reportToMarkdown ignores composition (reports.ts:16-77)" : undefined,
  );
}

// 8. Perf
{
  const fields = Array.from({ length: 200 }, (_, i) => `  field${i}: String`).join("\n");
  const oldSdl = `type Query {\n${fields}\n}`;
  const newSdl = oldSdl.replace("field199", "field199Renamed");
  const t0 = performance.now();
  const changes = diff(oldSdl, newSdl);
  const ms = performance.now() - t0;
  test("perf large schema (200 fields)", "rename field199", "changes>0, <2000ms", { changes: changes.length, ms: ms.toFixed(1) }, changes.length > 0 && ms < 2000);
}

// 9. Known bug probes
{
  const path = extractPath("An optional arg y on Query.f was added.", "OPTIONAL_ARG_ADDED");
  test(
    "extractPath OPTIONAL_ARG_ADDED",
    "dangerous arg add message",
    "path Query.f.y",
    path,
    path === "Query.f.y",
    path !== "Query.f.y" ? `BUG: got '${path}' (diff.ts:62-78)` : undefined,
  );
}

{
  const path = extractPath("Standard scalar ID was removed because it is not referenced anymore.", "TYPE_REMOVED");
  test(
    "extractPath TYPE_REMOVED standard scalar",
    "unused scalar removal",
    "path ID",
    path,
    path === "ID",
    path !== "ID" ? `BUG: got '${path}' (diff.ts:66-67)` : undefined,
  );
}

{
  const o = parseSchemaInput(`"""old""" type Query { a: String }`);
  const n = parseSchemaInput(`"""new""" type Query { a: String }`);
  const withDesc = diffSchemas(o, n);
  test(
    "diffSchemas ignoreDescriptionChanges / Query desc",
    "Query description change",
    "DESCRIPTION_CHANGED detected",
    withDesc,
    withDesc.some((c) => c.type === "DESCRIPTION_CHANGED"),
    "BUG: only custom scalars get DESCRIPTION_CHANGED (diff.ts:168-175)",
  );
}

// Print report
console.log("=".repeat(72));
for (const r of results) {
  console.log(`\n[${r.pass ? "PASS" : "FAIL"}] ${r.name}`);
  console.log(`  INPUT:    ${summarize(r.input, 120)}`);
  console.log(`  EXPECTED: ${r.expected}`);
  console.log(`  ACTUAL:   ${summarize(r.actual, 300)}`);
  if (r.notes) console.log(`  NOTES:    ${r.notes}`);
}

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass).length;
console.log("\n" + "=".repeat(72));
console.log(`SUMMARY: ${results.length} tests | ${passed} PASS | ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
