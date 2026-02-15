'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, User, Code, Briefcase, Award, GraduationCap } from 'lucide-react';
import type { QATopic } from '@/lib/types';

interface TopicSelectorProps {
  selectedTopic: QATopic;
  onSelectTopic: (topic: QATopic) => void;
  disabled?: boolean;
}

const topics: { id: QATopic; title: string; description: string; icon: typeof User }[] = [
  { id: 'General', title: 'General', description: 'Career progression and professional overview', icon: User },
  { id: 'Technical', title: 'Technical', description: 'Technology expertise and implementation', icon: Code },
  { id: 'Work Experience', title: 'Work Experience', description: 'Detailed role and project discussions', icon: Briefcase },
  { id: 'Projects', title: 'Projects', description: 'Specific project deep-dives and outcomes', icon: Target },
  { id: 'Career Goals', title: 'Career Goals', description: 'Future aspirations and motivation', icon: Award },
  { id: 'Education', title: 'Education', description: 'Academic achievements and learning', icon: GraduationCap },
];

export function TopicSelector({ selectedTopic, onSelectTopic, disabled }: TopicSelectorProps) {
  const selectedTopicData = topics.find(t => t.id === selectedTopic);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Choose Topic</CardTitle>
            <CardDescription className="text-xs">
              Select a focus area for your Q&A
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Horizontal Scrollable Pills - Works on all devices */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {topics.map((topic) => {
            const IconComponent = topic.icon;
            const isSelected = selectedTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => onSelectTopic(topic.id)}
                disabled={disabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border whitespace-nowrap transition-all shrink-0",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
                  isSelected 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border-border hover:border-primary/50 hover:bg-muted/50",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{topic.title}</span>
              </button>
            );
          })}
        </div>
        
        {/* Selected Topic Description */}
        {selectedTopicData && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {selectedTopicData.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { topics };
