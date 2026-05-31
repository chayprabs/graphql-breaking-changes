import type { OperationCoverage, SchemaChange } from "./types.js";

export function reportToJson(changes: SchemaChange[]): string {
  return JSON.stringify({ changes, generatedAt: new Date().toISOString() }, null, 2);
}

export function reportToMarkdown(changes: SchemaChange[]): string {
  const lines = ["# GraphQL Schema Changelog", "", `Generated: ${new Date().toISOString()}`, ""];
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
  return lines.join("\n");
}

export function reportToHtml(changes: SchemaChange[], coverage?: OperationCoverage): string {
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

  const coverageSection = coverage
    ? `<h2>Operation Coverage</h2><p>${coverage.valid}/${coverage.total} operations valid against new schema.</p>`
    : "";

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
  ${coverageSection}
  <table>
    <thead><tr><th>Severity</th><th>Path</th><th>Type</th><th>Message</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
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
