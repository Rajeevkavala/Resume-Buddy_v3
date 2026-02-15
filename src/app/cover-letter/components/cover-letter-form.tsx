'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sparkles, 
  Building2, 
  User,
  MessageSquare,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToneType } from '../page';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface CoverLetterFormProps {
  companyName: string;
  setCompanyName: (value: string) => void;
  hiringManagerName: string;
  setHiringManagerName: (value: string) => void;
  tone: ToneType;
  setTone: (value: ToneType) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const toneOptions: { value: ToneType; label: string; description: string }[] = [
  { value: 'professional', label: 'Professional', description: 'Polished and formal, focus on qualifications' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and passionate about the opportunity' },
  { value: 'confident', label: 'Confident', description: 'Assertive and direct, highlights accomplishments' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly and approachable tone' },
];

export function CoverLetterForm({
  companyName,
  setCompanyName,
  hiringManagerName,
  setHiringManagerName,
  tone,
  setTone,
  onGenerate,
  isLoading,
}: CoverLetterFormProps) {
  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={fadeInUp}
      className="space-y-6"
    >
      {/* Customization Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Customize Your Letter</CardTitle>
              <CardDescription>Optional details to personalize your cover letter</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Company Name
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="companyName"
              placeholder="e.g., Google, Microsoft, StartupXYZ"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Hiring Manager Name */}
          <div className="space-y-2">
            <Label htmlFor="hiringManager" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Hiring Manager Name
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="hiringManager"
              placeholder="e.g., John Smith, Jane Doe"
              value={hiringManagerName}
              onChange={(e) => setHiringManagerName(e.target.value)}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              If unknown, we&apos;ll use &quot;Hiring Manager&quot;
            </p>
          </div>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              Writing Tone
            </Label>
            <Select value={tone} onValueChange={(value: ToneType) => setTone(value)}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Tips for a great cover letter</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Make sure your resume has specific achievements and metrics</li>
                <li>• Include a detailed job description for better personalization</li>
                <li>• Adding the company name helps us reference their values and mission</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center pt-2">
        <Button 
          size="lg" 
          onClick={onGenerate}
          disabled={isLoading}
          className="gap-2 px-8 shadow-lg hover:shadow-xl transition-shadow"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Cover Letter
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
