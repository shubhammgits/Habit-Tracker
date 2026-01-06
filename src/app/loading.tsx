export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md glass p-7 shadow-glass animate-pulse-soft">
        <div className="h-6 w-40 rounded bg-foreground/10" />
        <div className="mt-4 h-3 w-64 rounded bg-foreground/10" />
        <div className="mt-8 h-10 w-full rounded bg-foreground/10" />
        <div className="mt-3 h-10 w-full rounded bg-foreground/10" />
      </div>
    </main>
  );
}
