import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">That bill or page is not available for this account.</p>
      <Link href="/dashboard" className="mt-4 font-semibold text-accent">
        Back to the dashboard
      </Link>
    </main>
  );
}
