'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ResumeData } from '@/lib/types';

type Education = ResumeData['education'][number];

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export function EducationForm({ education, onChange }: EducationFormProps) {
  const addEducation = () => {
    onChange([
      ...education,
      {
        degree: '',
        institution: '',
        location: '',
        graduationDate: '',
        gpa: '',
        major: '',
        minor: ''
      }
    ]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const deleteEducation = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {education.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border/60 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No education added</p>
          <Button variant="outline" size="sm" onClick={addEducation} className="border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </div>
      ) : (
        <>
          {education.map((edu, eduIndex) => (
            <div key={eduIndex} className="p-4 border border-border/60 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-sm font-medium">Education {eduIndex + 1}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteEducation(eduIndex)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Degree *</Label>
                  <Input
                    value={edu.degree || ''}
                    onChange={(e) => updateEducation(eduIndex, 'degree', e.target.value)}
                    placeholder="Bachelor of Science in Computer Science"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Institution *</Label>
                  <Input
                    value={edu.institution || ''}
                    onChange={(e) => updateEducation(eduIndex, 'institution', e.target.value)}
                    placeholder="Stanford University"
                    className="border-border/60"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Location</Label>
                  <Input
                    value={edu.location || ''}
                    onChange={(e) => updateEducation(eduIndex, 'location', e.target.value)}
                    placeholder="Stanford, CA"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Graduation Date</Label>
                  <Input
                    value={edu.graduationDate || ''}
                    onChange={(e) => updateEducation(eduIndex, 'graduationDate', e.target.value)}
                    placeholder="May 2023"
                    className="border-border/60"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">GPA</Label>
                  <Input
                    value={edu.gpa || ''}
                    onChange={(e) => updateEducation(eduIndex, 'gpa', e.target.value)}
                    placeholder="3.8/4.0"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Major</Label>
                  <Input
                    value={edu.major || ''}
                    onChange={(e) => updateEducation(eduIndex, 'major', e.target.value)}
                    placeholder="Computer Science"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Minor</Label>
                  <Input
                    value={edu.minor || ''}
                    onChange={(e) => updateEducation(eduIndex, 'minor', e.target.value)}
                    placeholder="Mathematics"
                    className="border-border/60"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addEducation} className="w-full border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Education
          </Button>
        </>
      )}
    </div>
  );
}
