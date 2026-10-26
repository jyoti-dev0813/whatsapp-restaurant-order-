"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">The last action could not be finished. Try again.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-4 inline-flex min-h-11 w-fit items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground"
      >
        Try again
      </button>
    </main>
  );
}
