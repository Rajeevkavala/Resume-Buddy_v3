// =============================================================================
// Resume Buddy Monitor v2 — RBAC Unit Tests
// =============================================================================

import { describe, it, expect } from "vitest";
import { hasPermission } from "../src/types/rbac";

describe("RBAC Permissions Guard", () => {
  it("allows SUPER_ADMIN all privileges", () => {
    expect(hasPermission("SUPER_ADMIN", "flags:write")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "apikeys:write")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "incidents:resolve")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "workers:trigger")).toBe(true);
  });

  it("restricts SRE_OPERATOR from destructive actions like API key creation", () => {
    expect(hasPermission("SRE_OPERATOR", "incidents:write")).toBe(true);
    expect(hasPermission("SRE_OPERATOR", "alerts:acknowledge")).toBe(true);
    expect(hasPermission("SRE_OPERATOR", "workers:trigger")).toBe(true);
    expect(hasPermission("SRE_OPERATOR", "apikeys:write")).toBe(false);
  });

  it("restricts READ_ONLY users from triggering mutations", () => {
    expect(hasPermission("READ_ONLY", "metrics:read")).toBe(true);
    expect(hasPermission("READ_ONLY", "incidents:write")).toBe(false);
    expect(hasPermission("READ_ONLY", "workers:trigger")).toBe(false);
    expect(hasPermission("READ_ONLY", "flags:write")).toBe(false);
  });
});
