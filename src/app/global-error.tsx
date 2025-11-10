"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh grid place-items-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">App error</h1>
          <p className="text-muted-foreground">
            {process.env.NODE_ENV === "development"
              ? error.message
              : "Please try again."}
          </p>
          <div className="space-x-2">
            <button
              onClick={() => reset()}
              className="rounded-md border px-3 py-2"
            >
              Try again
            </button>
            <a href="/" className="rounded-md border px-3 py-2 inline-block">
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
