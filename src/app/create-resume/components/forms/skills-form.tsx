'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Trash2 } from 'lucide-react';
import type { ResumeData } from '@/lib/types';

type SkillGroup = ResumeData['skills'][number];

interface SkillsFormProps {
  skills: SkillGroup[];
  onChange: (skills: SkillGroup[]) => void;
}

export function SkillsForm({ skills, onChange }: SkillsFormProps) {
  const [newSkill, setNewSkill] = useState('');
  const [activeCategory, setActiveCategory] = useState<number>(0);

  const addCategory = () => {
    onChange([...skills, { category: '', items: [] }]);
    setActiveCategory(skills.length);
  };

  const updateCategory = (index: number, category: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], category };
    onChange(updated);
  };

  const deleteCategory = (index: number) => {
    onChange(skills.filter((_, i) => i !== index));
    if (activeCategory >= index && activeCategory > 0) {
      setActiveCategory(activeCategory - 1);
    }
  };

  const addSkillToCategory = (categoryIndex: number) => {
    if (!newSkill.trim()) return;
    const updated = [...skills];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      items: [...updated[categoryIndex].items, newSkill.trim()]
    };
    onChange(updated);
    setNewSkill('');
  };

  const removeSkillFromCategory = (categoryIndex: number, skillIndex: number) => {
    const updated = [...skills];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      items: updated[categoryIndex].items.filter((_, i) => i !== skillIndex)
    };
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent, categoryIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkillToCategory(categoryIndex);
    }
  };

  return (
    <div className="space-y-4">
      {skills.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border/60 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No skill categories yet</p>
          <Button variant="outline" size="sm" onClick={addCategory} className="border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Skill Category
          </Button>
        </div>
      ) : (
        <>
          {skills.map((group, groupIndex) => (
            <div key={groupIndex} className="p-4 border border-border/60 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={group.category}
                  onChange={(e) => updateCategory(groupIndex, e.target.value)}
                  placeholder="Category (e.g., Programming Languages)"
                  className="flex-1 border-border/60 font-medium"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteCategory(groupIndex)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Skills list */}
              <div className="flex flex-wrap gap-2">
                {group.items.map((skill, skillIndex) => (
                  <Badge 
                    key={skillIndex} 
                    variant="secondary" 
                    className="pl-2 pr-1 py-1 gap-1"
                  >
                    <span className="text-xs">{skill}</span>
                    <button
                      onClick={() => removeSkillFromCategory(groupIndex, skillIndex)}
                      className="p-0.5 rounded hover:bg-muted-foreground/20"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              {/* Add skill input */}
              <div className="flex gap-2">
                <Input
                  value={activeCategory === groupIndex ? newSkill : ''}
                  onChange={(e) => {
                    setActiveCategory(groupIndex);
                    setNewSkill(e.target.value);
                  }}
                  onFocus={() => setActiveCategory(groupIndex)}
                  onKeyDown={(e) => handleKeyDown(e, groupIndex)}
                  placeholder="Add skill and press Enter"
                  className="flex-1 border-border/60 text-sm"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addSkillToCategory(groupIndex)}
                  disabled={!newSkill.trim() || activeCategory !== groupIndex}
                  className="border-border/60"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addCategory} className="w-full border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Category
          </Button>
        </>
      )}
    </div>
  );
}
