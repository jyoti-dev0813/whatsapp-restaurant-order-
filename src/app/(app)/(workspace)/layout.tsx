import { AppShell } from "@/components/app-shell";
import { isSupabaseConfigured } from "@/lib/config";
import { loadCafe } from "@/server/data";
import { requireActor } from "@/server/session";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const cafe = await loadCafe(actor.cafeId);

  if (!cafe) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Cafe record is missing</h1>
        <p className="mt-2 text-sm text-muted">Sign out and sign in again. If this persists, check the database.</p>
      </main>
    );
  }

  return (
    <AppShell cafeName={cafe.name} fullName={actor.fullName} role={actor.role} demo={!isSupabaseConfigured()}>
      {children}
    </AppShell>
  );
}
