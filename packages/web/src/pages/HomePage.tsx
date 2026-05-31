import { Playground } from "../components/Playground";
import { usePageTitle } from "../hooks/usePageTitle";

export function HomePage() {
  usePageTitle(
    "GraphQLGuard — GraphQL Schema Diff Online",
    "Diff two GraphQL schemas online and find breaking and dangerous changes.",
  );
  return <Playground />;
}
