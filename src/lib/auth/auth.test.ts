import { describe, expect, it } from "vitest";

import { canManageMenu, canManageSettings } from "@/lib/auth/permissions";
import { safeNextPath } from "@/lib/auth/paths";
import { openSession, sealSession } from "@/lib/auth/session-crypto";
import { fieldErrorsFrom, signupSchema } from "@/lib/validation/schemas";

describe("auth helpers", () => {
  it("round-trips a signed session and rejects tampering", async () => {
    const secret = "test-secret-that-is-long-enough-32";
    const token = await sealSession({ uid: "user-1", exp: 2_000_000_000 }, secret);
    expect(await openSession(token, secret, 1_900_000_000)).toEqual({
      uid: "user-1",
      exp: 2_000_000_000,
    });
    expect(await openSession(token, secret, 2_000_000_000)).toBeNull();
    expect(await openSession(`${token}x`, secret, 1_900_000_000)).toBeNull();
  });

  it("keeps staff from managing the menu or settings", () => {
    expect(canManageMenu("staff")).toBe(false);
    expect(canManageSettings("staff")).toBe(false);
    expect(canManageMenu("owner")).toBe(true);
  });

  it("ignores external redirect targets", () => {
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/orders/new")).toBe("/orders/new");
  });

  it("returns a field error for a short password", () => {
    const parsed = signupSchema.safeParse({
      fullName: "Asha",
      email: "asha@example.com",
      password: "short",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(fieldErrorsFrom(parsed.error).password).toMatch(/8 characters/);
    }
  });
});
