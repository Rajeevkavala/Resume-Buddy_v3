/**
 * Access Control System — Prisma/PostgreSQL based
 * 
 * The whitelist system is deprecated (open registration with Free/Pro tiers).
 * Only isAdmin() is actively used for admin panel access.
 * Whitelist functions are preserved as no-ops for backward compat with admin actions.
 */
import 'server-only';
import { prisma } from '@/lib/db';
import type { WhitelistEntry, AccessCheckResult } from '@/types/admin';

/**
 * Check if user is an admin — checks the User table role field
 */
export async function isAdmin(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check environment variable list (emergency admin access)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    if (adminEmails.includes(normalizedEmail)) {
      return true;
    }
    
    // Check database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { role: true, status: true },
    });

    return user?.role === 'ADMIN' && user?.status === 'ACTIVE';
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/**
 * @deprecated - Open registration, no whitelist needed
 */
export async function checkEmailAccess(email: string): Promise<AccessCheckResult> {
  return { allowed: true, reason: 'Open registration - no whitelist required', role: 'user' };
}

/**
 * @deprecated - Users are now managed via the User table
 */
export async function addToWhitelist(
  email: string,
  addedBy: string,
  role: 'user' | 'admin' = 'user',
  _notes?: string
): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    // Ensure user exists with the given role
    await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { role: role === 'admin' ? 'ADMIN' : 'USER', status: 'ACTIVE' },
      create: { email: normalizedEmail, role: role === 'admin' ? 'ADMIN' : 'USER', status: 'ACTIVE', passwordHash: '' },
    });
    console.log(`Added ${normalizedEmail} (role: ${role}) by ${addedBy}`);
    return true;
  } catch (error) {
    console.error('Error in addToWhitelist:', error);
    return false;
  }
}

/**
 * @deprecated
 */
export async function removeFromWhitelist(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { status: 'SUSPENDED' },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * @deprecated
 */
export async function blockUser(email: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { status: 'SUSPENDED' },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * @deprecated
 */
export async function unblockUser(email: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { status: 'ACTIVE' },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * @deprecated
 */
export async function updateUserRole(email: string, role: 'user' | 'admin'): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { role: role === 'admin' ? 'ADMIN' : 'USER' },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * @deprecated
 */
export async function getAllWhitelistedUsers(): Promise<WhitelistEntry[]> {
  try {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { email: true, role: true, status: true, createdAt: true },
    });
    return users.map(u => ({
      email: u.email,
      role: u.role === 'ADMIN' ? 'admin' : 'user',
      status: u.status === 'ACTIVE' ? 'active' : 'blocked',
      addedBy: 'system',
      addedAt: u.createdAt.toISOString(),
    } as WhitelistEntry));
  } catch {
    return [];
  }
}

/**
 * @deprecated
 */
export async function bulkAddToWhitelist(
  emails: string[],
  addedBy: string,
  role: 'user' | 'admin' = 'user'
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };
  for (const email of emails) {
    const ok = await addToWhitelist(email, addedBy, role);
    (ok ? results.success : results.failed).push(email);
  }
  return results;
}
