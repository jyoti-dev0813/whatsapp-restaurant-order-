import { MenuManager } from "@/components/menu/menu-manager";
import { canManageMenu } from "@/lib/auth/permissions";
import { loadMenu } from "@/server/data";
import { requireActor } from "@/server/session";

export default async function MenuPage() {
  const actor = await requireActor();
  const { categories, items } = await loadMenu(actor.cafeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Menu</h1>
        <p className="text-sm text-muted">Prices are saved in paise. Old bills keep the price from the time they were made.</p>
      </div>
      <MenuManager categories={categories} items={items} canEdit={canManageMenu(actor.role)} />
    </div>
  );
}
