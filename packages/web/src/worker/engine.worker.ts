import {
  diff,
  operationCoverage,
  composeFederation,
  lintSchema,
  diffSubgraphs,
  type SubgraphInput,
} from "@graphql-guard/core";

export type EngineMethod =
  | "diff"
  | "operationCoverage"
  | "composeFederation"
  | "lintSchema"
  | "diffSubgraphs";

export interface WorkerRequest {
  id: number;
  method: EngineMethod;
  args: unknown[];
}

export interface WorkerResponse {
  id: number;
  result?: unknown;
  error?: string;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, method, args } = event.data;
  try {
    let result: unknown;
    switch (method) {
      case "diff":
        result = diff(args[0] as string, args[1] as string);
        break;
      case "operationCoverage":
        result = operationCoverage(args[0] as string[], args[1] as string);
        break;
      case "composeFederation":
        result = composeFederation(args[0] as SubgraphInput[]);
        break;
      case "lintSchema":
        result = lintSchema(args[0] as string);
        break;
      case "diffSubgraphs":
        result = diffSubgraphs(args[0] as SubgraphInput[], args[1] as SubgraphInput[]);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    const response: WorkerResponse = { id, result };
    self.postMessage(response);
  } catch (err) {
    const response: WorkerResponse = {
      id,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
