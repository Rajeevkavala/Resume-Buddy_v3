
import { doc, setDoc, getDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';
import type { AnalysisResult } from './types';

export const createUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create new user profile
    const { displayName, email, photoURL } = user;
    try {
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        status: 'active',
        role: 'user',
        apiUsage: {
          dailyCount: 0,
          monthlyCount: 0,
          totalCount: 0,
          lastReset: serverTimestamp(),
        },
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Could not create user profile.');
    }
  } else {
    // Update lastLogin for existing users
    try {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating lastLogin:', error);
      // Non-critical error, don't throw
    }
  }
};

export const updateUserProfileInDb = async (userId: string, data: { displayName?: string; photoURL?: string }) => {
    const userRef = doc(db, 'users', userId);
    try {
        await updateDoc(userRef, data);
    } catch (error) {
        console.error('Error updating user profile in Firestore:', error);
        // It's okay if this fails, as the auth profile is the source of truth
    }
};

export const saveData = async (
  userId: string,
  data: Partial<AnalysisResult>
) => {
  if (!userId) {
    throw new Error('User ID is required to save data.');
  }
  try {
    const dataRef = doc(db, `users/${userId}/resumeData`, 'latest');
    await setDoc(dataRef, { ...data, updatedAt: new Date() }, { merge: true });
  } catch (error) {
    console.error('Error saving resume data:', error);
    throw new Error('Could not save resume data.');
  }
};

export const clearData = async (userId: string) => {
   if (!userId) {
    throw new Error('User ID is required to clear data.');
  }
  try {
    const dataRef = doc(db, `users/${userId}/resumeData`, 'latest');
    await deleteDoc(dataRef);
  } catch (error) {
    console.error('Error clearing resume data:', error);
    throw new Error('Could not clear resume data.');
  }
}

export const loadData = async (
  userId: string
): Promise<AnalysisResult | null> => {
  if (!userId) return null;

  try {
    const dataRef = doc(db, `users/${userId}/resumeData`, 'latest');
    const docSnap = await getDoc(dataRef);

    if (docSnap.exists()) {
      return docSnap.data() as AnalysisResult;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error loading resume data:', error);
    return null;
  }
};

// ============ Daily Usage Tracking for Rate Limiting ============

interface DailyUsageData {
  count: number;
  date: string; // YYYY-MM-DD format
  lastUpdated: Date;
}

/**
 * Get the current date string in YYYY-MM-DD format (local timezone)
 * Uses local time to ensure limits reset at midnight local time
 */
function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get daily usage from Firestore
 */
export async function getDailyUsage(userId: string): Promise<DailyUsageData> {
  if (!userId) {
    return { count: 0, date: getCurrentDateString(), lastUpdated: new Date() };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const apiUsage = data.apiUsage || {};
      const today = getCurrentDateString();
      
      // Check if the stored date is today
      if (apiUsage.dailyDate === today) {
        return {
          count: apiUsage.dailyCount || 0,
          date: today,
          lastUpdated: apiUsage.lastUpdated?.toDate?.() || new Date(),
        };
      } else {
        // It's a new day, reset the count
        return { count: 0, date: today, lastUpdated: new Date() };
      }
    }
    
    return { count: 0, date: getCurrentDateString(), lastUpdated: new Date() };
  } catch (error) {
    console.error('Error getting daily usage:', error);
    return { count: 0, date: getCurrentDateString(), lastUpdated: new Date() };
  }
}

/**
 * Increment daily usage in Firestore
 */
export async function incrementDailyUsageInDb(userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    const userRef = doc(db, 'users', userId);
    const today = getCurrentDateString();

    // Use a transaction to avoid lost updates when multiple AI calls happen close together.
    const newCount = await runTransaction(db as any, async (tx) => {
      const snap = await tx.get(userRef);
      const apiUsage = snap.exists() ? (snap.data() as any).apiUsage || {} : {};

      const isSameDay = apiUsage.dailyDate === today;
      const currentCount = typeof apiUsage.dailyCount === 'number' ? apiUsage.dailyCount : 0;
      const nextCount = isSameDay ? currentCount + 1 : 1;

      if (!snap.exists()) {
        // Create the document if missing (should be rare, but keeps rate-limit robust).
        tx.set(userRef, {
          apiUsage: {
            dailyCount: nextCount,
            dailyDate: today,
            lastUpdated: serverTimestamp(),
            totalCount: 1,
          },
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          status: 'active',
          role: 'user',
        });
        return nextCount;
      }

      // Atomic updates; dailyCount resets on new day.
      tx.update(userRef, {
        'apiUsage.dailyDate': today,
        'apiUsage.lastUpdated': serverTimestamp(),
        'apiUsage.totalCount': increment(1),
        'apiUsage.dailyCount': isSameDay ? increment(1) : 1,
      });

      return nextCount;
    });

    return newCount;
  } catch (error) {
    console.error('Error incrementing daily usage:', error);
    return 0;
  }
}

/**
 * Reset daily usage for a user (admin function)
 */
export async function resetDailyUsageInDb(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'apiUsage.dailyCount': 0,
      'apiUsage.dailyDate': getCurrentDateString(),
      'apiUsage.lastUpdated': serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resetting daily usage:', error);
  }
}
