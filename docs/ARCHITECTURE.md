# GraphQLGuard Architecture

Browser-only Pattern C+D monorepo:

- `packages/core` — schema diff (graphql-js breaking/dangerous/safe), operation coverage, federation composition (`@theguild/federation-composition`), lint, reports, subgraph diff.
- `packages/web` — Vite + React 19 playground with Monaco editors (lazy), web worker for heavy work, PWA, localStorage persistence.
- `packages/cli` — `graphql-guard old.graphql new.graphql` for CI pipelines.

All user schema processing runs locally after initial page load. No backend API.
