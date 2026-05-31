const PRIVACY = `
**Effective date:** May 31, 2026
**Last updated:** May 31, 2026

This Privacy Policy describes how GraphQLGuard ("Service") handles information. The Operator is Chaitanya Prabuddha. By using the Service, you acknowledge this Policy.

## 1. Summary

GraphQLGuard is a browser-only tool. Schema text, introspection JSON, operations, and results are processed on your device. We do not operate a backend that receives your GraphQL content for normal playground use.

## 2. What we do not collect

We do not intentionally collect, purchase, or sell your SDL, introspection JSON, operation files, diff results, or filenames. We do not use analytics that transmit schema content. No login is required.

## 3. Local storage

Editor content may be stored in your browser local storage on this device. Use "Clear saved data" in the playground or your browser settings to remove it. We cannot access this data unless you send it to us voluntarily.

## 4. Hosting technical data

If you visit a hosted copy of the site, infrastructure providers may process limited technical data (IP address, browser type, request logs) to deliver static files. We do not use this to reconstruct your schemas.

## 5. GitHub and third parties

Public GitHub interactions are governed by GitHub's policies. Do not post secrets or confidential schemas in public issues. External links have their own privacy practices.

## 6. Your rights

Depending on your location, you may have privacy rights regarding personal data. Because we generally do not hold your schema content, many requests will not apply to data you never sent us. You may contact a data protection authority in your region.

## 7. Children

The Service is not directed to children under 16. We do not knowingly collect children's personal information.

## 8. Changes and contact

We may update this Policy. Continued use after changes constitutes acceptance where permitted by law. Contact: GitHub issues on chayprabs/graphql-breaking-changes or www.chaitanyaprabuddha.com.

## 9. Terms

This Policy is incorporated into our Terms & Conditions. See the full Privacy Policy in the repository at PRIVACY_POLICY.md for complete wording.
`;

const TERMS = `
**Effective date:** May 31, 2026
**Last updated:** May 31, 2026

PLEASE READ CAREFULLY. THESE TERMS INCLUDE DISCLAIMERS OF WARRANTIES, LIMITATIONS OF LIABILITY, INDEMNIFICATION, AND (WHERE PERMITTED) ARBITRATION AND CLASS ACTION WAIVER.

## 1. Agreement

These Terms are between you and Chaitanya Prabuddha ("Operator"), operating GraphQLGuard. By using the Service, you agree to these Terms and our Privacy Policy. You must be at least 18 years old (or age of majority). If you disagree, do not use the Service.

## 2. Service description

GraphQLGuard compares GraphQL schemas and related checks for informational purposes only. It is not legal, security, compliance, or professional advice. Outputs may be wrong. You must independently verify all results before production use.

## 3. No warranty

TO THE FULLEST EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY.

## 4. Limitation of liability

TO THE FULLEST EXTENT PERMITTED BY LAW, THE OPERATOR, CONTRIBUTORS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM USE OF THE SERVICE.

TOTAL LIABILITY FOR ALL CLAIMS SHALL NOT EXCEED THE GREATER OF USD $0 OR AMOUNTS YOU PAID US IN THE PRIOR 12 MONTHS (TYPICALLY ZERO). MANDATORY LAW MAY NOT ALLOW SOME LIMITATIONS; THEY APPLY TO THE MAXIMUM EXTENT PERMITTED.

## 5. Indemnification

You agree to defend, indemnify, and hold harmless the Operator and contributors from claims arising from your use of the Service, your content, or your violation of these Terms or law.

## 6. Your responsibilities

You are solely responsible for your inputs, your rights to process them, compliance with law and contracts, and all decisions based on outputs. Do not input unlawful content, malware, or unauthorized secrets.

## 7. Prohibited uses

Do not violate law, infringe rights, attack infrastructure, or misuse the Service. Do not rely on outputs as sole basis for production changes without verification.

## 8. Third parties and self-hosting

Third-party libraries and links are provided as-is. If you self-host or fork, you are responsible for security, logging, and compliance.

## 9. Dispute resolution

Contact us first for informal resolution. Except where mandatory consumer law provides otherwise, these Terms are governed by the laws of India, with exclusive jurisdiction in courts in India where permitted. Disputes may be resolved by binding individual arbitration where permitted. Class actions are waived to the extent allowed.

## 10. Changes

We may update these Terms. Continued use constitutes acceptance where permitted. The full Terms are in TERMS.md in the repository.

## 11. Entire agreement

These Terms, the Privacy Policy, and the MIT License (for source code) form the entire agreement regarding the Service.

BY USING GRAPHQLGUARD, YOU AGREE TO THESE TERMS.
`;

const LICENSE_TEXT = `
MIT License

Copyright (c) 2026 Chaitanya Prabuddha

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Use of the hosted website

Use of the hosted GraphQLGuard website and service is also subject to the Terms & Conditions and Privacy Policy on this site and in the GitHub repository. Those documents include additional limitations of liability, disclaimers, indemnification, and dispute resolution that apply to service use.

## No legal advice

This license and the Service do not create a lawyer-client relationship. GraphQLGuard output is not a substitute for professional review of API changes, security, or compliance obligations.
`;

function renderLegalContent(content: string) {
  return content
    .trim()
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("# ")) return null;
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
      if (line.trim().startsWith("- ")) {
        return (
          <li key={i} className="ml-4 list-disc text-gray-700">
            {line.replace(/^- /, "")}
          </li>
        );
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i}>{line}</p>;
    });
}

export function LegalPage({ type }: { type: "privacy" | "terms" | "license" }) {
  const content =
    type === "privacy" ? PRIVACY : type === "terms" ? TERMS : LICENSE_TEXT;
  const title =
    type === "privacy"
      ? "Privacy Policy"
      : type === "terms"
        ? "Terms & Conditions"
        : "License";

  return (
    <article className="prose prose-gray mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">{title}</h1>
      <p className="mb-6 text-xs text-gray-500">
        This summary is provided for convenience. The authoritative legal text for the open-source
        repository is{" "}
        <a
          href="https://github.com/chayprabs/graphql-breaking-changes/blob/main/PRIVACY_POLICY.md"
          className="text-blue-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          PRIVACY_POLICY.md
        </a>
        ,{" "}
        <a
          href="https://github.com/chayprabs/graphql-breaking-changes/blob/main/TERMS.md"
          className="text-blue-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          TERMS.md
        </a>
        , and{" "}
        <a
          href="https://github.com/chayprabs/graphql-breaking-changes/blob/main/LICENSE"
          className="text-blue-600 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          LICENSE
        </a>{" "}
        on GitHub.
      </p>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700">{renderLegalContent(content)}</div>
    </article>
  );
}
