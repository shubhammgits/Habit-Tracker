import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md glass p-7 shadow-glass">
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you requested doesn’t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2.5 smooth-transition hover:opacity-95"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
