import { useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash';

interface AutoSaveOptions {
  key: string;
  data: any;
  delay?: number;
  onSave?: () => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface SavedData {
  data: any;
  timestamp: Date;
}

export function useAutoSave({
  key,
  data,
  delay = 2000,
  onSave,
  onError,
  enabled = true
}: AutoSaveOptions) {
  const lastSavedRef = useRef<string>('');
  const isInitialLoad = useRef(true);

  const saveToStorage = useCallback(async () => {
    if (!enabled) return;
    
    try {
      const dataString = JSON.stringify(data);
      
      // Only save if data has changed and this isn't the initial load
      if (dataString === lastSavedRef.current || isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      // Save to localStorage with timestamp
      const saveData = {
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      localStorage.setItem(key, JSON.stringify(saveData));
      lastSavedRef.current = dataString;
      
      onSave?.();
    } catch (error) {
      console.error('Auto-save failed:', error);
      onError?.(error as Error);
    }
  }, [data, key, onSave, onError, enabled]);

  const debouncedSave = useCallback(
    debounce(saveToStorage, delay),
    [saveToStorage, delay]
  );

  useEffect(() => {
    if (!enabled) return;

    // Prime the hook on first run so subsequent changes are detected/saved.
    if (isInitialLoad.current) {
      try {
        lastSavedRef.current = JSON.stringify(data);
      } catch {
        lastSavedRef.current = '';
      }
      isInitialLoad.current = false;
      return;
    }

    debouncedSave();

    return () => {
      // If the user navigates away quickly after editing, flush pending saves
      // so drafts aren't lost when components unmount.
      debouncedSave.flush();
      debouncedSave.cancel();
    };
  }, [data, debouncedSave, enabled]);

  const loadFromStorage = useCallback((): SavedData | null => {
    try {
      const saved = localStorage.getItem(key);
      
      if (saved) {
        const parsedData = JSON.parse(saved);
        
        // Handle both old format (direct data) and new format (with metadata)
        if (parsedData.data && parsedData.timestamp) {
          return {
            data: parsedData.data,
            timestamp: new Date(parsedData.timestamp)
          };
        } else {
          // Legacy format - just the data
          return {
            data: parsedData,
            timestamp: new Date()
          };
        }
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
      onError?.(error as Error);
    }
    return null;
  }, [key, onError]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
      lastSavedRef.current = '';
      isInitialLoad.current = true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      onError?.(error as Error);
    }
  }, [key, onError]);

  const saveNow = useCallback(async () => {
    debouncedSave.cancel(); // Cancel any pending debounced save
    await saveToStorage();
  }, [debouncedSave, saveToStorage]);

  const hasUnsavedChanges = useCallback(() => {
    try {
      const currentDataString = JSON.stringify(data);
      return currentDataString !== lastSavedRef.current;
    } catch (error) {
      return false;
    }
  }, [data]);

  const getLastSaveTime = useCallback((): Date | null => {
    const saved = loadFromStorage();
    return saved ? saved.timestamp : null;
  }, [loadFromStorage]);

  return {
    loadFromStorage,
    clearStorage,
    saveNow,
    hasUnsavedChanges,
    getLastSaveTime
  };
}

// Hook for managing multiple drafts with different keys
export function useMultipleAutoSave(saves: Omit<AutoSaveOptions, 'onSave' | 'onError'>[], options?: {
  onSave?: (key: string) => void;
  onError?: (key: string, error: Error) => void;
}) {
  const hooks = saves.map(save => 
    useAutoSave({
      ...save,
      onSave: () => options?.onSave?.(save.key),
      onError: (error) => options?.onError?.(save.key, error)
    })
  );

  const clearAll = useCallback(() => {
    hooks.forEach(hook => hook.clearStorage());
  }, [hooks]);

  const saveAllNow = useCallback(async () => {
    await Promise.all(hooks.map(hook => hook.saveNow()));
  }, [hooks]);

  const hasAnyUnsavedChanges = useCallback(() => {
    return hooks.some(hook => hook.hasUnsavedChanges());
  }, [hooks]);

  return {
    hooks,
    clearAll,
    saveAllNow,
    hasAnyUnsavedChanges
  };
}

// Utility hook for warning users about unsaved changes before they leave
export function useUnsavedChangesWarning(hasUnsavedChanges: () => boolean, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, enabled]);
}

// Hook for draft restoration with user confirmation
export function useDraftRestoration(
  key: string,
  onRestore: (data: any) => void,
  options?: {
    maxAge?: number; // Max age in milliseconds
    showPrompt?: boolean;
  }
) {
  const { loadFromStorage } = useAutoSave({ key, data: null, enabled: false });
  const { maxAge = 7 * 24 * 60 * 60 * 1000, showPrompt = true } = options || {}; // Default 7 days

  const checkForDraft = useCallback(() => {
    const saved = loadFromStorage();
    
    if (!saved) return null;

    // Check if draft is too old
    const age = Date.now() - saved.timestamp.getTime();
    if (age > maxAge) {
      localStorage.removeItem(key); // Clean up old draft
      return null;
    }

    return saved;
  }, [loadFromStorage, maxAge, key]);

  const restoreDraft = useCallback((saved: SavedData) => {
    onRestore(saved.data);
  }, [onRestore]);

  const showDraftPrompt = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!showPrompt) {
        resolve(true);
        return;
      }

      const result = window.confirm(
        'We found a previous draft of your work. Would you like to restore it?'
      );
      resolve(result);
    });
  }, [showPrompt]);

  const checkAndPromptRestore = useCallback(async () => {
    const saved = checkForDraft();
    
    if (!saved) return false;

    const shouldRestore = await showDraftPrompt();
    
    if (shouldRestore) {
      restoreDraft(saved);
      return true;
    }

    return false;
  }, [checkForDraft, showDraftPrompt, restoreDraft]);

  return {
    checkForDraft,
    restoreDraft,
    checkAndPromptRestore
  };
}