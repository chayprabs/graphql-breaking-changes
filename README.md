# GraphQLGuard

**Diff two GraphQL schemas online** and find breaking and dangerous changes — with operation coverage and Apollo Federation composition checks. Everything runs in your browser; your schemas never leave your device.

[![CI](https://github.com/chayprabs/graphql-breaking-changes/actions/workflows/ci.yml/badge.svg)](https://github.com/chayprabs/graphql-breaking-changes/actions/workflows/ci.yml)

## Features

- **Schema diff** — Paste two SDL documents or introspection JSON; get breaking, dangerous, and safe changes with rename suggestions (`name` → `fullName`).
- **Operation coverage** — Drop multiple `.graphql` operation files; validate against the new schema with per-operation reasons.
- **Federation** — Compose Apollo Federation v2 supergraphs **or** diff subgraph SDLs in isolation (F4.2).
- **Lint** — Naming, deprecation, and description rules (Spectral-style defaults).
- **Reports** — Export HTML, JSON, or Markdown from any tab (diff, coverage, lint, federation).
- **Monaco editors** — GraphQL syntax highlighting (lazy-loaded).
- **Web Worker** — Diff and composition run off the main thread.
- **PWA** — Installable, works offline after first load.
- **Privacy** — Browser-only; optional localStorage for editor state; one-click clear.
- **CLI** — `npx graphql-guard old.graphql new.graphql` exits `1` on breaking changes.

Sample SDL files live in `packages/web/public/samples/`.

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Self-host

```bash
pnpm build
# Static files in packages/web/dist
```

Or with Docker:

```bash
docker compose up --build
```

Visit [http://localhost:8080](http://localhost:8080).

## Monorepo layout

```
packages/
  core/   # @graphql-guard/core — diff, coverage, federation, lint
  web/    # Vite + React playground
```

## Library API

```ts
import {
  diff,
  operationCoverage,
  composeFederation,
  diffSubgraphs,
  lintSchema,
  formatSdl,
  reportToJson,
} from "@graphql-guard/core";

const changes = diff(oldSdl, newSdl);
const coverage = operationCoverage([operationSdl], newSdl);
const composition = composeFederation([{ name: "users", sdl: "..." }]);
const subgraphChanges = diffSubgraphs(oldSubgraphs, newSubgraphs);
```

## CLI

```bash
pnpm --filter @graphql-guard/cli build
node packages/cli/dist/cli.js packages/web/public/samples/small-old.graphql packages/web/public/samples/small-new.graphql
# exit code 1 if breaking changes exist
```

## Privacy

This tool is **browser-only**. No schema data is sent to a backend. See [Privacy Policy](/privacy) on the hosted site.

## Community

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md)

## License

MIT — see [LICENSE](LICENSE).

## Topics

`graphql` `graphql-schema` `graphql-diff` `breaking-changes` `api-versioning` `graphql-federation` `graphql-inspector` `sdl` `api-governance` `graphql-tools` `schema-diff` `dangerous-changes` `graphql-validator` `api-design` `online-tool`
