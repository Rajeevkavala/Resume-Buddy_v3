'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Wand2,
  FileUp,
  PenLine
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSelected: () => void;
}

type OptionType = 'upload' | 'create' | null;

export function WelcomeModal({ isOpen, onClose, onUploadSelected }: WelcomeModalProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<OptionType>(null);
  const [isHovering, setIsHovering] = useState<OptionType>(null);

  const handleContinue = () => {
    if (selectedOption === 'upload') {
      onClose();
      onUploadSelected();
    } else if (selectedOption === 'create') {
      onClose();
      router.push('/create-resume');
    }
  };

  const options = [
    {
      id: 'upload' as const,
      title: 'Upload Resume',
      description: 'I already have a resume and want to analyze or improve it',
      icon: FileUp,
      features: [
        'AI-powered resume analysis',
        'Get tailored improvement suggestions',
        'Generate interview prep questions',
        'ATS compatibility check',
      ],
      badge: 'Most Popular',
      badgeVariant: 'default' as const,
      gradient: 'from-blue-500/10 via-cyan-500/5 to-transparent',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-500/50',
      recommended: true,
    },
    {
      id: 'create' as const,
      title: 'Create from Scratch',
      description: 'I want to build a professional resume using AI assistance',
      icon: PenLine,
      features: [
        'AI writing assistant',
        'Professional templates',
        'Export to PDF/LaTeX',
        'Real-time preview',
      ],
      badge: 'AI Powered',
      badgeVariant: 'secondary' as const,
      gradient: 'from-purple-500/10 via-pink-500/5 to-transparent',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-500/50',
      recommended: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-primary/5 via-primary/10 to-background border-b">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                Welcome to ResumeBuddy
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Let's Get Started!
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Choose how you'd like to begin your journey to a better resume.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Options Section */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedOption === option.id;
              const isHovered = isHovering === option.id;

              return (
                <Card
                  key={option.id}
                  className={cn(
                    'relative cursor-pointer transition-all duration-300 overflow-hidden group',
                    'hover:shadow-lg hover:-translate-y-0.5',
                    isSelected 
                      ? `ring-2 ring-primary shadow-lg ${option.borderColor}` 
                      : 'hover:border-primary/30',
                    isHovered && !isSelected && 'border-primary/20'
                  )}
                  onClick={() => setSelectedOption(option.id)}
                  onMouseEnter={() => setIsHovering(option.id)}
                  onMouseLeave={() => setIsHovering(null)}
                >
                  {/* Background gradient */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300',
                    option.gradient,
                    (isSelected || isHovered) && 'opacity-100'
                  )} />

                  {/* Recommended badge */}
                  {option.recommended && (
                    <div className="absolute -right-8 top-4 rotate-45">
                      <div className="bg-primary text-primary-foreground text-xs font-medium px-8 py-1">
                        Popular
                      </div>
                    </div>
                  )}

                  <CardHeader className="relative pb-2">
                    <div className="flex items-start justify-between">
                      <div className={cn(
                        'p-3 rounded-xl transition-all duration-300',
                        option.iconBg,
                        isSelected && 'scale-110'
                      )}>
                        <Icon className={cn('w-6 h-6', option.iconColor)} />
                      </div>
                      {isSelected && (
                        <div className="p-1 rounded-full bg-primary text-primary-foreground animate-in zoom-in-50 duration-200">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-3">{option.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {option.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    <ul className="space-y-2">
                      {option.features.map((feature, idx) => (
                        <li 
                          key={idx} 
                          className={cn(
                            'flex items-center gap-2 text-sm text-muted-foreground',
                            'transition-all duration-200',
                            (isSelected || isHovered) && 'text-foreground/80'
                          )}
                        >
                          <CheckCircle2 className={cn(
                            'w-3.5 h-3.5 flex-shrink-0',
                            isSelected ? 'text-primary' : 'text-muted-foreground/50'
                          )} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Button */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-w-[200px] h-12 text-base font-medium gap-2 group"
              onClick={handleContinue}
              disabled={!selectedOption}
            >
              {selectedOption === 'upload' && <Upload className="w-4 h-4" />}
              {selectedOption === 'create' && <Wand2 className="w-4 h-4" />}
              {selectedOption ? 'Continue' : 'Select an option'}
              <ArrowRight className={cn(
                'w-4 h-4 transition-transform duration-200',
                selectedOption && 'group-hover:translate-x-1'
              )} />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can always switch between these options later
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
