'use server';

/**
 * Admin Settings Actions
 * 
 * Manages configurable settings stored in Firestore:
 * - Subscription pricing (INR)
 * - Pro duration (days)
 * - Other app settings
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { verifyAdmin } from './admin';

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionSettings {
  priceINR: number;           // Price in INR (not paise) - e.g., 99 for ₹99
  pricePaise: number;         // Price in paise for Razorpay - e.g., 9900 for ₹99
  durationDays: number;       // Duration of Pro access in days
  isTestMode: boolean;        // Whether to use test pricing
  testPriceINR: number;       // Test price in INR
  testPricePaise: number;     // Test price in paise
  currency: string;           // Currency code (INR)
  updatedAt?: string;
  updatedBy?: string;
}

export interface AppSettings {
  subscription: SubscriptionSettings;
  // Add more setting categories here as needed
}

// Default settings
const DEFAULT_SUBSCRIPTION_SETTINGS: SubscriptionSettings = {
  priceINR: 99,
  pricePaise: 9900,
  durationDays: 30,
  isTestMode: true,
  testPriceINR: 5,
  testPricePaise: 500,
  currency: 'INR',
};

const SETTINGS_DOC_ID = 'app_settings';
const SETTINGS_COLLECTION = 'config';

// ============================================================================
// Get Settings
// ============================================================================

/**
 * Get current subscription settings
 */
export async function getSubscriptionSettingsAction(): Promise<{
  success: boolean;
  data?: SubscriptionSettings;
  message?: string;
}> {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        success: true,
        data: {
          priceINR: data.subscription?.priceINR ?? DEFAULT_SUBSCRIPTION_SETTINGS.priceINR,
          pricePaise: data.subscription?.pricePaise ?? DEFAULT_SUBSCRIPTION_SETTINGS.pricePaise,
          durationDays: data.subscription?.durationDays ?? DEFAULT_SUBSCRIPTION_SETTINGS.durationDays,
          isTestMode: data.subscription?.isTestMode ?? DEFAULT_SUBSCRIPTION_SETTINGS.isTestMode,
          testPriceINR: data.subscription?.testPriceINR ?? DEFAULT_SUBSCRIPTION_SETTINGS.testPriceINR,
          testPricePaise: data.subscription?.testPricePaise ?? DEFAULT_SUBSCRIPTION_SETTINGS.testPricePaise,
          currency: data.subscription?.currency ?? DEFAULT_SUBSCRIPTION_SETTINGS.currency,
          updatedAt: data.subscription?.updatedAt,
          updatedBy: data.subscription?.updatedBy,
        },
      };
    }
    
    // Return defaults if no settings exist
    return {
      success: true,
      data: DEFAULT_SUBSCRIPTION_SETTINGS,
    };
  } catch (error) {
    console.error('Error fetching subscription settings:', error);
    return {
      success: false,
      message: 'Failed to fetch subscription settings',
    };
  }
}

/**
 * Get the active price based on test mode setting
 */
export async function getActivePriceAction(): Promise<{
  success: boolean;
  data?: {
    priceINR: number;
    pricePaise: number;
    durationDays: number;
    isTestMode: boolean;
  };
  message?: string;
}> {
  try {
    const result = await getSubscriptionSettingsAction();
    
    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || 'Failed to get settings',
      };
    }
    
    const settings = result.data;
    const isTest = settings.isTestMode;
    
    return {
      success: true,
      data: {
        priceINR: isTest ? settings.testPriceINR : settings.priceINR,
        pricePaise: isTest ? settings.testPricePaise : settings.pricePaise,
        durationDays: settings.durationDays,
        isTestMode: isTest,
      },
    };
  } catch (error) {
    console.error('Error getting active price:', error);
    return {
      success: false,
      message: 'Failed to get active price',
    };
  }
}

// ============================================================================
// Update Settings (Admin Only)
// ============================================================================

/**
 * Update subscription settings (admin only)
 */
export async function updateSubscriptionSettingsAction(
  adminEmail: string,
  settings: Partial<SubscriptionSettings>
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Verify admin
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }
    
    // Get current settings
    const currentResult = await getSubscriptionSettingsAction();
    const currentSettings = currentResult.data || DEFAULT_SUBSCRIPTION_SETTINGS;
    
    // Build updated settings
    const updatedSubscription: SubscriptionSettings = {
      priceINR: settings.priceINR ?? currentSettings.priceINR,
      pricePaise: settings.pricePaise ?? (settings.priceINR ? settings.priceINR * 100 : currentSettings.pricePaise),
      durationDays: settings.durationDays ?? currentSettings.durationDays,
      isTestMode: settings.isTestMode ?? currentSettings.isTestMode,
      testPriceINR: settings.testPriceINR ?? currentSettings.testPriceINR,
      testPricePaise: settings.testPricePaise ?? (settings.testPriceINR ? settings.testPriceINR * 100 : currentSettings.testPricePaise),
      currency: settings.currency ?? currentSettings.currency,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };
    
    // Validate settings
    if (updatedSubscription.priceINR < 1) {
      return { success: false, message: 'Production price must be at least ₹1' };
    }
    if (updatedSubscription.durationDays < 1 || updatedSubscription.durationDays > 365) {
      return { success: false, message: 'Duration must be between 1 and 365 days' };
    }
    if (updatedSubscription.testPriceINR < 1) {
      return { success: false, message: 'Test price must be at least ₹1' };
    }
    
    // Save to Firestore
    const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(settingsRef, {
      subscription: updatedSubscription,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return {
      success: true,
      message: `Settings updated successfully. ${updatedSubscription.isTestMode ? 'Test mode is ON' : 'Production mode is ON'}`,
    };
  } catch (error) {
    console.error('Error updating subscription settings:', error);
    return {
      success: false,
      message: 'Failed to update subscription settings',
    };
  }
}

/**
 * Toggle test mode on/off
 */
export async function toggleTestModeAction(
  adminEmail: string
): Promise<{
  success: boolean;
  message: string;
  isTestMode?: boolean;
}> {
  try {
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }
    
    const currentResult = await getSubscriptionSettingsAction();
    const currentSettings = currentResult.data || DEFAULT_SUBSCRIPTION_SETTINGS;
    
    const newTestMode = !currentSettings.isTestMode;
    
    await updateSubscriptionSettingsAction(adminEmail, { isTestMode: newTestMode });
    
    return {
      success: true,
      message: newTestMode ? 'Test mode enabled (₹5 pricing)' : 'Production mode enabled (full pricing)',
      isTestMode: newTestMode,
    };
  } catch (error) {
    console.error('Error toggling test mode:', error);
    return {
      success: false,
      message: 'Failed to toggle test mode',
    };
  }
}
