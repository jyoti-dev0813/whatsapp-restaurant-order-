import { OrderComposer } from "@/components/orders/order-composer";
import { loadMenu, loadSettings } from "@/server/data";
import { requireActor } from "@/server/session";

export default async function NewOrderPage() {
  const actor = await requireActor();
  const [{ categories, items }, settings] = await Promise.all([
    loadMenu(actor.cafeId),
    loadSettings(actor.cafeId),
  ]);

  if (!settings) {
    return <p>Cafe settings are missing.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New order</h1>
        <p className="text-sm text-muted">Add items, a customer, and an optional discount. The server saves the final total.</p>
      </div>
      <OrderComposer
        categories={categories}
        items={items}
        taxRateBps={settings.taxRateBps}
        taxLabel={settings.taxLabel}
      />
    </div>
  );
}
