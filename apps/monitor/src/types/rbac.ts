// =============================================================================
// Resume Buddy Monitor v2 — RBAC & User Types
// =============================================================================

export type UserRole = "SUPER_ADMIN" | "SRE_OPERATOR" | "READ_ONLY";

export type Permission =
  | "metrics:read"
  | "logs:read"
  | "incidents:read"
  | "incidents:write"
  | "incidents:resolve"
  | "alerts:read"
  | "alerts:acknowledge"
  | "workers:trigger"
  | "settings:read"
  | "settings:write"
  | "flags:read"
  | "flags:write"
  | "apikeys:read"
  | "apikeys:write"
  | "audit:read";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "metrics:read",
    "logs:read",
    "incidents:read",
    "incidents:write",
    "incidents:resolve",
    "alerts:read",
    "alerts:acknowledge",
    "workers:trigger",
    "settings:read",
    "settings:write",
    "flags:read",
    "flags:write",
    "apikeys:read",
    "apikeys:write",
    "audit:read",
  ],
  SRE_OPERATOR: [
    "metrics:read",
    "logs:read",
    "incidents:read",
    "incidents:write",
    "incidents:resolve",
    "alerts:read",
    "alerts:acknowledge",
    "workers:trigger",
    "settings:read",
    "flags:read",
    "audit:read",
  ],
  READ_ONLY: [
    "metrics:read",
    "logs:read",
    "incidents:read",
    "alerts:read",
    "settings:read",
    "flags:read",
  ],
};

export interface MonitorUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  lastActiveAt?: string;
  createdAt: string;
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
