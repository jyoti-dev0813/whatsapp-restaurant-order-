import { z } from "zod";

const moneyText = z
  .string()
  .trim()
  .max(12, { error: "Amount is too long." });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

export const passwordSchema = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .max(72, { error: "Use at most 72 characters." })
  .regex(/[A-Za-z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

export const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { error: "Enter your name." })
    .max(80, { error: "Name is too long." }),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password." }).max(72),
  nextPath: z.string().optional(),
});

export const cafeSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter the cafe name." }).max(80),
  address: z.string().trim().max(200, { error: "Address is too long." }),
  phone: z.string().trim().max(20, { error: "Phone is too long." }),
  email: z.union([z.literal(""), emailSchema]),
});

export const joinSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{8}$/, { error: "Enter the 8 character invite code." }),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter the cafe name." }).max(80),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(20),
  email: z.union([z.literal(""), emailSchema]),
  taxPercent: z.string().trim().min(1, { error: "Enter a tax percent." }),
  taxLabel: z.string().trim().min(2, { error: "Enter a tax label." }).max(20),
  billPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,8}$/, { error: "Use 2 to 8 letters or numbers." }),
  whatsappCountryCode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{0,3}$/, { error: "Enter a country code such as 91." }),
  receiptFooter: z.string().trim().max(240, { error: "Footer is too long." }),
});

export const menuItemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.union([z.literal(""), z.uuid()]),
  name: z.string().trim().min(1, { error: "Enter an item name." }).max(80),
  description: z.string().trim().max(160),
  priceRupees: moneyText.min(1, { error: "Enter a price." }),
  isAvailable: z.enum(["true", "false"]),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, { error: "Enter a category name." }).max(40),
});

export const placeOrderSchema = z.object({
  clientRequestId: z.uuid({ error: "Order request is invalid. Refresh and try again." }),
  customerName: z.string().trim().min(2, { error: "Enter the customer name." }).max(80),
  customerPhone: z.string().trim().max(20, { error: "Phone number is too long." }),
  discountRupees: z.string().trim().max(12),
  notes: z.string().trim().max(300, { error: "Notes are too long." }),
  items: z
    .array(
      z.object({
        menuItemId: z.uuid(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, { error: "Add at least one item." })
    .max(40, { error: "An order can include at most 40 lines." }),
});

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  notice?: string;
};

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error);
  const fieldErrors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") {
      fieldErrors[key] = messages[0];
    }
  }
  if (Object.keys(fieldErrors).length === 0 && flat.formErrors[0]) {
    fieldErrors.form = flat.formErrors[0];
  }
  return fieldErrors;
}
