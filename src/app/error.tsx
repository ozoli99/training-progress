"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        {error?.digest && (
          <p className="text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
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
    </div>
  );
}
