/**
 * Access Control System
 * 
 * ⚠️ DEPRECATED - January 2026
 * This whitelist-based access control system is no longer used.
 * The app now uses open registration with subscription-based tiers (Free/Pro).
 * 
 * The isAdmin() function is still used for admin panel access.
 * All other functions (checkEmailAccess, whitelist CRUD) are deprecated.
 * 
 * See: src/app/actions/admin-subscription.ts for new subscription management
 * See: src/lib/types/subscription.ts for tier configuration
 */
import { db } from './firebase';
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { WhitelistEntry, AccessCheckResult } from '@/types/admin';
import { getCachedAccess, setCachedAccess, invalidateAccess } from './whitelist-cache';

/**
 * Convert Firestore Timestamp or Date to ISO string for RSC serialization
 */
function toISOString(value: unknown): string | null {
  if (!value) return null;
  // Handle Firestore Timestamp with toDate method
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  // Handle Date object
  if (value instanceof Date) return value.toISOString();
  // Handle ISO string (passthrough)
  if (typeof value === 'string') return value;
  // Handle raw Firestore Timestamp object {seconds, nanoseconds}
  if (typeof value === 'object' && 'seconds' in value) {
    const ts = value as { seconds: number; nanoseconds?: number };
    return new Date(ts.seconds * 1000).toISOString();
  }
  return null;
}

/**
 * Check if an email is allowed to access the application
 * FAIL-CLOSED: Denies access on any error for security
 * Uses caching to reduce Firestore reads for high traffic
 */
export async function checkEmailAccess(email: string): Promise<AccessCheckResult> {
  try {
    // Validate email input
    if (!email || typeof email !== 'string') {
      return {
        allowed: false,
        reason: 'Invalid email provided.',
      };
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check cache first (reduces Firestore reads for 250+ users)
    const cached = getCachedAccess(normalizedEmail);
    if (cached) {
      return cached;
    }
    
    const whitelistRef = doc(db, 'whitelist', normalizedEmail);
    const whitelistDoc = await getDoc(whitelistRef);

    let result: AccessCheckResult;
    
    if (!whitelistDoc.exists()) {
      result = {
        allowed: false,
        reason: 'Access denied. Your email is not authorized. Please contact the administrator.',
      };
    } else {
      const data = whitelistDoc.data() as WhitelistEntry;

      if (data.status === 'blocked') {
        result = {
          allowed: false,
          reason: 'Your account has been blocked. Please contact the administrator.',
        };
      } else if (data.status !== 'active') {
        result = {
          allowed: false,
          reason: 'Your account is not active. Please contact the administrator.',
        };
      } else {
        result = {
          allowed: true,
          reason: 'Access granted',
          role: data.role,
        };
      }
    }
    
    // Cache the result to reduce future Firestore reads
    setCachedAccess(normalizedEmail, result);
    return result;
  } catch (error) {
    console.error('Access check error:', error);
    // FAIL-CLOSED: Deny access on any error for security
    return {
      allowed: false,
      reason: 'Unable to verify access. Please try again or contact the administrator.',
    };
  }
}

/**
 * Add an email to the whitelist
 */
export async function addToWhitelist(
  email: string,
  addedBy: string,
  role: 'user' | 'admin' = 'user',
  notes?: string
): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const whitelistRef = doc(db, 'whitelist', normalizedEmail);

    await setDoc(whitelistRef, {
      email: normalizedEmail,
      addedAt: new Date(),
      addedBy,
      role,
      status: 'active',
      notes: notes || '',
    });

    // Invalidate cache for this email
    invalidateAccess(normalizedEmail);
    
    console.log(`✅ Added ${normalizedEmail} to whitelist`);
    return true;
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    return false;
  }
}

/**
 * Remove an email from the whitelist
 */
export async function removeFromWhitelist(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const whitelistRef = doc(db, 'whitelist', normalizedEmail);
    await deleteDoc(whitelistRef);
    
    // Invalidate cache for this email
    invalidateAccess(normalizedEmail);
    
    console.log(`🗑️ Removed ${normalizedEmail} from whitelist`);
    return true;
  } catch (error) {
    console.error('Error removing from whitelist:', error);
    return false;
  }
}

/**
 * Block a user (keep in whitelist but prevent access)
 */
export async function blockUser(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const whitelistRef = doc(db, 'whitelist', normalizedEmail);
    await updateDoc(whitelistRef, { status: 'blocked' });
    
    // Invalidate cache for this email
    invalidateAccess(normalizedEmail);
    
    console.log(`🚫 Blocked user: ${normalizedEmail}`);
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const whitelistRef = doc(db, 'whitelist', normalizedEmail);
    await updateDoc(whitelistRef, { status: 'active' });
    
    // Invalidate cache for this email
    invalidateAccess(normalizedEmail);
    
    console.log(`✅ Unblocked user: ${normalizedEmail}`);
    return true;
  } catch (error) {
    console.error('Error unblocking user:', error);
    return false;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(email: string, role: 'user' | 'admin'): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const whitelistRef = doc(db, 'whitelist', normalizedEmail);
    await updateDoc(whitelistRef, { role });
    
    // Invalidate cache for this email
    invalidateAccess(normalizedEmail);
    
    console.log(`👤 Updated role for ${normalizedEmail} to ${role}`);
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

/**
 * Get all whitelisted users
 */
export async function getAllWhitelistedUsers(): Promise<WhitelistEntry[]> {
  try {
    const whitelistRef = collection(db, 'whitelist');
    const snapshot = await getDocs(whitelistRef);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        email: data.email,
        role: data.role,
        status: data.status,
        addedBy: data.addedBy,
        addedAt: toISOString(data.addedAt) || new Date().toISOString(),
        notes: data.notes,
      } as unknown as WhitelistEntry;
    });
  } catch (error) {
    console.error('Error fetching whitelist:', error);
    return [];
  }
}

/**
 * Check if user is an admin
 * Checks the 'admins' collection (not whitelist)
 */
export async function isAdmin(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // First check environment variable list (for emergency admin access)
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
    if (adminEmails.includes(normalizedEmail)) {
      return true;
    }
    
    // Check Firestore admins collection
    const adminRef = doc(db, 'admins', normalizedEmail);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists()) return false;

    const data = adminDoc.data();
    return data?.active === true;
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
}

/**
 * Get a single whitelist entry
 */
export async function getWhitelistEntry(email: string): Promise<WhitelistEntry | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const whitelistRef = doc(db, 'whitelist', normalizedEmail);
    const whitelistDoc = await getDoc(whitelistRef);

    if (!whitelistDoc.exists()) return null;

    const data = whitelistDoc.data();
    return {
      email: data.email,
      role: data.role,
      status: data.status,
      addedBy: data.addedBy,
      addedAt: toISOString(data.addedAt) || new Date().toISOString(),
      notes: data.notes,
    } as unknown as WhitelistEntry;
  } catch (error) {
    console.error('Error fetching whitelist entry:', error);
    return null;
  }
}

/**
 * Bulk add users to whitelist
 */
export async function bulkAddToWhitelist(
  emails: string[],
  addedBy: string,
  role: 'user' | 'admin' = 'user'
): Promise<{ success: string[]; failed: string[] }> {
  const results = { success: [] as string[], failed: [] as string[] };

  for (const email of emails) {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      results.failed.push(email);
      continue;
    }

    const success = await addToWhitelist(normalizedEmail, addedBy, role);
    if (success) {
      results.success.push(normalizedEmail);
    } else {
      results.failed.push(email);
    }
  }

  return results;
}
