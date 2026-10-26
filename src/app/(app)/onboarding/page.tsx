import { redirect } from "next/navigation";

import { OnboardingForms } from "@/components/onboarding-forms";
import { requireUser } from "@/server/session";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.cafeId) redirect("/dashboard");

  return (
    <main className="px-4 py-10">
      <p className="mb-6 text-center text-sm text-muted">Signed in as {user.email}</p>
      <OnboardingForms />
    </main>
  );
}
