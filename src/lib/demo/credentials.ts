export const DEMO_ACCOUNTS = [
  {
    role: "Owner",
    cafe: "Hearth & Co.",
    email: "owner@demo.local",
    password: "owner-demo-123",
  },
  {
    role: "Staff",
    cafe: "Hearth & Co.",
    email: "staff@demo.local",
    password: "staff-demo-123",
  },
  {
    role: "Owner",
    cafe: "Riverbend Cafe",
    email: "other@demo.local",
    password: "other-demo-123",
  },
] as const;

export const DEMO_IDS = {
  hearth: "11111111-1111-4111-8111-111111111111",
  riverbend: "22222222-2222-4222-8222-222222222222",
  owner: "11111111-1111-4111-8111-111111111101",
  staff: "11111111-1111-4111-8111-111111111102",
  other: "22222222-2222-4222-8222-222222222201",
} as const;
