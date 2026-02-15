'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import type { ResumeData } from '@/lib/types';

type Project = NonNullable<ResumeData['projects']>[number];

interface ProjectsFormProps {
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

export function ProjectsForm({ projects, onChange }: ProjectsFormProps) {
  const [newTech, setNewTech] = useState('');
  const [activeTechProject, setActiveTechProject] = useState<number>(0);

  const addProject = () => {
    onChange([
      ...projects,
      {
        name: '',
        description: '',
        technologies: [],
        githubUrl: '',
        liveDemoUrl: '',
        link: '',
        achievements: []
      }
    ]);
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const deleteProject = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
  };

  const addTechnology = (projectIndex: number) => {
    if (!newTech.trim()) return;
    const updated = [...projects];
    updated[projectIndex] = {
      ...updated[projectIndex],
      technologies: [...updated[projectIndex].technologies, newTech.trim()]
    };
    onChange(updated);
    setNewTech('');
  };

  const removeTechnology = (projectIndex: number, techIndex: number) => {
    const updated = [...projects];
    updated[projectIndex] = {
      ...updated[projectIndex],
      technologies: updated[projectIndex].technologies.filter((_, i) => i !== techIndex)
    };
    onChange(updated);
  };

  const handleTechKeyDown = (e: React.KeyboardEvent, projectIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTechnology(projectIndex);
    }
  };

  const addAchievement = (projectIndex: number) => {
    const updated = [...projects];
    updated[projectIndex] = {
      ...updated[projectIndex],
      achievements: [...(updated[projectIndex].achievements || []), '']
    };
    onChange(updated);
  };

  const updateAchievement = (projectIndex: number, achievementIndex: number, value: string) => {
    const updated = [...projects];
    updated[projectIndex].achievements[achievementIndex] = value;
    onChange(updated);
  };

  const deleteAchievement = (projectIndex: number, achievementIndex: number) => {
    const updated = [...projects];
    updated[projectIndex] = {
      ...updated[projectIndex],
      achievements: updated[projectIndex].achievements.filter((_, i) => i !== achievementIndex)
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {projects.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border/60 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No projects added</p>
          <Button variant="outline" size="sm" onClick={addProject} className="border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
      ) : (
        <>
          {projects.map((project, projectIndex) => (
            <div key={projectIndex} className="p-4 border border-border/60 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-sm font-medium">Project {projectIndex + 1}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteProject(projectIndex)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Project Name *</Label>
                <Input
                  value={project.name || ''}
                  onChange={(e) => updateProject(projectIndex, 'name', e.target.value)}
                  placeholder="E-commerce Platform"
                  className="border-border/60"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Textarea
                  value={project.description || ''}
                  onChange={(e) => updateProject(projectIndex, 'description', e.target.value)}
                  placeholder="A full-stack e-commerce platform with real-time inventory management..."
                  rows={2}
                  className="border-border/60 resize-none"
                />
              </div>
              
              {/* Technologies */}
              <div className="space-y-2">
                <Label className="text-sm">Technologies</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {project.technologies.map((tech, techIndex) => (
                    <Badge 
                      key={techIndex} 
                      variant="secondary" 
                      className="pl-2 pr-1 py-1 gap-1"
                    >
                      <span className="text-xs">{tech}</span>
                      <button
                        onClick={() => removeTechnology(projectIndex, techIndex)}
                        className="p-0.5 rounded hover:bg-muted-foreground/20"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={activeTechProject === projectIndex ? newTech : ''}
                    onChange={(e) => {
                      setActiveTechProject(projectIndex);
                      setNewTech(e.target.value);
                    }}
                    onFocus={() => setActiveTechProject(projectIndex)}
                    onKeyDown={(e) => handleTechKeyDown(e, projectIndex)}
                    placeholder="Add technology and press Enter"
                    className="flex-1 border-border/60 text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addTechnology(projectIndex)}
                    disabled={!newTech.trim() || activeTechProject !== projectIndex}
                    className="border-border/60"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">GitHub URL</Label>
                  <Input
                    value={project.githubUrl || ''}
                    onChange={(e) => updateProject(projectIndex, 'githubUrl', e.target.value)}
                    placeholder="github.com/username/project"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Live Demo URL</Label>
                  <Input
                    value={project.liveDemoUrl || project.link || ''}
                    onChange={(e) => updateProject(projectIndex, 'liveDemoUrl', e.target.value)}
                    placeholder="https://project-demo.com"
                    className="border-border/60"
                  />
                </div>
              </div>
              
              {/* Achievements */}
              <div className="space-y-2">
                <Label className="text-sm">Key Highlights</Label>
                {(project.achievements || []).map((achievement, achIndex) => (
                  <div key={achIndex} className="flex gap-2">
                    <Input
                      value={achievement}
                      onChange={(e) => updateAchievement(projectIndex, achIndex, e.target.value)}
                      placeholder="• Implemented feature X that improved Y by Z%"
                      className="flex-1 border-border/60 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAchievement(projectIndex, achIndex)}
                      className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => addAchievement(projectIndex)}
                  className="text-muted-foreground"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Highlight
                </Button>
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addProject} className="w-full border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Project
          </Button>
        </>
      )}
    </div>
  );
}
