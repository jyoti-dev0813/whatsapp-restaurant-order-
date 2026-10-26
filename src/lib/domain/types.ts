export type Role = "owner" | "staff";

export type OrderStatus = "billed" | "whatsapp_opened" | "cancelled";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  cafeId: string | null;
  role: Role | null;
};

export type Actor = SessionUser & {
  cafeId: string;
  role: Role;
};

export type Cafe = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type CafeSettings = {
  cafeId: string;
  currencyCode: "INR";
  taxRateBps: number;
  taxLabel: string;
  receiptFooter: string;
  billPrefix: string;
  nextBillSeq: number;
  whatsappCountryCode: string;
  updatedAt: string;
};

export type MenuCategory = {
  id: string;
  cafeId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export type MenuItem = {
  id: string;
  cafeId: string;
  categoryId: string | null;
  name: string;
  description: string;
  pricePaise: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  cafeId: string;
  name: string;
  phoneE164: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  menuItemId: string | null;
  name: string;
  pricePaise: number;
  quantity: number;
  lineTotalPaise: number;
};

export type OrderDetail = {
  id: string;
  cafeId: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  subtotalPaise: number;
  discountPaise: number;
  taxPaise: number;
  totalPaise: number;
  taxRateBps: number;
  taxLabel: string;
  receiptFooter: string;
  cafeName: string;
  cafeAddress: string;
  cafePhone: string;
  notes: string;
  createdBy: string;
  clientRequestId: string;
  whatsappOpenedAt: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type OrderSummary = Omit<OrderDetail, "items">;

export type StaffInvite = {
  id: string;
  cafeId: string;
  code: string;
  role: "staff";
  createdBy: string;
  expiresAt: string;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
};

export type DashboardStats = {
  todayOrders: number;
  todayRevenuePaise: number;
  monthOrders: number;
  monthRevenuePaise: number;
  recent: OrderSummary[];
};

export type PlaceOrderInput = {
  clientRequestId: string;
  customerName: string;
  customerPhone: string;
  discountPaise: number;
  notes: string;
  items: { menuItemId: string; quantity: number }[];
};

export type MenuItemInput = {
  categoryId: string | null;
  name: string;
  description: string;
  pricePaise: number;
  isAvailable: boolean;
};

export type CafeProfileInput = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

export type SettingsInput = {
  taxRateBps: number;
  taxLabel: string;
  receiptFooter: string;
  billPrefix: string;
  whatsappCountryCode: string;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
