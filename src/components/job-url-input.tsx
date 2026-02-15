'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Link, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clipboard,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JobUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onJobDescriptionExtracted?: (description: string) => void;
  existingJobDescription?: string; // Pass existing JD to prevent auto-extraction
  userId?: string; // User ID for rate limiting
  className?: string;
}

interface UrlValidation {
  isValid: boolean;
  domain?: string;
  error?: string;
}

// Popular job sites for validation and display
const jobSites = [
  { domain: 'linkedin.com', name: 'LinkedIn', color: 'bg-blue-600' },
  { domain: 'indeed.com', name: 'Indeed', color: 'bg-blue-700' },
  { domain: 'glassdoor.com', name: 'Glassdoor', color: 'bg-green-600' },
  { domain: 'monster.com', name: 'Monster', color: 'bg-purple-600' },
  { domain: 'stackoverflow.com', name: 'Stack Overflow', color: 'bg-orange-500' },
  { domain: 'angel.co', name: 'AngelList', color: 'bg-black' },
  { domain: 'dice.com', name: 'Dice', color: 'bg-red-600' },
  { domain: 'ziprecruiter.com', name: 'ZipRecruiter', color: 'bg-blue-500' },
  { domain: 'careerbuilder.com', name: 'CareerBuilder', color: 'bg-orange-600' },
  { domain: 'flexjobs.com', name: 'FlexJobs', color: 'bg-teal-600' },
];

function validateUrl(url: string): UrlValidation {
  if (!url.trim()) {
    return { isValid: false };
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase().replace('www.', '');
    
    // Check if it's a known job site
    const knownSite = jobSites.find(site => domain.includes(site.domain));
    
    return {
      isValid: true,
      domain: knownSite ? knownSite.name : domain,
    };
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid URL (must include https:// or http://)',
    };
  }
}

export function JobUrlInput({ 
  value, 
  onChange, 
  onJobDescriptionExtracted,
  existingJobDescription,
  userId,
  className 
}: JobUrlInputProps) {
  const [validation, setValidation] = useState<UrlValidation>({ isValid: false });
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [lastExtractedUrl, setLastExtractedUrl] = useState('');
  const previousValueRef = useRef('');

  // Initialize lastExtractedUrl if there's already a job description and URL
  // This prevents re-extraction on component remount
  useEffect(() => {
    if (value && existingJobDescription) {
      setLastExtractedUrl(value.trim());
      setHasExtracted(true);
    }
  }, []);

  useEffect(() => {
    const currentValidation = validateUrl(value);
    setValidation(currentValidation);
    
    // Auto-extract logic with debounce
    const timer = setTimeout(() => {
      // Only auto-extract if:
      // 1. URL is valid
      // 2. No existing job description OR we previously extracted this URL (to allow updates)
      // 3. URL is different from last extracted
      // 4. We haven't already extracted this specific URL (prevent loops)
      if (
        value && 
        currentValidation.isValid && 
        (!existingJobDescription || lastExtractedUrl) &&
        lastExtractedUrl !== value.trim()
      ) {
        // If there's an existing description that wasn't from a URL, don't overwrite it automatically
        if (existingJobDescription && !lastExtractedUrl) {
          return;
        }
        
        handleAutoExtract(value.trim());
      }
    }, 800); // Increased debounce to 800ms to wait for typing to finish

    return () => clearTimeout(timer);
  }, [value, existingJobDescription, lastExtractedUrl]);

  // Dedicated auto-extract function that doesn't rely on state
  const handleAutoExtract = async (urlToExtract: string) => {
    if (!urlToExtract || lastExtractedUrl === urlToExtract) return;
    
    setIsExtracting(true);
    
    try {
      const { extractJobDescriptionFromUrl } = await import('@/app/actions');
      const result = await extractJobDescriptionFromUrl(urlToExtract, userId);
      
      if (result.success && result.data) {
        if (onJobDescriptionExtracted) {
          onJobDescriptionExtracted(result.data.description);
        }
        setHasExtracted(true);
        setLastExtractedUrl(urlToExtract);
        toast.success('Job description auto-filled from URL! 🎉');
      } else {
        // Silently fail for auto-extract, but show button
        console.warn('Auto-extract failed:', result.error);
        toast.error('Auto-fill failed: ' + (result.error || 'Could not extract content. Try pasting manually.'), { duration: 4000 });
      }
    } catch (error) {
      console.error('Auto-extract error:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText && clipboardText.includes('http')) {
        onChange(clipboardText.trim());
        toast.success('URL pasted from clipboard!');
      } else {
        toast.error('No valid URL found in clipboard');
      }
    } catch (error) {
      toast.error('Failed to read clipboard. Please paste manually.');
    }
  };

  const extractJobDescription = async (isAutoExtract = false) => {
    if (!validation.isValid || !value.trim()) {
      if (!isAutoExtract) {
        toast.error('Please enter a valid job URL first');
      }
      return;
    }

    // Don't auto-extract if we've already extracted this URL
    if (isAutoExtract && lastExtractedUrl === value.trim()) {
      return;
    }

    setIsExtracting(true);
    
    try {
      // Import the server action dynamically
      const { extractJobDescriptionFromUrl } = await import('@/app/actions');
      
      const result = await extractJobDescriptionFromUrl(value.trim(), userId);
      
      if (result.success && result.data) {
        if (onJobDescriptionExtracted) {
          onJobDescriptionExtracted(result.data.description);
        }
        setHasExtracted(true);
        setLastExtractedUrl(value.trim());
        
        if (isAutoExtract) {
          toast.success('Job description auto-filled from URL! 🎉');
        } else {
          toast.success('Job description extracted successfully!');
        }
      } else {
        if (!isAutoExtract) {
          toast.error(result.error || 'Failed to extract job description');
        }
      }
    } catch (error: any) {
      console.error('Job extraction error:', error);
      if (!isAutoExtract) {
        toast.error('Failed to extract job description. Please copy it manually.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const getSiteInfo = () => {
    if (!validation.isValid || !value) return null;
    
    try {
      const urlObj = new URL(value);
      const domain = urlObj.hostname.toLowerCase().replace('www.', '');
      return jobSites.find(site => domain.includes(site.domain));
    } catch {
      return null;
    }
  };

  const siteInfo = getSiteInfo();

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <Label htmlFor="job-url" className="font-medium flex items-center gap-2">
        <div className="p-1 bg-primary/10 rounded">
          <Link className="h-4 w-4 text-primary" />
        </div>
        Job URL
        <span className="text-sm text-muted-foreground font-normal">
          (Optional - for auto-extraction)
        </span>
      </Label>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            id="job-url"
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://company.com/careers/job-posting"
            className={`flex-1 h-12 transition-colors ${
              value && !validation.isValid 
                ? 'border-red-300 focus:border-red-400 focus:ring-red-200 dark:border-red-700 dark:focus:border-red-600' 
                : value && validation.isValid 
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-200 dark:border-green-700 dark:focus:border-green-600'
                  : ''
            }`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePasteFromClipboard}
            title="Paste from clipboard"
            className="h-12"
          >
            <Clipboard className="h-4 w-4" />
          </Button>
        </div>

        {value && !validation.isValid && validation.error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {validation.error}
            </AlertDescription>
          </Alert>
        )}

        {validation.isValid && siteInfo && (
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${siteInfo.color} text-white text-xs`}
            >
              {siteInfo.name}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(value, '_blank')}
              className="h-6 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </div>
        )}

        {/* Show extraction status or manual button */}
        {validation.isValid && isExtracting && (
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              Extracting job description from URL...
            </AlertDescription>
          </Alert>
        )}

        {validation.isValid && !isExtracting && hasExtracted && lastExtractedUrl === value.trim() && (
          <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-900 dark:text-green-100">
              Job description extracted successfully!
            </AlertDescription>
          </Alert>
        )}

        {validation.isValid && !isExtracting && (!hasExtracted || lastExtractedUrl !== value.trim()) && (
          <Button
            type="button"
            onClick={() => extractJobDescription(false)}
            disabled={isExtracting}
            variant="secondary"
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {hasExtracted ? 'Re-extract job description' : 'Auto-fill job description from URL'}
          </Button>
        )}
      </div>
    </div>
  );
}