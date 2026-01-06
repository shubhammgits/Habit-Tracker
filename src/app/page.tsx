import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl glass p-8 md:p-10 shadow-glass animate-fade-in">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            <span className="gradient-text">Daily Habit Tracker</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Secure accounts, daily tracking, streaks, and analytics.
          </p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2.5 smooth-transition hover:opacity-95"
          >
            Create account
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground px-4 py-2.5 smooth-transition hover:bg-secondary/80"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
