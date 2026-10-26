"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({
  children,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const status = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={disabled || status.pending}>
      {status.pending ? "Saving..." : children}
    </Button>
  );
}
