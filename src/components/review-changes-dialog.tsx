'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResumeData } from '@/lib/types';
import { Check, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewChangesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalData: ResumeData;
  newData: ResumeData;
  onConfirm: (finalData: ResumeData) => void;
}

type SectionKey = keyof ResumeData;

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'personalInfo', label: 'Personal Info' },
  { key: 'summary', label: 'Professional Summary' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects', label: 'Projects' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'awards', label: 'Awards' },
];

export function ReviewChangesDialog({ isOpen, onClose, originalData, newData, onConfirm }: ReviewChangesDialogProps) {
  const [selectedSections, setSelectedSections] = useState<Set<SectionKey>>(new Set(SECTIONS.map(s => s.key)));

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSections(new Set(SECTIONS.map(s => s.key)));
    }
  }, [isOpen]);

  const toggleSection = (key: SectionKey) => {
    const next = new Set(selectedSections);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedSections(next);
  };

  const handleConfirm = () => {
    const finalData = { ...originalData };
    
    selectedSections.forEach(key => {
      if (newData[key] !== undefined) {
        // @ts-ignore - we know the keys match
        finalData[key] = newData[key];
      }
    });

    onConfirm(finalData);
    onClose();
  };

  const getChangeSummary = (key: SectionKey) => {
    const original = originalData[key];
    const improved = newData[key];

    if (!improved) return (
      <div className="flex items-center gap-1.5 text-muted-foreground italic">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">No changes proposed</span>
      </div>
    );
    
    if (JSON.stringify(original) === JSON.stringify(improved)) return (
      <div className="flex items-center gap-1.5 text-muted-foreground italic">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">No changes detected</span>
      </div>
    );

    if (Array.isArray(improved)) {
      const diff = improved.length - (Array.isArray(original) ? original.length : 0);
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs px-2 py-0.5">
            {improved.length} {improved.length === 1 ? 'item' : 'items'}
          </Badge>
          {diff !== 0 && (
            <span className={`text-xs font-medium flex items-center gap-1 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {diff > 0 ? '↗' : '↘'} {Math.abs(diff)} {diff > 0 ? 'added' : 'removed'}
            </span>
          )}
        </div>
      );
    }

    if (typeof improved === 'string') {
       return (
        <div className="text-xs text-muted-foreground truncate max-w-[400px] italic">
          "{improved.substring(0, 60)}..."
        </div>
       )
    }

    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
        ✨ Modified
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col border-primary/20 shadow-xl">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Review AI Improvements
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Select the sections you want to update with the AI-enhanced content.
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{selectedSections.size}</span> of <span className="font-medium text-foreground">{SECTIONS.filter(s => newData[s.key] || originalData[s.key]).length}</span> sections selected
            </p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-3 py-4">
            {SECTIONS.map(({ key, label }) => {
              // Skip if no data in new version
              if (!newData[key] && !originalData[key]) return null;

              const isSelected = selectedSections.has(key);
              const hasChanges = JSON.stringify(originalData[key]) !== JSON.stringify(newData[key]);

              return (
                <div 
                  key={key} 
                  className={`group flex items-start space-x-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${
                    isSelected 
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-sm' 
                      : 'bg-card border-border hover:border-primary/20'
                  }`}
                  onClick={() => !(!newData[key]) && toggleSection(key)}
                >
                  <Checkbox 
                    id={`section-${key}`} 
                    checked={isSelected}
                    onCheckedChange={() => toggleSection(key)}
                    disabled={!newData[key]}
                    className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Label 
                        htmlFor={`section-${key}`} 
                        className="text-base font-semibold cursor-pointer flex items-center gap-2"
                      >
                        {label}
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </Label>
                      {hasChanges && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                          ✨ Updated
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getChangeSummary(key)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedSections.size === 0}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Check className="mr-2 h-4 w-4" />
            Apply {selectedSections.size} {selectedSections.size === 1 ? 'Change' : 'Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
