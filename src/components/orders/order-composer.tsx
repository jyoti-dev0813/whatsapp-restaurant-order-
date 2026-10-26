"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";

import { calculateBill } from "@/lib/billing/calculate";
import { formatInr, rupeesToPaise } from "@/lib/money";
import { placeOrderAction } from "@/server/order-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/fields";
import type { MenuCategory, MenuItem } from "@/lib/domain/types";

export function OrderComposer({
  categories,
  items,
  taxRateBps,
  taxLabel,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  taxRateBps: number;
  taxLabel: string;
}) {
  const router = useRouter();
  const requestId = useRef<string | null>(null);
  const lock = useRef(false);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountRupees, setDiscountRupees] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const available = items.filter((item) => item.isAvailable);
  const visible = available.filter((item) => {
    const categoryOk = categoryId === "all" || item.categoryId === categoryId;
    const searchOk = item.name.toLowerCase().includes(search.trim().toLowerCase());
    return categoryOk && searchOk;
  });

  const lines = available
    .filter((item) => cart[item.id])
    .map((item) => ({
      menuItemId: item.id,
      name: item.name,
      pricePaise: item.pricePaise,
      quantity: cart[item.id] ?? 0,
    }));

  const discount = rupeesToPaise(discountRupees, { allowEmpty: true });
  const preview =
    discount.ok && lines.length > 0
      ? calculateBill({
          lines: lines.map((line) => ({ pricePaise: line.pricePaise, quantity: line.quantity })),
          discountPaise: discount.paise,
          taxRateBps,
        })
      : null;

  function setQuantity(id: string, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[id];
      else next[id] = Math.min(99, quantity);
      return next;
    });
  }

  async function submit() {
    if (lock.current) return;
    if (!requestId.current) requestId.current = crypto.randomUUID();
    lock.current = true;
    setPending(true);
    setError(null);
    const result = await placeOrderAction({
      clientRequestId: requestId.current,
      customerName,
      customerPhone,
      discountRupees,
      notes,
      items: lines.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
    });
    setPending(false);
    lock.current = false;
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search menu"
            aria-label="Search menu"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={categoryId === "all"} onClick={() => setCategoryId("all")}>
            All
          </FilterChip>
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              active={categoryId === category.id}
              onClick={() => setCategoryId(category.id)}
            >
              {category.name}
            </FilterChip>
          ))}
        </div>
        {visible.length === 0 ? (
          <Card>
            <p className="font-medium">No available items</p>
            <p className="mt-1 text-sm text-muted">Turn items on from the menu page, or clear the search.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((item) => {
              const quantity = cart[item.id] ?? 0;
              return (
                <Card key={item.id} className="flex flex-col justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    {item.description ? <p className="mt-1 text-sm text-muted">{item.description}</p> : null}
                    <p className="mt-2 text-sm font-medium">{formatInr(item.pricePaise)}</p>
                  </div>
                  {quantity === 0 ? (
                    <Button type="button" onClick={() => setQuantity(item.id, 1)}>
                      Add
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        className="inline-flex size-11 items-center justify-center rounded-xl border border-border"
                        onClick={() => setQuantity(item.id, quantity - 1)}
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="font-semibold">{quantity}</span>
                      <button
                        type="button"
                        className="inline-flex size-11 items-center justify-center rounded-xl border border-border"
                        onClick={() => setQuantity(item.id, quantity + 1)}
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
      <Card className="h-fit space-y-4 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Bill</h2>
        {lines.length === 0 ? <p className="text-sm text-muted">Select items to start a bill.</p> : null}
        <ul className="space-y-2 text-sm">
          {lines.map((line) => (
            <li key={line.menuItemId} className="flex justify-between gap-3">
              <span>
                {line.quantity} x {line.name}
              </span>
              <span>{formatInr(line.pricePaise * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="customerName">Customer name</Label>
          <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone">Phone for WhatsApp</Label>
          <Input
            id="customerPhone"
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            placeholder="10 digit mobile, optional"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount">Discount in rupees</Label>
          <Input
            id="discount"
            inputMode="decimal"
            value={discountRupees}
            onChange={(event) => setDiscountRupees(event.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        {preview && preview.ok ? (
          <dl className="space-y-1 text-sm">
            <Row label="Subtotal" value={formatInr(preview.totals.subtotalPaise)} />
            <Row label="Discount" value={formatInr(preview.totals.discountPaise)} />
            <Row label={taxLabel} value={formatInr(preview.totals.taxPaise)} />
            <Row label="Total" value={formatInr(preview.totals.totalPaise)} strong />
          </dl>
        ) : (
          <p className="text-sm text-danger">{!discount.ok ? discount.error : preview && !preview.ok ? preview.error : ""}</p>
        )}
        <p className="text-xs text-muted">
          The saved bill uses menu prices and tax settings checked on the server. This preview can change if the menu changed.
        </p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="button" className="w-full" disabled={pending || lines.length === 0} onClick={() => void submit()}>
          {pending ? "Saving bill..." : "Save bill"}
        </Button>
      </Card>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-medium ${active ? "bg-accent text-accent-foreground" : "border border-border bg-card"}`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
