import { useCallback, useMemo, useState } from "react";
import {
  diff,
  operationCoverage,
  composeFederation,
  lintSchema,
  reportToHtml,
  reportToJson,
  reportToMarkdown,
  downloadBlob,
  type SchemaChange,
  type OperationCoverage,
  type CompositionResult,
  type LintIssue,
} from "@graphql-guard/core";
import {
  SAMPLE_OLD_SDL,
  SAMPLE_NEW_SDL,
  SAMPLE_OPERATION,
  FEDERATION_SUBGRAPHS,
} from "@graphql-guard/core/fixtures/samples";
import { Download, Play, Upload } from "lucide-react";

type Tab = "diff" | "coverage" | "federation" | "lint";

interface PlaygroundProps {
  initialTab?: Tab;
}

export function Playground({ initialTab = "diff" }: PlaygroundProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [oldSdl, setOldSdl] = useState(SAMPLE_OLD_SDL);
  const [newSdl, setNewSdl] = useState(SAMPLE_NEW_SDL);
  const [operations, setOperations] = useState(SAMPLE_OPERATION);
  const [subgraphs, setSubgraphs] = useState(
    `users:\n${FEDERATION_SUBGRAPHS.users}\n\n---\n\nproducts:\n${FEDERATION_SUBGRAPHS.products}`,
  );
  const [changes, setChanges] = useState<SchemaChange[]>([]);
  const [coverage, setCoverage] = useState<OperationCoverage | null>(null);
  const [composition, setComposition] = useState<CompositionResult | null>(null);
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  const counts = useMemo(
    () => ({
      breaking: changes.filter((c) => c.severity === "breaking").length,
      dangerous: changes.filter((c) => c.severity === "dangerous").length,
      safe: changes.filter((c) => c.severity === "safe").length,
    }),
    [changes],
  );

  const runDiff = useCallback(() => {
    setError(null);
    try {
      const result = diff(oldSdl, newSdl);
      setChanges(result);
      setRan(true);
      setTab("diff");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [oldSdl, newSdl]);

  const runCoverage = useCallback(() => {
    setError(null);
    try {
      const ops = operations
        .split(/(?=query |mutation |subscription )/i)
        .map((s) => s.trim())
        .filter(Boolean);
      const result = operationCoverage(ops.length ? ops : [operations], newSdl);
      setCoverage(result);
      setRan(true);
      setTab("coverage");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [operations, newSdl]);

  const runFederation = useCallback(() => {
    setError(null);
    try {
      const parts = subgraphs.split(/\n---\n/).map((p) => p.trim()).filter(Boolean);
      const parsed = parts.map((part) => {
        const nameMatch = part.match(/^(\w+):\s*\n?/);
        const name = nameMatch?.[1] ?? "subgraph";
        const sdl = part.replace(/^(\w+):\s*\n?/, "").trim();
        return { name, sdl };
      });
      const result = composeFederation(parsed);
      setComposition(result);
      setRan(true);
      setTab("federation");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [subgraphs]);

  const runLint = useCallback(() => {
    setError(null);
    try {
      const result = lintSchema(newSdl);
      setLintIssues(result);
      setRan(true);
      setTab("lint");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [newSdl]);

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
    setError(null);
    setRan(false);
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
      </div>

      {tab === "diff" && (
        <div className="grid gap-4 md:grid-cols-2">
          <SchemaEditor label="Old schema (SDL or introspection JSON)" value={oldSdl} onChange={setOldSdl} />
          <SchemaEditor label="New schema (SDL or introspection JSON)" value={newSdl} onChange={setNewSdl} />
        </div>
      )}

      {tab === "coverage" && (
        <div className="grid gap-4 md:grid-cols-2">
          <SchemaEditor label="Operations (.graphql)" value={operations} onChange={setOperations} rows={12} />
          <SchemaEditor label="Target schema (new)" value={newSdl} onChange={setNewSdl} />
        </div>
      )}

      {tab === "federation" && (
        <SchemaEditor
          label="Subgraphs (name: then SDL, separate with ---)"
          value={subgraphs}
          onChange={setSubgraphs}
          rows={16}
        />
      )}

      {tab === "lint" && (
        <SchemaEditor label="Schema to lint" value={newSdl} onChange={setNewSdl} rows={14} />
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <Play className="h-4 w-4" />
          {tab === "diff" && "Run diff"}
          {tab === "coverage" && "Check operations"}
          {tab === "federation" && "Compose subgraphs"}
          {tab === "lint" && "Lint schema"}
        </button>
        {tab === "diff" && ran && changes.length > 0 && (
          <>
            <ExportButton
              label="JSON"
              onClick={() => downloadBlob(reportToJson(changes), "graphql-diff.json", "application/json")}
            />
            <ExportButton
              label="Markdown"
              onClick={() =>
                downloadBlob(reportToMarkdown(changes), "graphql-changelog.md", "text/markdown")
              }
            />
            <ExportButton
              label="HTML"
              onClick={() =>
                downloadBlob(reportToHtml(changes, coverage ?? undefined), "graphql-report.html", "text/html")
              }
            />
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {ran && tab === "diff" && (
        <ResultsPanel counts={counts} changes={changes} />
      )}

      {ran && tab === "coverage" && coverage && (
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
      )}

      {ran && tab === "federation" && composition && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {composition.success ? (
            <>
              <p className="mb-2 font-medium text-green-800">Composition succeeded</p>
              <pre className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
                {composition.supergraphSdl?.slice(0, 2000)}
                {(composition.supergraphSdl?.length ?? 0) > 2000 ? "\n…" : ""}
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
      )}

      {ran && tab === "lint" && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 font-medium">{lintIssues.length} lint issues</h3>
          {lintIssues.length === 0 ? (
            <p className="text-sm text-green-700">No issues found.</p>
          ) : (
            <ul className="max-h-72 space-y-1 overflow-auto text-sm">
              {lintIssues.map((issue, i) => (
                <li key={i} className="rounded bg-amber-50 px-2 py-1 text-amber-950">
                  <span className="font-medium">{issue.rule}</span> — {issue.path}: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function SchemaEditor({
  label,
  value,
  onChange,
  rows = 10,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
          <Upload className="h-3.5 w-3.5" />
          Upload
          <input type="file" accept=".graphql,.gql,.json,.txt" className="hidden" onChange={onFile} />
        </label>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className="w-full resize-y rounded-xl border border-gray-200 bg-white p-3 font-mono text-xs leading-relaxed text-gray-900 shadow-sm outline-none ring-blue-500 focus:ring-2"
      />
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
  const filtered =
    filter === "all" ? changes : changes.filter((c) => c.severity === filter);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap gap-3 border-b border-gray-100 px-4 py-3">
        <Badge label="Breaking" count={counts.breaking} color="red" active={filter === "breaking"} onClick={() => setFilter(filter === "breaking" ? "all" : "breaking")} />
        <Badge label="Dangerous" count={counts.dangerous} color="amber" active={filter === "dangerous"} onClick={() => setFilter(filter === "dangerous" ? "all" : "dangerous")} />
        <Badge label="Safe" count={counts.safe} color="green" active={filter === "safe"} onClick={() => setFilter(filter === "safe" ? "all" : "safe")} />
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
