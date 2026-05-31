export { diff, diffSchemas } from "./diff.js";
export { operationCoverage } from "./operation-coverage.js";
export { composeFederation } from "./federation.js";
export { lintSchema, lintSchemaObject } from "./lint.js";
export { reportToHtml, reportToJson, reportToMarkdown, downloadBlob } from "./reports.js";
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
