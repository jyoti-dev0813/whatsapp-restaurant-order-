"use client";

import { useState } from "react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { Badge, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { formatInr } from "@/lib/money";
import type { MenuCategory, MenuItem } from "@/lib/domain/types";
import {
  createCategoryAction,
  deleteCategoryAction,
  deleteMenuItemAction,
  saveMenuItemAction,
} from "@/server/menu-actions";
import type { ActionState } from "@/lib/validation/schemas";

const initial: ActionState = {};

export function MenuManager({
  categories,
  items,
  canEdit,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  canEdit: boolean;
}) {
  const [state, action] = useActionState(saveMenuItemAction, initial);
  const [categoryState, categoryAction] = useActionState(createCategoryAction, initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = items.find((item) => item.id === editingId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card>
          <h2 className="text-lg font-semibold">{editing ? "Edit item" : "Add item"}</h2>
          {canEdit ? (
            <form key={editing?.id ?? "new"} action={action} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing?.name ?? ""} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="categoryId">Category</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  defaultValue={editing?.categoryId ?? ""}
                  className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priceRupees">Price in rupees</Label>
                <Input
                  id="priceRupees"
                  name="priceRupees"
                  inputMode="decimal"
                  defaultValue={editing ? paiseInput(editing.pricePaise) : ""}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="isAvailable">Availability</Label>
                <select
                  id="isAvailable"
                  name="isAvailable"
                  defaultValue={editing ? String(editing.isAvailable) : "true"}
                  className="min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>
              {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
              {state.fieldErrors
                ? Object.values(state.fieldErrors).map((message) => (
                    <p key={message} className="text-sm text-danger">
                      {message}
                    </p>
                  ))
                : null}
              <div className="flex gap-2">
                <SubmitButton>{editing ? "Update item" : "Add item"}</SubmitButton>
                {editing ? (
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted">Only the owner can change the menu. You can still take orders.</p>
          )}
        </Card>
        {canEdit ? (
          <Card>
            <h2 className="font-semibold">Category</h2>
            <form action={categoryAction} className="mt-3 flex gap-2">
              <Input name="name" aria-label="Category name" placeholder="Drinks" />
              <SubmitButton variant="secondary">Add</SubmitButton>
            </form>
            {categoryState.error ? <p className="mt-2 text-sm text-danger">{categoryState.error}</p> : null}
          </Card>
        ) : null}
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <p className="font-medium">Menu is empty</p>
            <p className="mt-1 text-sm text-muted">Add the first item to start billing.</p>
          </Card>
        ) : (
          items.map((item) => {
            const category = categories.find((entry) => entry.id === item.categoryId);
            return (
              <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.name}</p>
                    <Badge tone={item.isAvailable ? "success" : "warning"}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {category?.name ?? "No category"} · {formatInr(item.pricePaise)}
                  </p>
                  {item.description ? <p className="mt-1 text-sm">{item.description}</p> : null}
                </div>
                {canEdit ? (
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => setEditingId(item.id)}>
                      Edit
                    </Button>
                    <form
                      action={deleteMenuItemAction}
                      onSubmit={(event) => {
                        if (!window.confirm("Delete this menu item? Past bills keep the saved item name and price.")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <SubmitButton variant="danger">Delete</SubmitButton>
                    </form>
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
        {canEdit && categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <form key={category.id} action={deleteCategoryAction}>
                <input type="hidden" name="id" value={category.id} />
                <SubmitButton variant="ghost">Remove {category.name}</SubmitButton>
              </form>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function paiseInput(paise: number) {
  const whole = Math.trunc(paise / 100);
  const fraction = Math.abs(paise % 100);
  if (fraction === 0) return String(whole);
  return `${whole}.${String(fraction).padStart(2, "0")}`;
}
