'use client';

import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { SectionOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  GripVertical, 
  User, 
  FileText, 
  Code, 
  Briefcase, 
  GraduationCap, 
  Award,
  Heart,
  Star,
  Eye,
  EyeOff
} from 'lucide-react';

interface SectionOrderManagerProps {
  sections: SectionOrder[];
  onChange: (sections: SectionOrder[]) => void;
  hiddenSections?: SectionOrder[];
  onHiddenSectionsChange?: (hidden: SectionOrder[]) => void;
  showVisibilityToggle?: boolean;
}

const SECTION_CONFIG: Record<SectionOrder, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  required?: boolean;
  recommendedOrder?: number;
}> = {
  header: {
    label: 'Header (Compact)',
    icon: User,
    description: 'Contact info in single line format',
    required: true,
    recommendedOrder: 1
  },
  summary: {
    label: 'Professional Summary',
    icon: FileText,
    description: 'Concise 60-80 word overview',
    recommendedOrder: 2
  },
  skills: {
    label: 'Technical Skills',
    icon: Code,
    description: 'Grouped by: Languages, Frameworks, Databases, Tools, Cloud',
    recommendedOrder: 3
  },
  projects: {
    label: 'Key Projects',
    icon: Award,
    description: 'Top 2-3 projects with impact metrics',
    recommendedOrder: 4
  },
  experience: {
    label: 'Professional Experience',
    icon: Briefcase,
    description: 'Work history with quantified achievements',
    required: true,
    recommendedOrder: 5
  },
  educationAndCertifications: {
    label: 'Education & Certifications',
    icon: GraduationCap,
    description: 'Academic background and professional certifications',
    recommendedOrder: 6
  }
};

export function SectionOrderManager({ 
  sections, 
  onChange,
  hiddenSections = [],
  onHiddenSectionsChange,
  showVisibilityToggle = true
}: SectionOrderManagerProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  const toggleSectionVisibility = (section: SectionOrder) => {
    if (!onHiddenSectionsChange) return;
    
    const isHidden = hiddenSections.includes(section);
    
    if (isHidden) {
      // Show section - remove from hidden and add to visible sections if not present
      const newHidden = hiddenSections.filter(s => s !== section);
      onHiddenSectionsChange(newHidden);
      
      if (!sections.includes(section)) {
        onChange([...sections, section]);
      }
    } else {
      // Hide section - add to hidden
      onHiddenSectionsChange([...hiddenSections, section]);
    }
  };

  const allSections = Object.keys(SECTION_CONFIG) as SectionOrder[];
  const availableHiddenSections = allSections.filter(section => 
    !sections.includes(section) && hiddenSections.includes(section)
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          Section Order
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag sections to reorder them in your resume
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Visible Sections */}
        <div>
          <h4 className="font-medium mb-3">Visible Sections</h4>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 min-h-[100px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                    snapshot.isDraggingOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border'
                  }`}
                >
                  {sections.map((section, index) => {
                    const config = SECTION_CONFIG[section];
                    const IconComponent = config.icon;
                    const isHidden = hiddenSections.includes(section);

                    return (
                      <Draggable 
                        key={section} 
                        draggableId={section} 
                        index={index}
                        isDragDisabled={config.required}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg border bg-background transition-all
                              ${snapshot.isDragging 
                                ? 'shadow-lg border-primary bg-primary/5 rotate-2' 
                                : 'border-border hover:border-primary/50'
                              }
                              ${config.required ? 'opacity-75' : ''}
                            `}
                          >
                            <div 
                              {...provided.dragHandleProps}
                              className={`flex items-center ${config.required ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                            >
                              <GripVertical className="w-5 h-5 text-muted-foreground" />
                            </div>
                            
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm truncate">{config.label}</h5>
                                <p className="text-xs text-muted-foreground truncate">
                                  {config.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {config.required && (
                                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                  Required
                                </span>
                              )}
                              
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                {index + 1}
                              </span>

                              {showVisibilityToggle && onHiddenSectionsChange && !config.required && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSectionVisibility(section)}
                                  className="h-8 w-8 p-0"
                                  title={isHidden ? 'Show section' : 'Hide section'}
                                >
                                  {isHidden ? (
                                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  
                  {sections.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <GripVertical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sections configured</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Hidden Sections */}
        {showVisibilityToggle && onHiddenSectionsChange && availableHiddenSections.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 text-muted-foreground">Hidden Sections</h4>
            <div className="space-y-2">
              {availableHiddenSections.map((section) => {
                const config = SECTION_CONFIG[section];
                const IconComponent = config.icon;

                return (
                  <div
                    key={section}
                    className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30"
                  >
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm text-muted-foreground">{config.label}</h5>
                      <p className="text-xs text-muted-foreground/70">{config.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSectionVisibility(section)}
                      className="text-xs"
                    >
                      Show
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Quick Actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const recommendedOrder: SectionOrder[] = [
                  'header', 'summary', 'skills', 'projects', 'experience', 'educationAndCertifications'
                ];
                onChange(recommendedOrder);
              }}
            >
              Recommended Order
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const skillsFirstOrder: SectionOrder[] = [
                  'header', 'skills', 'summary', 'projects', 'experience', 'educationAndCertifications'
                ];
                onChange(skillsFirstOrder);
              }}
            >
              Skills First
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const experienceFirstOrder: SectionOrder[] = [
                  'header', 'summary', 'experience', 'skills', 'projects', 'educationAndCertifications'
                ];
                onChange(experienceFirstOrder);
              }}
            >
              Experience First
            </Button>
          </div>
        </div>

        {/* Compact Resume Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h5 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            🎯 One-Page Resume Optimization
          </h5>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• <strong>Recommended order:</strong> Header → Summary → Skills → Projects → Experience → Education</li>
            <li>• <strong>Maximum 6 sections</strong> for optimal single-page layout</li>
            <li>• <strong>Skills grouped</strong> by Languages, Frameworks, Tools, Cloud for quick scanning</li>
            <li>• <strong>Projects limited to 2-3</strong> most impactful ones with metrics</li>
            <li>• <strong>Experience bullets</strong> capped at 2 per role for conciseness</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified version for inline use
interface InlineSectionOrderProps {
  sections: SectionOrder[];
  onChange: (sections: SectionOrder[]) => void;
  className?: string;
}

export function InlineSectionOrder({ sections, onChange, className = '' }: InlineSectionOrderProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <div className={className}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="inline-sections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-1"
            >
              {sections.map((section, index) => {
                const config = SECTION_CONFIG[section];
                const IconComponent = config.icon;

                return (
                  <Draggable key={section} draggableId={section} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          flex items-center gap-2 p-2 rounded border text-sm cursor-grab active:cursor-grabbing
                          ${snapshot.isDragging 
                            ? 'bg-primary/5 border-primary shadow-sm' 
                            : 'bg-background border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 font-medium">{config.label}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}