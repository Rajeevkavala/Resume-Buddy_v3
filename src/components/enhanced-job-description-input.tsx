'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clipboard, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedJobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  jobRole?: string;
  className?: string;
}

export function EnhancedJobDescriptionInput({ 
  value, 
  onChange, 
  jobRole,
  className 
}: EnhancedJobDescriptionInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Calculate basic metrics
  const safeValue = value || '';
  const wordCount = safeValue.trim() ? safeValue.trim().split(/\s+/).length : 0;
  const charCount = safeValue.length;
  const minWordCount = 50;
  const minCharCount = 100;
  
  const isValidLength = wordCount >= minWordCount && charCount >= minCharCount;

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.trim()) {
        onChange(clipboardText.trim());
        toast.success('Job description pasted from clipboard!');
      } else {
        toast.error('No text found in clipboard');
      }
    } catch (error) {
      toast.error('Failed to read clipboard. Please paste manually.');
    }
  };

  const handleClear = () => {
    onChange('');
    toast.success('Job description cleared');
  };

  const enhanceDescription = async () => {
    if (!safeValue.trim()) {
      toast.error('Please enter a job description first');
      return;
    }

    setIsEnhancing(true);
    
    try {
      // Import the server action dynamically
      const { enhanceJobDescriptionAction } = await import('@/app/actions');
      
      const result = await enhanceJobDescriptionAction({
        jobDescription: safeValue.trim(),
        jobRole: jobRole || undefined,
      });
      
      if (result.enhancedDescription && result.enhancedDescription !== safeValue.trim()) {
        onChange(result.enhancedDescription);
        toast.success(`Job description enhanced! Added: ${result.addedSections.join(', ')}`);
      } else {
        toast.info('Job description is already well-structured!');
      }
    } catch (error: any) {
      console.error('Job enhancement error:', error);
      toast.error('Failed to enhance description. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const getValidationStatus = () => {
    if (!safeValue.trim()) {
      return { variant: 'default' as const, message: 'Optional: Leave empty to use a role-based preset' };
    }
    if (!isValidLength) {
      const wordsNeeded = Math.max(0, minWordCount - wordCount);
      const charsNeeded = Math.max(0, minCharCount - charCount);
      return { 
        variant: 'destructive' as const, 
        message: `Need ${wordsNeeded} more words or ${charsNeeded} more characters for custom description` 
      };
    }
    return { variant: 'default' as const, message: 'Good length for analysis!' };
  };

  const validation = getValidationStatus();

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="job-description" className="font-medium flex items-center gap-2">
          <div className="p-1 bg-primary/10 rounded">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          Job Description
          <span className="text-sm text-muted-foreground font-normal ml-1">(Optional)</span>
        </Label>
        <div className="flex items-center gap-2">
          <Badge 
            variant={isValidLength ? 'default' : 'secondary'} 
            className={`text-xs ${isValidLength ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-muted text-muted-foreground'}`}
          >
            {wordCount} words
          </Badge>
          <Badge 
            variant={isValidLength ? 'default' : 'secondary'} 
            className={`text-xs ${isValidLength ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground'}`}
          >
            {charCount} chars
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            id="job-description"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste the job description here, or leave empty to use a role-based preset job description based on your selected target role..."
            className={`min-h-[400px] text-sm resize-y transition-colors ${
              safeValue && !isValidLength 
                ? 'border-orange-300 focus:border-orange-400 focus:ring-orange-200 dark:border-orange-700 dark:focus:border-orange-600' 
                : safeValue && isValidLength 
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-200 dark:border-green-700 dark:focus:border-green-600'
                  : ''
            }`}
            rows={16}
          />
          
          {/* Action buttons in top-right corner */}
          <div className="absolute top-3 right-3 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePasteFromClipboard}
              className="h-8 w-8 p-0 hover:bg-primary/10 text-primary hover:text-primary/80 transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="h-3 w-3" />
            </Button>
            {safeValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-600 transition-colors"
                title="Clear description"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Validation Alert */}
        {safeValue && (
          <Alert variant={validation.variant} className="py-2">
            {isValidLength ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className="text-sm">
              {validation.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Enhancement button */}
        {safeValue.trim() && isValidLength && (
          <Button
            type="button"
            onClick={enhanceDescription}
            disabled={isEnhancing}
            variant="outline"
            className="w-full border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/30 transition-colors"
          >
            {isEnhancing ? (
              <>
                <Wand2 className="h-4 w-4 mr-2 animate-pulse" />
                Enhancing with AI insights...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Enhance with AI insights
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tips */}
      {!safeValue.trim() && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium">💡 Tips for better analysis:</p>
          <ul className="text-xs space-y-1 ml-4">
            <li>• Include job title, responsibilities, and requirements</li>
            <li>• Add company information and culture details</li>
            <li>• Include required skills and experience levels</li>
            <li>• Mention any specific technologies or tools</li>
          </ul>
        </div>
      )}
    </div>
  );
}