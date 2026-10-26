import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:opacity-90",
        secondary: "border border-border bg-card text-foreground hover:bg-background",
        ghost: "text-foreground hover:bg-background",
        danger: "bg-danger text-white hover:opacity-90",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  className,
  variant,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ variant }), className)} {...props} />;
}
