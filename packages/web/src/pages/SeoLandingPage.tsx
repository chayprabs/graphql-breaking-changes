import { Playground } from "../components/Playground";
import { usePageTitle } from "../hooks/usePageTitle";

const MESSAGES = {
  diff: "Compare two GraphQL SDL schemas side by side with severity classification.",
  breaking: "Find breaking schema changes before you deploy to production.",
  coverage: "Check whether your .graphql operation files still validate against a new schema.",
  federation: "Compose Apollo Federation v2 subgraphs and surface composition errors.",
  lint: "Run naming, deprecation, and description lint rules on your schema.",
};

const TITLES: Record<keyof typeof MESSAGES, string> = {
  diff: "GraphQL Schema Diff — GraphQLGuard",
  breaking: "GraphQL Breaking Change Check — GraphQLGuard",
  coverage: "GraphQL Operation Coverage — GraphQLGuard",
  federation: "Apollo Federation Check — GraphQLGuard",
  lint: "GraphQL Schema Lint — GraphQLGuard",
};

export function SeoLandingPage({ mode }: { mode: keyof typeof MESSAGES }) {
  usePageTitle(TITLES[mode], MESSAGES[mode]);
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">{MESSAGES[mode]}</p>
      <Playground initialTab={mode === "federation" ? "federation" : mode === "coverage" ? "coverage" : mode === "lint" ? "lint" : "diff"} />
    </div>
  );
}
