import { requireUser } from "@/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
