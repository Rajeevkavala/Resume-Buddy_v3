/**
 * Data Persistence Layer — PostgreSQL via Prisma
 * Replaces the old Firestore-based saveData/clearData/updateUserProfileInDb
 * 
 * Maintains the same function signatures so callers (actions.ts) don't change.
 */

import { prisma } from '@/lib/db';
import type { AnalysisResult } from '@/lib/types';

/**
 * Ensure a User record exists for the given Firebase UID.
 * Creates a minimal user if not found (profile details updated elsewhere).
 */
async function ensureUser(userId: string, email?: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    await prisma.user.create({
      data: {
        id: userId,
        email: email || `${userId}@firebase.placeholder`,
        name: null,
        status: 'ACTIVE',
        role: 'USER',
      },
    });
  }
}

/**
 * Save (merge) resume data for a user.
 * Replicates the old Firestore merge behavior:
 *   setDoc(dataRef, { ...data, updatedAt: new Date() }, { merge: true })
 * 
 * Upserts a single "active" ResumeData record per user.
 */
export async function saveData(
  userId: string,
  data: Partial<AnalysisResult> & Record<string, unknown>
): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save data.');
  }

  try {
    // Ensure user exists in PostgreSQL (auto-create if needed during migration)
    await ensureUser(userId);

    // Build update/create payloads
    const updateData: Record<string, unknown> = {};
    const createBase: Record<string, unknown> = {
      userId,
      isActive: true,
    };

    // Map AnalysisResult fields → ResumeData columns
    if (data.resumeText !== undefined) {
      updateData.resumeText = data.resumeText;
      createBase.resumeText = data.resumeText;
    }
    if (data.jobDescription !== undefined) {
      updateData.jobDescription = data.jobDescription;
      createBase.jobDescription = data.jobDescription;
    }
    if (data.jobRole !== undefined) {
      updateData.jobRole = String(data.jobRole);
      createBase.jobRole = String(data.jobRole);
    }
    if (data.jobUrl !== undefined) {
      updateData.jobUrl = data.jobUrl;
      createBase.jobUrl = data.jobUrl;
    }
    if (data.analysis !== undefined) {
      updateData.analysis = data.analysis === null ? null : data.analysis;
      createBase.analysis = data.analysis === null ? null : data.analysis;
      if (data.analysis !== null) {
        updateData.lastAnalyzedAt = new Date();
        createBase.lastAnalyzedAt = new Date();
      }
    }
    if (data.improvements !== undefined) {
      updateData.improvements = data.improvements === null ? null : data.improvements;
      createBase.improvements = data.improvements === null ? null : data.improvements;
    }
    if (data.interview !== undefined) {
      // Store interview data in parsedData JSON column
      const existing = await prisma.resumeData.findFirst({
        where: { userId, isActive: true },
        select: { parsedData: true },
      });
      const existingParsed = (existing?.parsedData as Record<string, unknown>) || {};
      existingParsed.interview = data.interview;
      updateData.parsedData = existingParsed;
      createBase.parsedData = existingParsed;
    }
    if (data.coverLetter !== undefined) {
      // CoverLetter can be a complex object or string — serialize to JSON string
      updateData.coverLetter = data.coverLetter
        ? JSON.stringify(data.coverLetter)
        : null;
      createBase.coverLetter = updateData.coverLetter;
    }

    // Handle QA topic data (e.g., { 'qa.Technical': qaResult })
    // Old Firestore code used dot-notation with merge: true
    const qaUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if (key.startsWith('qa.')) {
        const topic = key.replace('qa.', '');
        qaUpdates[topic] = data[key];
      }
    }

    if (Object.keys(qaUpdates).length > 0 || data.qa !== undefined) {
      if (data.qa === null && Object.keys(qaUpdates).length === 0) {
        // Explicitly clear all QA data
        updateData.qaHistory = null;
        createBase.qaHistory = null;
      } else {
        const existing = await prisma.resumeData.findFirst({
          where: { userId, isActive: true },
          select: { qaHistory: true },
        });
        const existingQa = (existing?.qaHistory as Record<string, unknown>) || {};
        const mergedQa = { ...existingQa, ...qaUpdates };
        if (data.qa !== undefined && data.qa !== null) {
          Object.assign(mergedQa, data.qa);
        }
        updateData.qaHistory = mergedQa;
        createBase.qaHistory = mergedQa;
      }
    }

    // Find existing active record or create a new one
    const existingRecord = await prisma.resumeData.findFirst({
      where: { userId, isActive: true },
      select: { id: true },
    });

    if (existingRecord) {
      await prisma.resumeData.update({
        where: { id: existingRecord.id },
        data: updateData,
      });
    } else {
      await prisma.resumeData.create({
        data: { ...createBase, ...updateData } as any,
      });
    }
  } catch (error) {
    console.error('Error saving resume data:', error);
    throw new Error('Could not save resume data.');
  }
}

/**
 * Clear resume data for a user (soft delete).
 */
export async function clearData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to clear data.');
  }

  try {
    await prisma.resumeData.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  } catch (error) {
    console.error('Error clearing resume data:', error);
    throw new Error('Could not clear resume data.');
  }
}

/**
 * Load the latest active resume data for a user.
 * Returns data in the old AnalysisResult format for backward compatibility.
 */
export async function loadData(
  userId: string
): Promise<AnalysisResult | null> {
  if (!userId) return null;

  try {
    const record = await prisma.resumeData.findFirst({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!record) return null;

    // Reconstruct AnalysisResult from ResumeData columns
    const result: AnalysisResult = {};

    if (record.resumeText) result.resumeText = record.resumeText;
    if (record.jobDescription) result.jobDescription = record.jobDescription;
    if (record.jobRole) result.jobRole = record.jobRole as any;
    if (record.jobUrl) result.jobUrl = record.jobUrl;
    if (record.analysis) result.analysis = record.analysis as any;
    if (record.qaHistory) result.qa = record.qaHistory as any;
    if (record.improvements) result.improvements = record.improvements as any;
    if (record.coverLetter) {
      try {
        result.coverLetter = JSON.parse(record.coverLetter);
      } catch {
        result.coverLetter = record.coverLetter as any;
      }
    }

    // Reconstruct interview from parsedData
    const parsedData = record.parsedData as Record<string, unknown> | null;
    if (parsedData?.interview) {
      result.interview = parsedData.interview as any;
    }

    result.updatedAt = record.updatedAt?.toISOString();

    return result;
  } catch (error) {
    console.error('Error loading resume data:', error);
    return null;
  }
}

/**
 * Update user profile (display name / avatar) in PostgreSQL.
 */
export async function updateUserProfileInDb(
  userId: string,
  data: { displayName?: string; photoURL?: string }
): Promise<void> {
  try {
    // Build the update payload, mapping old field names to Prisma column names
    const updatePayload: Record<string, unknown> = {};
    if (data.displayName !== undefined) updatePayload.name = data.displayName;
    if (data.photoURL !== undefined) updatePayload.avatar = data.photoURL;

    if (Object.keys(updatePayload).length === 0) return;

    // Ensure user exists
    await ensureUser(userId);

    await prisma.user.update({
      where: { id: userId },
      data: updatePayload,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Non-critical — same behavior as old Firestore version
  }
}
