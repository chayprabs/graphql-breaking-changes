import { Playground } from "../components/Playground";

const MESSAGES = {
  diff: "Compare two GraphQL SDL schemas side by side with severity classification.",
  breaking: "Find breaking schema changes before you deploy to production.",
  coverage: "Check whether your .graphql operation files still validate against a new schema.",
  federation: "Compose Apollo Federation v2 subgraphs and surface composition errors.",
  lint: "Run naming, deprecation, and description lint rules on your schema.",
};

export function SeoLandingPage({ mode }: { mode: keyof typeof MESSAGES }) {
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">{MESSAGES[mode]}</p>
      <Playground initialTab={mode === "federation" ? "federation" : mode === "coverage" ? "coverage" : mode === "lint" ? "lint" : "diff"} />
    </div>
  );
}
