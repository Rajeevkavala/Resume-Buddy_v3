import { useEffect } from 'react';

/**
 * Hook to dynamically update the page title
 * @param title - The title to set for the page
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | ResumeBuddy`;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
