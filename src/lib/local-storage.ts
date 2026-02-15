
'use client';

import type { AnalysisResult } from './types';
import { sanitizeDataForStorage, safeLocalStorage } from './secure-storage';

const getLocalStorageKey = (userId: string) => `resume_buddy_user_${userId}`;

/**
 * Saves user data to local storage, merging with existing data.
 * This function now handles dot notation for nested objects, like 'qa.General'.
 * Automatically sanitizes data to prevent sensitive information storage.
 */
export const saveUserData = (userId: string, dataToSave: Partial<AnalysisResult> & Record<string, any>) => {
  if (typeof window === 'undefined') return;

  try {
    const key = getLocalStorageKey(userId);
    const existingData = getUserData(userId) || {};
    
    // Create a new object to avoid mutating the existing one directly
    const newData = { ...existingData };

    // Apply the new data
    Object.keys(dataToSave).forEach(keyPath => {
      const value = dataToSave[keyPath];

      // If the value is null, we need to handle nested deletion correctly.
      if (value === null && keyPath.includes('.')) {
        const keys = keyPath.split('.');
        let currentLevel = newData as any;
        for (let i = 0; i < keys.length - 1; i++) {
          if (currentLevel) {
            currentLevel = currentLevel[keys[i]];
          }
        }
        if (currentLevel) {
          delete currentLevel[keys[keys.length - 1]];
        }
      } else if (keyPath.includes('.')) {
        const keys = keyPath.split('.');
        let currentLevel = newData as any;
        for (let i = 0; i < keys.length - 1; i++) {
          currentLevel[keys[i]] = currentLevel[keys[i]] || {};
          currentLevel = currentLevel[keys[i]];
        }
        currentLevel[keys[keys.length - 1]] = value;
      } else {
        (newData as any)[keyPath] = value;
      }
    });

    newData.updatedAt = new Date().toISOString();
    
    // Sanitize data before storing to remove sensitive information
    const sanitizedData = sanitizeDataForStorage(newData);
    
    // Use secure localStorage wrapper
    safeLocalStorage.setItem(key, JSON.stringify(sanitizedData));
  } catch (error) {
    console.error('Error saving data to local storage:', error);
  }
};

/**
 * Retrieves user data from local storage.
 */
export const getUserData = (userId: string): AnalysisResult | null => {
  if (typeof window === 'undefined') return null;

  try {
    const key = getLocalStorageKey(userId);
    // Use secure localStorage wrapper
    const data = safeLocalStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving data from local storage:', error);
    return null;
  }
};

/**
 * Clears all data for a specific user from local storage.
 */
export const clearUserData = (userId: string) => {
  if (typeof window === 'undefined') return;

  try {
    const key = getLocalStorageKey(userId);
    // Use secure localStorage wrapper
    safeLocalStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing data from local storage:', error);
  }
};
