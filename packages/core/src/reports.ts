import type { LintIssue, OperationCoverage, SchemaChange } from "./types.js";
import type { SubgraphDiffResult } from "./subgraph-diff.js";

export interface ReportPayload {
  changes?: SchemaChange[];
  coverage?: OperationCoverage;
  lint?: LintIssue[];
  subgraphDiffs?: SubgraphDiffResult[];
  composition?: { success: boolean; errors: { message: string }[] };
}

export function reportToJson(payload: ReportPayload): string {
  return JSON.stringify({ ...payload, generatedAt: new Date().toISOString() }, null, 2);
}

export function reportToMarkdown(payload: ReportPayload): string {
  const lines = ["# GraphQLGuard Report", "", `Generated: ${new Date().toISOString()}`, ""];
  const changes = payload.changes ?? [];

  const groups: Record<string, SchemaChange[]> = {
    breaking: [],
    dangerous: [],
    safe: [],
  };
  for (const c of changes) {
    groups[c.severity].push(c);
  }

  for (const [severity, label] of [
    ["breaking", "Breaking"],
    ["dangerous", "Dangerous"],
    ["safe", "Safe"],
  ] as const) {
    const items = groups[severity];
    if (items.length === 0) continue;
    lines.push(`## ${label} (${items.length})`, "");
    for (const c of items) {
      lines.push(`- **${c.path || c.type}**: ${c.message}`);
      if (c.suggestedRename) {
        lines.push(`  - Suggested rename: \`${c.suggestedRename}\``);
      }
    }
    lines.push("");
  }

  if (payload.coverage) {
    lines.push(`## Operation Coverage`, "");
    lines.push(`${payload.coverage.valid}/${payload.coverage.total} valid`, "");
    for (const item of payload.coverage.items) {
      lines.push(`- **${item.name}**: ${item.valid ? "valid" : "invalid"}`);
      for (const r of item.reasons) {
        lines.push(`  - ${r}`);
      }
    }
    lines.push("");
  }

  if (payload.lint?.length) {
    lines.push(`## Lint (${payload.lint.length})`, "");
    for (const issue of payload.lint) {
      lines.push(`- ${issue.rule} — ${issue.path}: ${issue.message}`);
    }
    lines.push("");
  }

  if (payload.subgraphDiffs?.length) {
    lines.push(`## Subgraph diffs`, "");
    for (const sg of payload.subgraphDiffs) {
      lines.push(`### ${sg.name} (${sg.changes.length} changes)`, "");
      for (const c of sg.changes.slice(0, 20)) {
        lines.push(`- [${c.severity}] ${c.path}: ${c.message}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function reportToHtml(payload: ReportPayload): string {
  const changes = payload.changes ?? [];
  const counts = {
    breaking: changes.filter((c) => c.severity === "breaking").length,
    dangerous: changes.filter((c) => c.severity === "dangerous").length,
    safe: changes.filter((c) => c.severity === "safe").length,
  };

  const rows = changes
    .map(
      (c) =>
        `<tr class="${c.severity}"><td>${c.severity}</td><td>${escapeHtml(c.path)}</td><td>${escapeHtml(c.type)}</td><td>${escapeHtml(c.message)}</td></tr>`,
    )
    .join("\n");

  let extra = "";
  if (payload.coverage) {
    const covRows = payload.coverage.items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.name)}</td><td>${item.valid ? "valid" : "invalid"}</td><td>${escapeHtml(item.reasons.join("; "))}</td></tr>`,
      )
      .join("");
    extra += `<h2>Operation Coverage</h2><p>${payload.coverage.valid}/${payload.coverage.total} valid</p><table><thead><tr><th>Operation</th><th>Status</th><th>Details</th></tr></thead><tbody>${covRows}</tbody></table>`;
  }

  if (payload.lint?.length) {
    extra += `<h2>Lint</h2><ul>${payload.lint.map((i) => `<li>${escapeHtml(i.rule)} — ${escapeHtml(i.path)}: ${escapeHtml(i.message)}</li>`).join("")}</ul>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>GraphQLGuard Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; }
    .breaking { color: #b91c1c; }
    .dangerous { color: #b45309; }
    .safe { color: #15803d; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
  <h1>GraphQL Schema Diff Report</h1>
  <p>Breaking: ${counts.breaking} | Dangerous: ${counts.dangerous} | Safe: ${counts.safe}</p>
  ${extra}
  <table>
    <thead><tr><th>Severity</th><th>Path</th><th>Type</th><th>Message</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

/** @deprecated Use reportToJson({ changes }) */
export function reportToJsonChanges(changes: SchemaChange[]): string {
  return reportToJson({ changes });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function downloadBlob(content: string, filename: string, mime: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
