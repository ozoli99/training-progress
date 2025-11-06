import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-semibold">404 — Page not found</h1>
        <p className="text-muted-foreground">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-md border px-3 py-2 hover:bg-accent transition"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
