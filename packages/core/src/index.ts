export { diff, diffSchemas } from "./diff.js";
export { operationCoverage } from "./operation-coverage.js";
export { composeFederation } from "./federation.js";
export { diffSubgraphs } from "./subgraph-diff.js";
export type { SubgraphDiffResult } from "./subgraph-diff.js";
export { lintSchema, lintSchemaObject } from "./lint.js";
export {
  reportToHtml,
  reportToJson,
  reportToMarkdown,
  downloadBlob,
  type ReportPayload,
} from "./reports.js";
export { formatSdl } from "./format.js";
export { parseSchemaInput, schemaToSdl } from "./parse.js";
export type {
  CompositionError,
  CompositionResult,
  DiffOptions,
  LintIssue,
  OperationCoverage,
  OperationCoverageItem,
  SchemaChange,
  Severity,
  SubgraphInput,
} from "./types.js";
