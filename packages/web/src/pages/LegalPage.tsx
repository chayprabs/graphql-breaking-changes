const PRIVACY = `
# Privacy Policy

**Last updated:** May 31, 2026

GraphQLGuard ("we", "the tool") is a browser-only application. Your GraphQL schemas, operation files, and diff results are processed entirely in your web browser. We do not operate a backend that receives, stores, or analyzes your schema data.

## What we do not collect

- We do not upload your SDL, introspection JSON, or operation files to our servers.
- We do not use third-party analytics that transmit file contents or filenames.
- We do not require an account to use the playground.

## Local storage

The app does not persist your schema data to any server. Editor content may be saved in your browser local storage on this device so you can continue later. Use "Clear saved data" in the playground to remove it.

## Third-party links

This site links to GitHub, social profiles, and external websites. Those services have their own privacy policies.

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. See the MIT License for full terms.

## Contact

For privacy questions, contact the repository owner via GitHub issues on the graphql-breaking-changes repository.
`;

const TERMS = `
# Terms & Conditions

**Last updated:** May 31, 2026

By using GraphQLGuard you agree to these terms.

## Service description

GraphQLGuard is a free, browser-based tool for comparing GraphQL schemas, checking operation coverage, federation composition, and linting. Results are informational only and do not constitute professional advice.

## No warranty

THE TOOL IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

## Limitation of liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PROJECT MAINTAINERS AND CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THIS TOOL, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

## Your responsibility

You are solely responsible for:

- Verifying schema diff results before production deployments.
- Ensuring you have rights to process any schemas you paste into the tool.
- Compliance with your organization's policies and applicable laws.

## Acceptable use

You may not use this tool to violate laws, infringe intellectual property, or attempt to disrupt hosted infrastructure.

## Changes

We may update these terms. Continued use after changes constitutes acceptance.

## Governing law

These terms are governed by the laws applicable in your jurisdiction of use, without regard to conflict-of-law principles.

## Contact

Questions: open an issue on the GitHub repository.
`;

export function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const content = type === "privacy" ? PRIVACY : TERMS;
  const title = type === "privacy" ? "Privacy Policy" : "Terms & Conditions";

  return (
    <article className="prose prose-gray mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">{title}</h1>
      <div className="space-y-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
        {content.trim().split("\n").map((line, i) => {
          if (line.startsWith("# ")) {
            return null;
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={i} className="mt-6 text-lg font-semibold text-gray-900">
                {line.replace("## ", "")}
              </h2>
            );
          }
          if (line.startsWith("**") && line.endsWith("**")) {
            return (
              <p key={i} className="font-medium text-gray-900">
                {line.replace(/\*\*/g, "")}
              </p>
            );
          }
          if (line.trim() === "") return <br key={i} />;
          return <p key={i}>{line}</p>;
        })}
      </div>
    </article>
  );
}
