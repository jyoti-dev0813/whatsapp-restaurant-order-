import type {
  Cafe,
  CafeSettings,
  Customer,
  MenuCategory,
  MenuItem,
  OrderDetail,
  StaffInvite,
} from "@/lib/domain/types";

export type DemoUser = {
  id: string;
  email: string;
  fullName: string;
  passwordSalt: string;
  passwordHash: string;
  cafeId: string | null;
  role: "owner" | "staff" | null;
  createdAt: string;
};

export type DemoDatabase = {
  users: DemoUser[];
  cafes: Cafe[];
  settings: CafeSettings[];
  categories: MenuCategory[];
  items: MenuItem[];
  customers: Customer[];
  orders: OrderDetail[];
  invites: StaffInvite[];
};
