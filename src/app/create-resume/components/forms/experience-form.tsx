'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ResumeData } from '@/lib/types';

type Experience = ResumeData['experience'][number];

interface ExperienceFormProps {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
}

export function ExperienceForm({ experience, onChange }: ExperienceFormProps) {
  const addExperience = () => {
    onChange([
      ...experience,
      {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        achievements: ['']
      }
    ]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    // If current is toggled on, clear endDate
    if (field === 'current' && value === true) {
      updated[index].endDate = '';
    }
    onChange(updated);
  };

  const deleteExperience = (index: number) => {
    onChange(experience.filter((_, i) => i !== index));
  };

  const addAchievement = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex].achievements = [...updated[expIndex].achievements, ''];
    onChange(updated);
  };

  const updateAchievement = (expIndex: number, achievementIndex: number, value: string) => {
    const updated = [...experience];
    updated[expIndex].achievements[achievementIndex] = value;
    onChange(updated);
  };

  const deleteAchievement = (expIndex: number, achievementIndex: number) => {
    const updated = [...experience];
    updated[expIndex].achievements = updated[expIndex].achievements.filter((_, i) => i !== achievementIndex);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {experience.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border/60 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No work experience added</p>
          <Button variant="outline" size="sm" onClick={addExperience} className="border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
      ) : (
        <>
          {experience.map((exp, expIndex) => (
            <div key={expIndex} className="p-4 border border-border/60 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-sm font-medium">Position {expIndex + 1}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteExperience(expIndex)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Job Title *</Label>
                  <Input
                    value={exp.title || ''}
                    onChange={(e) => updateExperience(expIndex, 'title', e.target.value)}
                    placeholder="Software Engineer"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Company *</Label>
                  <Input
                    value={exp.company || ''}
                    onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                    placeholder="Google"
                    className="border-border/60"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Location</Label>
                <Input
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(expIndex, 'location', e.target.value)}
                  placeholder="Mountain View, CA"
                  className="border-border/60"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Start Date</Label>
                  <Input
                    value={exp.startDate || ''}
                    onChange={(e) => updateExperience(expIndex, 'startDate', e.target.value)}
                    placeholder="Jan 2022"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">End Date</Label>
                  <Input
                    value={exp.endDate || ''}
                    onChange={(e) => updateExperience(expIndex, 'endDate', e.target.value)}
                    placeholder="Present"
                    disabled={exp.current}
                    className="border-border/60"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={exp.current || false}
                  onCheckedChange={(checked) => updateExperience(expIndex, 'current', checked)}
                />
                <Label className="text-sm text-muted-foreground">Currently working here</Label>
              </div>
              
              {/* Achievements */}
              <div className="space-y-2">
                <Label className="text-sm">Key Achievements</Label>
                {exp.achievements.map((achievement, achIndex) => (
                  <div key={achIndex} className="flex gap-2">
                    <Textarea
                      value={achievement}
                      onChange={(e) => updateAchievement(expIndex, achIndex, e.target.value)}
                      placeholder="• Increased system performance by 40% through optimization..."
                      rows={2}
                      className="flex-1 border-border/60 resize-none text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAchievement(expIndex, achIndex)}
                      className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => addAchievement(expIndex)}
                  className="text-muted-foreground"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Achievement
                </Button>
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addExperience} className="w-full border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Position
          </Button>
        </>
      )}
    </div>
  );
}
