import { SettingsManager } from "@/components/settings/settings-manager";
import { canManageSettings } from "@/lib/auth/permissions";
import { loadCafe, loadInvites, loadSettings } from "@/server/data";
import { requireActor } from "@/server/session";

export default async function SettingsPage() {
  const actor = await requireActor();
  const [cafe, settings, invites] = await Promise.all([
    loadCafe(actor.cafeId),
    loadSettings(actor.cafeId),
    loadInvites(actor),
  ]);

  if (!cafe || !settings) {
    return <p>Cafe settings are missing.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted">Tax, receipt text, and staff invites apply only to this cafe.</p>
      </div>
      <SettingsManager
        cafe={cafe}
        settings={settings}
        invites={invites}
        canEdit={canManageSettings(actor.role)}
      />
    </div>
  );
}
