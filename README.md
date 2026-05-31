# GraphQLGuard

**Diff two GraphQL schemas online** and find breaking and dangerous changes — with operation coverage and Apollo Federation composition checks. Everything runs in your browser; your schemas never leave your device.

[![CI](https://github.com/chayprabs/graphql-breaking-changes/actions/workflows/ci.yml/badge.svg)](https://github.com/chayprabs/graphql-breaking-changes/actions/workflows/ci.yml)

## Features

- **Schema diff** — Paste two SDL documents or introspection JSON; get breaking, dangerous, and safe changes with optional rename suggestions.
- **Operation coverage** — Upload `.graphql` operation files and validate them against your new schema.
- **Federation** — Compose Apollo Federation v2 subgraphs and surface composition errors.
- **Lint** — Naming, deprecation, and description rules (Spectral-style defaults).
- **Reports** — Export HTML, JSON, or Markdown changelogs.

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
import { diff, operationCoverage, composeFederation } from "@graphql-guard/core";

const changes = diff(oldSdl, newSdl);
const coverage = operationCoverage([operationSdl], newSdl);
const composition = composeFederation([{ name: "users", sdl: "..." }]);
```

## Privacy

This tool is **browser-only**. No schema data is sent to a backend. See [Privacy Policy](/privacy) on the hosted site.

## License

MIT — see [LICENSE](LICENSE).

## Topics

`graphql` `graphql-schema` `graphql-diff` `breaking-changes` `api-versioning` `graphql-federation` `graphql-inspector` `sdl` `api-governance` `graphql-tools` `schema-diff` `dangerous-changes` `graphql-validator` `api-design` `online-tool`
