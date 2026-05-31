import { useCallback, useEffect, useRef } from "react";
import type { EngineMethod } from "../worker/engine.worker";
import {
  diff,
  operationCoverage,
  composeFederation,
  lintSchema,
  diffSubgraphs,
} from "@graphql-guard/core";

function runSync(method: EngineMethod, args: unknown[]): unknown {
  switch (method) {
    case "diff":
      return diff(args[0] as string, args[1] as string);
    case "operationCoverage":
      return operationCoverage(args[0] as string[], args[1] as string);
    case "composeFederation":
      return composeFederation(args[0] as Parameters<typeof composeFederation>[0]);
    case "lintSchema":
      return lintSchema(args[0] as string);
    case "diffSubgraphs":
      return diffSubgraphs(
        args[0] as Parameters<typeof diffSubgraphs>[0],
        args[1] as Parameters<typeof diffSubgraphs>[1],
      );
    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

export function useEngine() {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const pendingRef = useRef(
    new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>(),
  );

  useEffect(() => {
    if (typeof Worker === "undefined") return;
    try {
      const worker = new Worker(new URL("../worker/engine.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.onmessage = (e: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
        const pending = pendingRef.current.get(e.data.id);
        if (!pending) return;
        pendingRef.current.delete(e.data.id);
        if (e.data.error) pending.reject(new Error(e.data.error));
        else pending.resolve(e.data.result);
      };
      workerRef.current = worker;
      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      workerRef.current = null;
    }
  }, []);

  const run = useCallback(async <T>(method: EngineMethod, ...args: unknown[]): Promise<T> => {
    const worker = workerRef.current;
    if (!worker) {
      return runSync(method, args) as T;
    }
    const id = ++idRef.current;
    return new Promise<T>((resolve, reject) => {
      pendingRef.current.set(id, {
        resolve: (v) => resolve(v as T),
        reject,
      });
      worker.postMessage({ id, method, args });
    });
  }, []);

  return { run };
}
