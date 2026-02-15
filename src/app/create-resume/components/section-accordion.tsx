'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  FileText, 
  Wrench, 
  Briefcase, 
  GraduationCap, 
  FolderOpen,
  CheckCircle,
  Circle,
  Award
} from 'lucide-react';

interface SectionAccordionProps {
  children: React.ReactNode;
  value: string[];
  onValueChange: (value: string[]) => void;
}

interface SectionItemProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isComplete?: boolean;
  itemCount?: number;
  children: React.ReactNode;
}

export function SectionAccordion({ children, value, onValueChange }: SectionAccordionProps) {
  return (
    <Accordion 
      type="multiple" 
      value={value} 
      onValueChange={onValueChange}
      className="space-y-3"
    >
      {children}
    </Accordion>
  );
}

export function SectionItem({ id, title, icon, isComplete, itemCount, children }: SectionItemProps) {
  return (
    <AccordionItem 
      value={id} 
      className="border border-border/60 rounded-lg overflow-hidden bg-card"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/20">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-sm">{title}</span>
          </div>
          <div className="flex items-center gap-2 mr-2">
            {itemCount !== undefined && itemCount > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {itemCount}
              </Badge>
            )}
            {isComplete ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground/40" />
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2 border-t border-border/60">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

// Section icons for consistent usage
export const SECTION_ICONS = {
  personal: <User className="w-4 h-4 text-primary" />,
  summary: <FileText className="w-4 h-4 text-primary" />,
  skills: <Wrench className="w-4 h-4 text-primary" />,
  experience: <Briefcase className="w-4 h-4 text-primary" />,
  education: <GraduationCap className="w-4 h-4 text-primary" />,
  projects: <FolderOpen className="w-4 h-4 text-primary" />,
  certifications: <Award className="w-4 h-4 text-primary" />,
};
