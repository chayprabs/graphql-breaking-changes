#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { diff, reportToMarkdown } from "@graphql-guard/core";

const [oldPath, newPath] = process.argv.slice(2);

if (!oldPath || !newPath) {
  console.error("Usage: graphql-guard <old.graphql> <new.graphql>");
  process.exit(1);
}

const oldSdl = readFileSync(oldPath, "utf8");
const newSdl = readFileSync(newPath, "utf8");
const changes = diff(oldSdl, newSdl);
const breaking = changes.filter((c) => c.severity === "breaking").length;

console.log(reportToMarkdown({ changes }));
process.exit(breaking > 0 ? 1 : 0);
