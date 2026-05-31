import { Github, Globe } from "lucide-react";
import { Outlet, Link } from "react-router-dom";

const GITHUB_URL = "https://github.com/chayprabs/graphql-breaking-changes";
const TWITTER_URL = "https://x.com/chayprabs";
const WEBSITE_URL = "https://www.chaitanyaprabuddha.com";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight text-gray-900">
            GraphQLGuard
          </Link>
          <nav className="flex items-center gap-4" aria-label="External links">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition hover:text-gray-900"
              aria-label="GitHub repository"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href={TWITTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition hover:text-gray-900"
              aria-label="Twitter / X"
            >
              <XIcon className="h-5 w-5" />
            </a>
            <a
              href={WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 transition hover:text-gray-900"
              aria-label="Personal website"
            >
              <Globe className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      <div className="border-b border-gray-100 bg-white/80 px-4 py-3">
        <p className="mx-auto max-w-6xl text-center text-sm leading-relaxed text-gray-600">
          Diff two GraphQL schemas in your browser — classify breaking, dangerous, and safe
          changes.
          <br />
          Validate operation files, run federation composition checks, and export reports — all
          locally, no upload.
        </p>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link to="/privacy" className="hover:text-gray-800">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-gray-800">
            Terms &amp; Conditions
          </Link>
          <Link to="/license" className="hover:text-gray-800">
            License
          </Link>
        </div>
      </footer>
    </div>
  );
}
