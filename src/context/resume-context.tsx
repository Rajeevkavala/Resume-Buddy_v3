
'use client';

import { createContext, useState, ReactNode, Dispatch, SetStateAction, useEffect, startTransition, useCallback, useContext } from 'react';
import { getUserData, saveUserData } from '@/lib/local-storage';
import { useAuth } from './auth-context';
import { loadResumeDataAction } from '@/app/actions';
import type { AnalysisResult, QATopic, JobRole } from '@/lib/types';
import type { GenerateInterviewQuestionsOutput } from '@/ai/flows/generate-interview-questions';
import type { GenerateResumeQAOutput } from '@/ai/flows/generate-resume-qa';
import type { AnalyzeResumeContentOutput } from '@/ai/flows/analyze-resume-content';
import type { SuggestResumeImprovementsOutput } from '@/ai/flows/suggest-resume-improvements';
import type { GenerateCoverLetterOutput } from '@/ai/flows/generate-cover-letter';

interface ResumeContextType {
  resumeText: string;
  setResumeText: (text: string) => void;
  jobDescription: string;
  setJobDescription: (text: string) => void;
  jobRole: JobRole | '';
  setJobRole: (role: JobRole | '') => void;
  jobUrl: string;
  setJobUrl: (url: string) => void;
  resumeFile: File | null;
  setResumeFile: Dispatch<SetStateAction<File | null>>;
  analysis: AnalyzeResumeContentOutput | null;
  improvements: SuggestResumeImprovementsOutput | null;
  interview: GenerateInterviewQuestionsOutput | null;
  qa: Record<QATopic, GenerateResumeQAOutput | null> | null;
  coverLetter: GenerateCoverLetterOutput | null;
  storedResumeText?: string;
  storedJobDescription?: string;
  storedJobRole?: JobRole | '';
  storedJobUrl?: string;
  setAnalysis: (data: AnalyzeResumeContentOutput | null) => void;
  setImprovements: (data: SuggestResumeImprovementsOutput | null) => void;
  setInterview: (data: GenerateInterviewQuestionsOutput | null) => void;
  setQa: (data: Record<QATopic, GenerateResumeQAOutput | null> | null) => void;
  setCoverLetter: (data: GenerateCoverLetterOutput | null) => void;
  loadDataFromCache: () => void;
  forceReloadData: () => void;
  updateStoredValues: (resumeText?: string, jobDescription?: string, jobRole?: JobRole | '', jobUrl?: string) => void;
  isDataLoaded: boolean;
  hasAnyData: boolean;
}

export const ResumeContext = createContext<ResumeContextType>({
  resumeText: '',
  setResumeText: () => {},
  jobDescription: '',
  setJobDescription: () => {},
  jobRole: '',
  setJobRole: () => {},
  jobUrl: '',
  setJobUrl: () => {},
  resumeFile: null,
  setResumeFile: () => {},
  analysis: null,
  improvements: null,
  interview: null,
  qa: null,
  coverLetter: null,
  setAnalysis: () => {},
  setImprovements: () => {},
  setInterview: () => {},
  setQa: () => {},
  setCoverLetter: () => {},
  loadDataFromCache: () => {},
  forceReloadData: () => {},
  updateStoredValues: () => {},
  isDataLoaded: false,
  hasAnyData: false,
});

export function ResumeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobRole, setJobRole] = useState<JobRole | ''>('');
  const [jobUrl, setJobUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResumeContentOutput | null>(null);
  const [improvements, setImprovements] = useState<SuggestResumeImprovementsOutput | null>(null);
  const [interview, setInterview] = useState<GenerateInterviewQuestionsOutput | null>(null);
  const [qa, setQa] = useState<Record<QATopic, GenerateResumeQAOutput | null> | null>(null);
  const [coverLetter, setCoverLetter] = useState<GenerateCoverLetterOutput | null>(null);
  
  const [storedResumeText, setStoredResumeText] = useState<string | undefined>('');
  const [storedJobDescription, setStoredJobDescription] = useState<string | undefined>('');
  const [storedJobRole, setStoredJobRole] = useState<JobRole | '' | undefined>('');
  const [storedJobUrl, setStoredJobUrl] = useState<string | undefined>('');
  const [lastLoadedUserId, setLastLoadedUserId] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(true); // Start as true to prevent loading delays

  const resetState = useCallback(() => {
    setResumeText('');
    setJobDescription('');
    setJobRole('');
    setJobUrl('');
    setResumeFile(null);
    setAnalysis(null);
    setImprovements(null);
    setInterview(null);
    setQa(null);
    setCoverLetter(null);
    setStoredResumeText('');
    setStoredJobDescription('');
    setStoredJobRole('');
    setStoredJobUrl('');
    setLastLoadedUserId(null);
    // Don't set isDataLoaded to false here - it should remain true after initial load attempt
  }, []);


  const applyData = useCallback((data: AnalysisResult) => {
    setResumeText(data.resumeText || '');
    setJobDescription(data.jobDescription || '');
    setJobRole(data.jobRole || '');
    setJobUrl(data.jobUrl || '');
    setAnalysis(data.analysis || null);
    setImprovements(data.improvements || null);
    setInterview(data.interview || null);
    setQa(data.qa || null);
    setCoverLetter(data.coverLetter || null);
    setStoredResumeText(data.resumeText);
    setStoredJobDescription(data.jobDescription);
    setStoredJobRole(data.jobRole);
    setStoredJobUrl(data.jobUrl);
  }, []);

  const clearState = useCallback(() => {
    setResumeText('');
    setJobDescription('');
    setJobRole('');
    setJobUrl('');
    setResumeFile(null);
    setAnalysis(null);
    setImprovements(null);
    setInterview(null);
    setQa(null);
    setCoverLetter(null);
    setStoredResumeText('');
    setStoredJobDescription('');
    setStoredJobRole('');
    setStoredJobUrl('');
  }, []);

  const loadDataFromCache = useCallback(() => {
    if (user) {
      // Always try to load data when user changes or on explicit reload
      if (user.uid !== lastLoadedUserId) {
        startTransition(() => {
          const data = getUserData(user.uid);
          
          if (data) {
            applyData(data);
            setLastLoadedUserId(user.uid);
          } else {
            // localStorage is empty — try loading from database
            clearState();
            setLastLoadedUserId(user.uid);
            
            // Async: fetch from DB and populate both state and localStorage
            loadResumeDataAction(user.uid).then((dbData) => {
              if (dbData) {
                applyData(dbData);
                // Cache in localStorage for future loads
                saveUserData(user.uid, dbData);
              }
            }).catch((err) => {
              console.error('Error loading resume data from DB:', err);
            });
          }
        });
        
        // Always set data loaded to true after attempting to load
        setIsDataLoaded(true);
      }
    } else {
      // No user - clear state and mark as loaded
      startTransition(() => {
        resetState();
      });
      setIsDataLoaded(true);
    }
  }, [user, lastLoadedUserId, resetState, applyData, clearState]);

  // Force reload function that clears the lastLoadedUserId to trigger a fresh data load
  const forceReloadData = useCallback(() => {
    setLastLoadedUserId(null);
    setIsDataLoaded(false);
    if (user) {
      // Trigger immediate reload
      setTimeout(() => loadDataFromCache(), 0);
    }
  }, [user, loadDataFromCache]);

  useEffect(() => {
    loadDataFromCache();

    const handleDataLoad = () => {
      forceReloadData();
    };
    const handleLogout = () => {
      resetState();
      setIsDataLoaded(true); // Keep data loaded as true after logout
    };

    window.addEventListener('user-data-loaded', handleDataLoad);
    window.addEventListener('user-logged-out', handleLogout);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (user && e.key === `resume_buddy_user_${user.uid}`) {
        loadDataFromCache();
      }
      // If the item is removed (logout), clear state
      if (user && e.key === `resume_buddy_user_${user.uid}` && e.newValue === null) {
        resetState();
        setIsDataLoaded(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('user-data-loaded', handleDataLoad);
      window.removeEventListener('user-logged-out', handleLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, loadDataFromCache, forceReloadData, resetState]);

  const updateStoredValues = useCallback((newResumeText?: string, newJobDescription?: string, newJobRole?: JobRole | '', newJobUrl?: string) => {
    if (newResumeText !== undefined) {
      setStoredResumeText(newResumeText);
    }
    if (newJobDescription !== undefined) {
      setStoredJobDescription(newJobDescription);
    }
    if (newJobRole !== undefined) {
      setStoredJobRole(newJobRole);
    }
    if (newJobUrl !== undefined) {
      setStoredJobUrl(newJobUrl);
    }
    // Mark data as fresh since we just updated it
    if (user) {
      setLastLoadedUserId(user.uid);
      setIsDataLoaded(true);
    }
  }, [user]);

  // Computed value to check if user has any meaningful data
  const hasAnyData = !!(resumeText || jobDescription || jobRole || jobUrl || analysis || improvements || interview || qa || coverLetter);

  const contextValue = {
    resumeText,
    setResumeText,
    jobDescription,
    setJobDescription,
    jobRole,
    setJobRole,
    jobUrl,
    setJobUrl,
    resumeFile,
    setResumeFile,
    analysis,
    setAnalysis,
    improvements,
    setImprovements,
    interview,
    setInterview,
    qa,
    setQa,
    coverLetter,
    setCoverLetter,
    storedResumeText,
    storedJobDescription,
    storedJobRole,
    storedJobUrl,
    loadDataFromCache,
    forceReloadData,
    updateStoredValues,
    isDataLoaded,
    hasAnyData,
  };

  return (
    <ResumeContext.Provider value={contextValue}>
      {children}
    </ResumeContext.Provider>
  );
}

/**
 * Custom hook to use the Resume Context
 */
export function useResume() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
}
