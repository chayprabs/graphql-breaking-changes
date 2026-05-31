import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { LegalPage } from "./pages/LegalPage";
import { SeoLandingPage } from "./pages/SeoLandingPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="graphql-diff" element={<SeoLandingPage mode="diff" />} />
        <Route path="graphql-breaking-check" element={<SeoLandingPage mode="breaking" />} />
        <Route
          path="graphql-operation-coverage"
          element={<SeoLandingPage mode="coverage" />}
        />
        <Route path="apollo-federation-check" element={<SeoLandingPage mode="federation" />} />
        <Route path="graphql-schema-lint" element={<SeoLandingPage mode="lint" />} />
        <Route path="privacy" element={<LegalPage type="privacy" />} />
        <Route path="terms" element={<LegalPage type="terms" />} />
        <Route path="license" element={<LegalPage type="license" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
