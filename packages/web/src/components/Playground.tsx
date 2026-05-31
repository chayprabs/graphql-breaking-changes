import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatSdl,
  parseSubgraphBlocks,
  reportToHtml,
  reportToJson,
  reportToMarkdown,
  downloadBlob,
  type SchemaChange,
  type OperationCoverage,
  type CompositionResult,
  type LintIssue,
  type SubgraphDiffResult,
  type ReportPayload,
} from "@graphql-guard/core";
import {
  SAMPLE_OLD_SDL,
  SAMPLE_NEW_SDL,
  SAMPLE_OPERATION,
  FEDERATION_SUBGRAPHS,
} from "../samples";
import { SchemaEditor } from "./SchemaEditor";
import { useEngine } from "../hooks/useEngine";
import { usePersistedState, clearPersistedData } from "../hooks/usePersistedState";
import { Download, Play, ArrowLeftRight, Trash2, Wand2 } from "lucide-react";

type Tab = "diff" | "coverage" | "federation" | "lint";
type FederationMode = "compose" | "subgraph-diff";

interface PlaygroundProps {
  initialTab?: Tab;
}

export function Playground({ initialTab = "diff" }: PlaygroundProps) {
  const { run } = useEngine();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [oldSdl, setOldSdl] = usePersistedState("oldSdl", SAMPLE_OLD_SDL);
  const [newSdl, setNewSdl] = usePersistedState("newSdl", SAMPLE_NEW_SDL);
  const [operations, setOperations] = usePersistedState("operations", SAMPLE_OPERATION);
  const [subgraphs, setSubgraphs] = usePersistedState(
    "subgraphs",
    `users:\n${FEDERATION_SUBGRAPHS.users}\n\n---\n\nproducts:\n${FEDERATION_SUBGRAPHS.products}`,
  );
  const [oldSubgraphs, setOldSubgraphs] = usePersistedState("oldSubgraphs", `users:\n${FEDERATION_SUBGRAPHS.users}`);
  const [newSubgraphs, setNewSubgraphs] = usePersistedState(
    "newSubgraphs",
    `users:\n${FEDERATION_SUBGRAPHS.users.replace("name: String!", "displayName: String!")}`,
  );
  const [federationMode, setFederationMode] = useState<FederationMode>("compose");
  const [changes, setChanges] = useState<SchemaChange[]>([]);
  const [coverage, setCoverage] = useState<OperationCoverage | null>(null);
  const [composition, setComposition] = useState<CompositionResult | null>(null);
  const [subgraphDiffs, setSubgraphDiffs] = useState<SubgraphDiffResult[]>([]);
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diffRan, setDiffRan] = useState(false);
  const [coverageRan, setCoverageRan] = useState(false);
  const [federationRan, setFederationRan] = useState(false);
  const [lintRan, setLintRan] = useState(false);
  const prevOldSdl = useRef(oldSdl);
  const prevNewSdl = useRef(newSdl);
  const prevOperations = useRef(operations);
  const prevSubgraphs = useRef(subgraphs);
  const prevOldSubgraphs = useRef(oldSubgraphs);
  const prevNewSubgraphs = useRef(newSubgraphs);

  const resetAllResults = useCallback(() => {
    setChanges([]);
    setCoverage(null);
    setComposition(null);
    setSubgraphDiffs([]);
    setLintIssues([]);
    setDiffRan(false);
    setCoverageRan(false);
    setFederationRan(false);
    setLintRan(false);
  }, []);

  useEffect(() => {
    if (diffRan && (prevOldSdl.current !== oldSdl || prevNewSdl.current !== newSdl)) {
      setDiffRan(false);
      setChanges([]);
    }
    prevOldSdl.current = oldSdl;
    prevNewSdl.current = newSdl;
  }, [oldSdl, newSdl, diffRan]);

  useEffect(() => {
    if (
      coverageRan &&
      (prevOperations.current !== operations || prevNewSdl.current !== newSdl)
    ) {
      setCoverageRan(false);
      setCoverage(null);
    }
    prevOperations.current = operations;
  }, [operations, newSdl, coverageRan]);

  useEffect(() => {
    if (lintRan && prevNewSdl.current !== newSdl) {
      setLintRan(false);
      setLintIssues([]);
    }
  }, [newSdl, lintRan]);

  useEffect(() => {
    if (
      federationRan &&
      (prevSubgraphs.current !== subgraphs ||
        prevOldSubgraphs.current !== oldSubgraphs ||
        prevNewSubgraphs.current !== newSubgraphs)
    ) {
      setFederationRan(false);
      setComposition(null);
      setSubgraphDiffs([]);
    }
    prevSubgraphs.current = subgraphs;
    prevOldSubgraphs.current = oldSubgraphs;
    prevNewSubgraphs.current = newSubgraphs;
  }, [subgraphs, oldSubgraphs, newSubgraphs, federationRan]);

  const counts = useMemo(
    () => ({
      breaking: changes.filter((c) => c.severity === "breaking").length,
      dangerous: changes.filter((c) => c.severity === "dangerous").length,
      safe: changes.filter((c) => c.severity === "safe").length,
    }),
    [changes],
  );

  const reportPayload = useCallback((): ReportPayload => {
    const payload: ReportPayload = {};
    if (diffRan) payload.changes = changes;
    if (coverageRan && coverage) payload.coverage = coverage;
    if (lintRan) payload.lint = lintIssues;
    if (federationRan && subgraphDiffs.length) payload.subgraphDiffs = subgraphDiffs;
    if (federationRan && composition) {
      payload.composition = {
        success: composition.success,
        errors: composition.errors,
      };
    }
    return payload;
  }, [diffRan, coverageRan, lintRan, federationRan, changes, coverage, lintIssues, subgraphDiffs, composition]);

  const canExport =
    diffRan ||
    (coverageRan && coverage !== null) ||
    lintRan ||
    (federationRan && (composition !== null || subgraphDiffs.length > 0));

  const exportReport = (format: "json" | "md" | "html") => {
    const payload = reportPayload();
    if (format === "json") {
      downloadBlob(reportToJson(payload), "graphql-guard-report.json", "application/json");
    } else if (format === "md") {
      downloadBlob(reportToMarkdown(payload), "graphql-guard-report.md", "text/markdown");
    } else {
      downloadBlob(reportToHtml(payload), "graphql-guard-report.html", "text/html");
    }
  };

  const runDiff = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await run<SchemaChange[]>("diff", oldSdl, newSdl);
      setChanges(result);
      setDiffRan(true);
      setTab("diff");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [oldSdl, newSdl, run]);

  const runCoverage = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const ops = operations
        .split(/(?=query |mutation |subscription )/i)
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await run<OperationCoverage>(
        "operationCoverage",
        ops.length ? ops : [operations],
        newSdl,
      );
      setCoverage(result);
      setCoverageRan(true);
      setTab("coverage");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [operations, newSdl, run]);

  const runFederation = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (federationMode === "compose") {
        const result = await run<CompositionResult>(
          "composeFederation",
          parseSubgraphBlocks(subgraphs),
        );
        setComposition(result);
        setSubgraphDiffs([]);
      } else {
        const result = await run<SubgraphDiffResult[]>(
          "diffSubgraphs",
          parseSubgraphBlocks(oldSubgraphs),
          parseSubgraphBlocks(newSubgraphs),
        );
        setSubgraphDiffs(result);
        setComposition(null);
      }
      setFederationRan(true);
      setTab("federation");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [federationMode, subgraphs, oldSubgraphs, newSubgraphs, run]);

  const runLint = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await run<LintIssue[]>("lintSchema", newSdl);
      setLintIssues(result);
      setLintRan(true);
      setTab("lint");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [newSdl, run]);

  const handlePrimaryAction = () => {
    void (tab === "coverage"
      ? runCoverage()
      : tab === "federation"
        ? runFederation()
        : tab === "lint"
          ? runLint()
          : runDiff());
  };

  const loadSample = () => {
    setOldSdl(SAMPLE_OLD_SDL);
    setNewSdl(SAMPLE_NEW_SDL);
    setOperations(SAMPLE_OPERATION);
    setSubgraphs(
      `users:\n${FEDERATION_SUBGRAPHS.users}\n\n---\n\nproducts:\n${FEDERATION_SUBGRAPHS.products}`,
    );
    setOldSubgraphs(`users:\n${FEDERATION_SUBGRAPHS.users}`);
    setNewSubgraphs(
      `users:\n${FEDERATION_SUBGRAPHS.users.replace("name: String!", "displayName: String!")}`,
    );
    setError(null);
    resetAllResults();
  };

  const swapSchemas = () => {
    const tmp = oldSdl;
    setOldSdl(newSdl);
    setNewSdl(tmp);
    setDiffRan(false);
    setChanges([]);
  };

  const formatSchema = (which: "old" | "new") => {
    try {
      if (which === "old") setOldSdl(formatSdl(oldSdl));
      else setNewSdl(formatSdl(newSdl));
      setError(null);
      setDiffRan(false);
      setChanges([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleOpsDrop = (files: FileList) => {
    void Promise.all(
      Array.from(files).map(
        (f) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.onerror = () => reject(new Error(`Failed to read file: ${f.name}`));
            reader.readAsText(f);
          }),
      ),
    )
      .then((parts) => setOperations(parts.join("\n\n")))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["diff", "coverage", "federation", "lint"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {t === "diff" && "Schema Diff"}
            {t === "coverage" && "Operation Coverage"}
            {t === "federation" && "Federation"}
            {t === "lint" && "Lint"}
          </button>
        ))}
        <button
          type="button"
          onClick={loadSample}
          className="ml-auto rounded-lg px-3 py-1.5 text-sm text-gray-600 ring-1 ring-gray-200 hover:bg-white"
        >
          Load samples
        </button>
        <button
          type="button"
          onClick={() => {
            clearPersistedData();
            loadSample();
          }}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600 ring-1 ring-gray-200 hover:bg-white"
          title="Clear saved editor data"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear saved data
        </button>
      </div>

      {tab === "diff" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={swapSchemas}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Swap schemas
            </button>
            <button
              type="button"
              onClick={() => formatSchema("old")}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Format old
            </button>
            <button
              type="button"
              onClick={() => formatSchema("new")}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Format new
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SchemaEditor
              label="Old schema (SDL or introspection JSON)"
              value={oldSdl}
              onChange={setOldSdl}
            />
            <SchemaEditor
              label="New schema (SDL or introspection JSON)"
              value={newSdl}
              onChange={setNewSdl}
            />
          </div>
        </>
      )}

      {tab === "coverage" && (
        <div className="grid gap-4 md:grid-cols-2">
          <SchemaEditor
            label="Operations (.graphql) — drop multiple files"
            value={operations}
            onChange={setOperations}
            height="320px"
            onFilesDrop={handleOpsDrop}
          />
          <SchemaEditor label="Target schema (new)" value={newSdl} onChange={setNewSdl} />
        </div>
      )}

      {tab === "federation" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFederationMode("compose");
                setFederationRan(false);
                setComposition(null);
                setSubgraphDiffs([]);
              }}
              className={`rounded-lg px-3 py-1 text-sm ${federationMode === "compose" ? "bg-blue-600 text-white" : "bg-white ring-1 ring-gray-200"}`}
            >
              Compose supergraph
            </button>
            <button
              type="button"
              onClick={() => {
                setFederationMode("subgraph-diff");
                setFederationRan(false);
                setComposition(null);
                setSubgraphDiffs([]);
              }}
              className={`rounded-lg px-3 py-1 text-sm ${federationMode === "subgraph-diff" ? "bg-blue-600 text-white" : "bg-white ring-1 ring-gray-200"}`}
            >
              Subgraph diff
            </button>
          </div>
          {federationMode === "compose" ? (
            <SchemaEditor
              label="Subgraphs (name: then SDL, separate with ---)"
              value={subgraphs}
              onChange={setSubgraphs}
              height="360px"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <SchemaEditor
                label="Old subgraphs"
                value={oldSubgraphs}
                onChange={setOldSubgraphs}
                height="360px"
              />
              <SchemaEditor
                label="New subgraphs"
                value={newSubgraphs}
                onChange={setNewSubgraphs}
                height="360px"
              />
            </div>
          )}
        </div>
      )}

      {tab === "lint" && (
        <SchemaEditor label="Schema to lint" value={newSdl} onChange={setNewSdl} height="360px" />
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
        >
          <Play className="h-4 w-4" />
          {loading
            ? "Running…"
            : tab === "diff"
              ? "Run diff"
              : tab === "coverage"
                ? "Check operations"
                : tab === "federation"
                  ? federationMode === "compose"
                    ? "Compose subgraphs"
                    : "Diff subgraphs"
                  : "Lint schema"}
        </button>
        {canExport && (
          <>
            <ExportButton label="JSON" onClick={() => exportReport("json")} />
            <ExportButton label="Markdown" onClick={() => exportReport("md")} />
            <ExportButton label="HTML" onClick={() => exportReport("html")} />
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {diffRan && tab === "diff" && <ResultsPanel counts={counts} changes={changes} />}

      {coverageRan && tab === "coverage" && coverage && <CoveragePanel coverage={coverage} />}

      {federationRan && tab === "federation" && federationMode === "compose" && composition && (
        <CompositionPanel composition={composition} />
      )}

      {federationRan && tab === "federation" && federationMode === "subgraph-diff" && (
        <SubgraphDiffPanel diffs={subgraphDiffs} />
      )}

      {lintRan && tab === "lint" && <LintPanel issues={lintIssues} />}
    </div>
  );
}

function CoveragePanel({ coverage }: { coverage: OperationCoverage }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-medium text-gray-900">
        {coverage.valid}/{coverage.total} operations valid
      </h3>
      <ul className="space-y-2 text-sm">
        {coverage.items.map((item) => (
          <li
            key={item.name}
            className={`rounded-lg px-3 py-2 ${item.valid ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"}`}
          >
            <span className="font-medium">{item.name}</span>
            {!item.valid && (
              <ul className="mt-1 list-disc pl-4 text-red-800">
                {item.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompositionPanel({ composition }: { composition: CompositionResult }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {composition.success ? (
        <>
          <p className="mb-2 font-medium text-green-800">Composition succeeded</p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
            {composition.supergraphSdl?.slice(0, 4000)}
            {(composition.supergraphSdl?.length ?? 0) > 4000 ? "\n…" : ""}
          </pre>
        </>
      ) : (
        <>
          <p className="mb-2 font-medium text-red-800">Composition failed</p>
          <ul className="space-y-1 text-sm text-red-900">
            {composition.errors.map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function SubgraphDiffPanel({ diffs }: { diffs: SubgraphDiffResult[] }) {
  return (
    <div className="space-y-3">
      {diffs.map((sg) => (
        <div key={sg.name} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-medium">
            {sg.name} — {sg.changes.length} change{sg.changes.length === 1 ? "" : "s"}
          </h3>
          {sg.changes.length === 0 ? (
            <p className="text-sm text-gray-500">No changes.</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-auto text-sm">
              {sg.changes.map((c, i) => (
                <li key={i} className="text-gray-700">
                  <span className="font-medium text-gray-900">[{c.severity}]</span> {c.path}:{" "}
                  {c.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function LintPanel({ issues }: { issues: LintIssue[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-medium">{issues.length} lint issues</h3>
      {issues.length === 0 ? (
        <p className="text-sm text-green-700">No issues found.</p>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-auto text-sm">
          {issues.map((issue, i) => (
            <li key={i} className="rounded bg-amber-50 px-2 py-1 text-amber-950">
              <span className="font-medium">{issue.rule}</span> — {issue.path}: {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}

function ResultsPanel({
  counts,
  changes,
}: {
  counts: { breaking: number; dangerous: number; safe: number };
  changes: SchemaChange[];
}) {
  const [filter, setFilter] = useState<"all" | "breaking" | "dangerous" | "safe">("all");
  const filtered = filter === "all" ? changes : changes.filter((c) => c.severity === filter);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-3 border-b border-gray-100 px-4 py-3">
        <Badge
          label="Breaking"
          count={counts.breaking}
          color="red"
          active={filter === "breaking"}
          onClick={() => setFilter(filter === "breaking" ? "all" : "breaking")}
        />
        <Badge
          label="Dangerous"
          count={counts.dangerous}
          color="amber"
          active={filter === "dangerous"}
          onClick={() => setFilter(filter === "dangerous" ? "all" : "dangerous")}
        />
        <Badge
          label="Safe"
          count={counts.safe}
          color="green"
          active={filter === "safe"}
          onClick={() => setFilter(filter === "safe" ? "all" : "safe")}
        />
        <span className="ml-auto text-sm text-gray-500">{filtered.length} changes</span>
      </div>
      <ul className="max-h-96 divide-y divide-gray-100 overflow-auto">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-gray-500">No changes in this category.</li>
        ) : (
          filtered.map((c, i) => (
            <li key={i} className="px-4 py-3 text-sm">
              <div className="flex items-start gap-2">
                <SeverityDot severity={c.severity} />
                <div>
                  <p className="font-medium text-gray-900">{c.path || c.type}</p>
                  <p className="text-gray-600">{c.message}</p>
                  {c.suggestedRename && (
                    <p className="mt-1 text-xs text-blue-700">
                      Suggested rename: <code>{c.suggestedRename}</code>
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colors = {
    breaking: "bg-red-500",
    dangerous: "bg-amber-500",
    safe: "bg-green-500",
  };
  return (
    <span
      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colors[severity as keyof typeof colors] ?? "bg-gray-400"}`}
    />
  );
}

function Badge({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: "red" | "amber" | "green";
  active: boolean;
  onClick: () => void;
}) {
  const styles = {
    red: active ? "bg-red-600 text-white" : "bg-red-50 text-red-800 ring-red-200",
    amber: active ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-900 ring-amber-200",
    green: active ? "bg-green-600 text-white" : "bg-green-50 text-green-800 ring-green-200",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${styles[color]}`}
    >
      {label}: {count}
    </button>
  );
}
