'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Eye, FileText, Download } from 'lucide-react';
import { LivePreview } from './live-preview';
import type { ResumeData } from '@/lib/types';
import type { LatexTemplateId } from '@/lib/latex-templates';

interface MobilePreviewToggleProps {
  resumeData: ResumeData | null;
  templateId: LatexTemplateId;
  onExport: (filename: string, templateId: LatexTemplateId) => Promise<void>;
  isExporting: boolean;
}

export function MobilePreviewToggle(props: MobilePreviewToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button - Fixed position on mobile */}
      <div className="fixed bottom-6 right-4 lg:hidden z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Eye className="w-5 h-5" />
              <span className="sr-only">Preview Resume</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
            <SheetHeader className="pb-3 border-b border-border/40">
              <SheetTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-primary" />
                Resume Preview
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 h-[calc(90vh-70px)] pt-3">
              <LivePreview {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
