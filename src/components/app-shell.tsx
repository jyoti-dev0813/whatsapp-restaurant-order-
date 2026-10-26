"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  UtensilsCrossed,
  X,
} from "lucide-react";

import { signOutAction } from "@/server/auth-actions";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders/new", label: "New order", icon: Plus },
  { href: "/orders", label: "Bills", icon: ClipboardList },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(href: string, pathname: string) {
  if (href === "/orders") {
    return pathname === "/orders" || (pathname.startsWith("/orders/") && !pathname.startsWith("/orders/new"));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  cafeName,
  fullName,
  role,
  demo,
  children,
}: {
  cafeName: string;
  fullName: string;
  role: string;
  demo: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {links.map((link) => {
        const active = isActive(link.href, pathname);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
              active ? "bg-white/10 text-white" : "text-sidebar-foreground/80 hover:bg-white/5",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-full md:grid md:grid-cols-[240px_1fr]">
      <aside className="no-print hidden bg-sidebar text-sidebar-foreground md:flex md:min-h-full md:flex-col md:p-4">
        <p className="px-3 pb-6 text-lg font-semibold tracking-tight">CafeBill</p>
        {nav}
        <p className="px-3 pt-6 text-xs text-sidebar-foreground/70">
          <span className="block">{fullName}</span>
          <span className="mt-1 block capitalize">{role}</span>
        </p>
      </aside>
      <div className="min-w-0">
        <header className="no-print sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-border md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-sm text-muted">Cafe</p>
              <p className="font-semibold">{cafeName}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium">
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </form>
        </header>
        {demo ? (
          <p className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 md:px-6">
            Demo mode. Bills are stored in a local file on this computer. They are not saved to Supabase.
          </p>
        ) : null}
        <main className="px-4 py-6 md:px-6">{children}</main>
      </div>
      {open ? (
        <div className="no-print fixed inset-0 z-30 md:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-4 text-sidebar-foreground">
            <div className="mb-4 flex items-center justify-between px-2">
              <p className="text-lg font-semibold">CafeBill</p>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      ) : null}
    </div>
  );
}
