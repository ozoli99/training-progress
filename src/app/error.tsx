"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const showDevDetails = process.env.NODE_ENV !== "production";

  useEffect(() => {
    console.error(error);
  }, [error]);

  const digestLabel = useMemo(
    () => (error?.digest ? `Error ID: ${error.digest}` : "Unexpected Error"),
    [error?.digest]
  );

  async function copyDigest() {
    if (!error?.digest) return;
    await navigator.clipboard.writeText(error.digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,hsl(var(--primary)/.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]">
          <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:28px_28px] opacity-50" />
        </div>
      </div>
      <main className="mx-auto grid max-w-2xl place-items-center px-4 py-16">
        <div className="w-full rounded-2xl border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/50 shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="mx-auto flex max-w-none flex-col items-center text-center">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Something went wrong
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We hit an unexpected error while rendering this page. You can
                try again or head back home.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="truncate">{digestLabel}</span>
                {error?.digest && (
                  <button
                    onClick={copyDigest}
                    className="ml-auto rounded border px-2 py-1 text-foreground hover:bg-accent"
                    aria-label="Copy Error ID to clipboard"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={() => reset()}
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-accent"
                >
                  Try again
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
                >
                  Go home
                </Link>
                <a
                  href={`mailto:support@atlas.app?subject=Atlas%20Error%20Report&body=${encodeURIComponent(
                    `Hi,\n\nI encountered an error.\n\n${digestLabel}\n\nWhat I was doing:\n- \n\nSteps to reproduce:\n1. \n2. \n3. \n`
                  )}`}
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm hover:bg-accent"
                >
                  Report issue
                </a>
              </div>
              {showDevDetails && (
                <details className="mt-6 w-full rounded-md border bg-muted/40 p-4 text-left">
                  <summary className="cursor-pointer select-none text-sm font-medium text-foreground">
                    Technical details
                  </summary>
                  <div className="mt-3 overflow-auto rounded-md bg-background p-3 text-xs leading-relaxed">
                    <pre className="whitespace-pre-wrap break-words">
                      {String(error?.stack || error?.message || "No stack")}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          If the problem persists, include the Error ID when contacting support.
        </p>
      </main>
    </div>
  );
}
