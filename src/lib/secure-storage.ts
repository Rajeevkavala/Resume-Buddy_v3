'use client';

/**
 * Secure Storage Utility
 * 
 * This utility provides secure storage mechanisms that avoid exposing
 * sensitive data in IndexedDB or localStorage where it can be easily accessed.
 */

// List of sensitive keys that should never be stored in client-side storage
// Note: We exclude Firebase auth-related keys to prevent logout on refresh
const SENSITIVE_KEYS = [
  'secret',
  'password',
  'private',
  'genai',
  'openai'
];

// Session-only storage for sensitive data (cleared when tab closes)
class SecureSessionStorage {
  private storage = new Map<string, any>();
  
  set(key: string, value: any): void {
    // Only store in memory, never persist
    this.storage.set(key, value);
  }
  
  get(key: string): any {
    return this.storage.get(key);
  }
  
  remove(key: string): void {
    this.storage.delete(key);
  }
  
  clear(): void {
    this.storage.clear();
  }
  
  // Check if key contains sensitive information
  private isSensitiveKey(key: string): boolean {
    const keyLower = key.toLowerCase();
    return SENSITIVE_KEYS.some(sensitiveKey => 
      keyLower.includes(sensitiveKey.toLowerCase())
    );
  }
}

export const secureSessionStorage = new SecureSessionStorage();

/**
 * Sanitizes data by removing sensitive information before storage
 */
export const sanitizeDataForStorage = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForStorage(item));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive keys entirely
    if (isSensitiveKey(key)) {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object') {
      const sanitizedValue = sanitizeDataForStorage(value);
      // Only include if the sanitized value has content
      if (Object.keys(sanitizedValue).length > 0) {
        sanitized[key] = sanitizedValue;
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Checks if a key contains sensitive information
 */
export const isSensitiveKey = (key: string): boolean => {
  const keyLower = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitiveKey => 
    keyLower.includes(sensitiveKey.toLowerCase())
  );
};

/**
 * Safe localStorage wrapper that prevents sensitive data storage
 */
export const safeLocalStorage = {
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Parse and sanitize JSON data
      const parsedValue = JSON.parse(value);
      const sanitizedValue = sanitizeDataForStorage(parsedValue);
      
      // Only store if there's meaningful content after sanitization
      if (Object.keys(sanitizedValue).length > 0) {
        localStorage.setItem(key, JSON.stringify(sanitizedValue));
      }
    } catch {
      // If not JSON, check if key itself is sensitive
      if (!isSensitiveKey(key)) {
        localStorage.setItem(key, value);
      }
    }
  },
  
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  }
};

/**
 * Clears all sensitive data from browser storage
 * Note: This no longer clears Firebase auth data to prevent logout on refresh
 */
export const clearSensitiveData = () => {
  if (typeof window === 'undefined') return;
  
  // Clear secure session storage
  secureSessionStorage.clear();
  
  // Clear sensitive items from localStorage (excluding Firebase auth data)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && isSensitiveKey(key)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Note: We no longer clear Firebase IndexedDB to prevent logout on refresh
  // Firebase handles its own auth persistence securely
};

/**
 * Initialize secure storage on app start
 */
export const initializeSecureStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Note: We no longer clear sensitive data on initialization to prevent auth issues
  // Only clear on explicit logout or suspicious activity
  
  // Set up cleanup on page unload (only for session data, not auth data)
  window.addEventListener('beforeunload', () => {
    secureSessionStorage.clear();
  });
  
  // Clear secure session storage on extended tab inactivity
  let lastFocusTime = Date.now();
  window.addEventListener('focus', () => {
    const now = Date.now();
    // If tab was unfocused for more than 30 minutes, clear session data only
    if (now - lastFocusTime > 30 * 60 * 1000) {
      secureSessionStorage.clear();
    }
    lastFocusTime = now;
  });
  
  window.addEventListener('blur', () => {
    lastFocusTime = Date.now();
  });
};