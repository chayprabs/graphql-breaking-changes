export type Severity = "breaking" | "dangerous" | "safe";

export interface SchemaChange {
  type: string;
  path: string;
  severity: Severity;
  message: string;
  suggestedRename?: string;
}

export interface OperationCoverageItem {
  name: string;
  valid: boolean;
  reasons: string[];
}

export interface OperationCoverage {
  total: number;
  valid: number;
  invalid: number;
  items: OperationCoverageItem[];
}

export interface SubgraphInput {
  name: string;
  sdl: string;
}

export interface CompositionError {
  message: string;
  source?: string;
}

export interface CompositionResult {
  success: boolean;
  supergraphSdl?: string;
  errors: CompositionError[];
}

export interface LintIssue {
  rule: string;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface DiffOptions {
  ignoreDescriptionChanges?: boolean;
}
