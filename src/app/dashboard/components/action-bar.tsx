'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Save, Trash2, ArrowRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-animations';

interface ActionBarProps {
  hasAnyInput: boolean;
  isReadyForAI: boolean;
  isSaving: boolean;
  onSave: () => void;
  onClear: () => void;
  onStartAnalysis: () => void;
}

export function ActionBar({
  hasAnyInput,
  isReadyForAI,
  isSaving,
  onSave,
  onClear,
  onStartAnalysis,
}: ActionBarProps) {
  if (!hasAnyInput) {
    return null;
  }

  return (
    <>
      {/* Spacer for sticky bar on mobile */}
      <div className="h-20 md:hidden" />
      
      {/* Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 
          md:relative md:bottom-auto 
          bg-background/95 backdrop-blur-sm border-t md:border md:rounded-xl 
          p-3 sm:p-4 md:p-5
          shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.08)] md:shadow-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Save & Clear Buttons */}
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 sm:flex-none gap-1.5 h-9 px-3 sm:px-4"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span className="hidden xs:inline">
                      {isSaving ? 'Saving...' : 'Save'}
                    </span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Save Your Progress</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will save your resume and job description to your account. 
                      Any existing AI analysis will be cleared so you can regenerate fresh insights.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onSave}>
                      Save Progress
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 px-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5">Clear</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your resume, job description, and all AI analysis results. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={onClear}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-border" />
            
            {/* Analysis Button */}
            {isReadyForAI && (
              <Button 
                onClick={onStartAnalysis}
                className="flex-1 sm:flex-none gap-2 h-9 sm:h-10"
              >
                <span>Start Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Helper text - Desktop only */}
          <p className="hidden md:block text-xs text-muted-foreground text-center mt-3">
            Changes are saved locally. Click "Save" to sync with your account.
          </p>
        </div>
      </div>
    </>
  );
}
