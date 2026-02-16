'use server';

/**
 * Admin Settings Actions — Prisma/PostgreSQL based
 *
 * Settings are stored in Postgres (singleton row) so changes made in the Admin UI
 * persist across reloads and across Next.js server workers.
 */

import { verifyAdmin } from './admin';
import { prisma } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionSettings {
  priceINR: number;
  pricePaise: number;
  durationDays: number;
  isTestMode: boolean;
  testPriceINR: number;
  testPricePaise: number;
  currency: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AppSettings {
  subscription: SubscriptionSettings;
}

function getDefaultSettingsFromEnv(): Omit<SubscriptionSettings, 'updatedAt' | 'updatedBy'> {
  const priceINR = parseInt(process.env.SUBSCRIPTION_PRICE_INR || '99');
  const testPriceINR = parseInt(process.env.SUBSCRIPTION_TEST_PRICE_INR || '5');
  const durationDays = parseInt(process.env.SUBSCRIPTION_DURATION_DAYS || '30');
  const isTestMode = process.env.SUBSCRIPTION_TEST_MODE === 'true';

  return {
    priceINR,
    pricePaise: priceINR * 100,
    durationDays,
    isTestMode,
    testPriceINR,
    testPricePaise: testPriceINR * 100,
    currency: 'INR',
  };
}

async function getOrCreateSubscriptionConfig() {
  const defaults = getDefaultSettingsFromEnv();
  return await prisma.subscriptionConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      priceINR: defaults.priceINR,
      pricePaise: defaults.pricePaise,
      testPriceINR: defaults.testPriceINR,
      testPricePaise: defaults.testPricePaise,
      durationDays: defaults.durationDays,
      isTestMode: defaults.isTestMode,
      currency: defaults.currency,
      updatedBy: 'system',
    },
  });
}

function toSubscriptionSettingsRow(row: Awaited<ReturnType<typeof getOrCreateSubscriptionConfig>>): SubscriptionSettings {
  return {
    priceINR: row.priceINR,
    pricePaise: row.pricePaise,
    durationDays: row.durationDays,
    isTestMode: row.isTestMode,
    testPriceINR: row.testPriceINR,
    testPricePaise: row.testPricePaise,
    currency: row.currency,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy ?? undefined,
  };
}

// ============================================================================
// Get Settings
// ============================================================================

export async function getSubscriptionSettingsAction(): Promise<{
  success: boolean;
  data?: SubscriptionSettings;
  message?: string;
}> {
  try {
    const row = await getOrCreateSubscriptionConfig();
    return { success: true, data: toSubscriptionSettingsRow(row) };
  } catch (error) {
    console.error('Error loading subscription settings:', error);
    return { success: false, message: 'Failed to load settings' };
  }
}

export async function getActivePriceAction(): Promise<{
  success: boolean;
  data?: { priceINR: number; pricePaise: number; durationDays: number; isTestMode: boolean };
  message?: string;
}> {
  try {
    const s = await getOrCreateSubscriptionConfig();
    return {
      success: true,
      data: {
        priceINR: s.isTestMode ? s.testPriceINR : s.priceINR,
        pricePaise: s.isTestMode ? s.testPricePaise : s.pricePaise,
        durationDays: s.durationDays,
        isTestMode: s.isTestMode,
      },
    };
  } catch (error) {
    console.error('Error loading active price:', error);
    return { success: false, message: 'Failed to load active price' };
  }
}

// ============================================================================
// Update Settings (Admin Only)
// ============================================================================

export async function updateSubscriptionSettingsAction(
  adminEmail: string,
  settings: Partial<SubscriptionSettings>
): Promise<{ success: boolean; message: string }> {
  try {
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }

    const current = await getOrCreateSubscriptionConfig();

    const updated: SubscriptionSettings = {
      priceINR: settings.priceINR ?? current.priceINR,
      pricePaise: settings.pricePaise ?? (settings.priceINR ? settings.priceINR * 100 : current.pricePaise),
      durationDays: settings.durationDays ?? current.durationDays,
      isTestMode: settings.isTestMode ?? current.isTestMode,
      testPriceINR: settings.testPriceINR ?? current.testPriceINR,
      testPricePaise: settings.testPricePaise ?? (settings.testPriceINR ? settings.testPriceINR * 100 : current.testPricePaise),
      currency: settings.currency ?? current.currency,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };

    if (updated.priceINR < 1) return { success: false, message: 'Production price must be at least ₹1' };
    if (updated.durationDays < 1 || updated.durationDays > 365) return { success: false, message: 'Duration must be between 1 and 365 days' };
    if (updated.testPriceINR < 1) return { success: false, message: 'Test price must be at least ₹1' };

    await prisma.subscriptionConfig.update({
      where: { id: 1 },
      data: {
        priceINR: updated.priceINR,
        pricePaise: updated.pricePaise,
        testPriceINR: updated.testPriceINR,
        testPricePaise: updated.testPricePaise,
        durationDays: updated.durationDays,
        isTestMode: updated.isTestMode,
        currency: updated.currency,
        updatedBy: adminEmail,
      },
    });

    return {
      success: true,
      message: `Settings updated. ${updated.isTestMode ? 'Test mode ON' : 'Production mode ON'}`,
    };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, message: 'Failed to update settings' };
  }
}

export async function toggleTestModeAction(
  adminEmail: string
): Promise<{ success: boolean; message: string; isTestMode?: boolean }> {
  try {
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) return { success: false, message: 'Unauthorized: Admin access required' };

    const current = await getOrCreateSubscriptionConfig();
    const newTestMode = !current.isTestMode;
    await updateSubscriptionSettingsAction(adminEmail, { isTestMode: newTestMode });

    return {
      success: true,
      message: newTestMode ? 'Test mode enabled (₹5 pricing)' : 'Production mode enabled (full pricing)',
      isTestMode: newTestMode,
    };
  } catch (error) {
    console.error('Error toggling test mode:', error);
    return { success: false, message: 'Failed to toggle test mode' };
  }
}
