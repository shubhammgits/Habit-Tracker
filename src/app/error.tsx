"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md glass p-7 shadow-glass">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {process.env.NODE_ENV === "development" ? error.message : "Please try again."}
          </p>
          <button
            onClick={reset}
            className="mt-6 w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 smooth-transition hover:opacity-95"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
