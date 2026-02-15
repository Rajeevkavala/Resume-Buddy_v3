'use client';

import { JobRole } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Briefcase } from 'lucide-react';

interface RoleSelectorProps {
  value: JobRole | '';
  onValueChange: (value: JobRole | '') => void;
  className?: string;
}

const jobRoles: JobRole[] = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Mobile Developer",
  "UI/UX Designer",
  "Product Manager",
  "QA Engineer",
  "Software Engineer",
  "Other"
];

const roleIcons: Record<JobRole, string> = {
  "Frontend Developer": "🌐",
  "Backend Developer": "⚙️",
  "Full Stack Developer": "🔄",
  "DevOps Engineer": "🚀",
  "Data Scientist": "📊",
  "Mobile Developer": "📱",
  "UI/UX Designer": "🎨",
  "Product Manager": "📋",
  "QA Engineer": "🔍",
  "Software Engineer": "💻",
  "Other": "💼"
};

export function RoleSelector({ value, onValueChange, className }: RoleSelectorProps) {
  const handleClearRole = () => {
    onValueChange('');
  };

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="role-select" className="font-medium flex items-center gap-2">
          <div className="p-1 bg-primary/10 rounded">
            <Briefcase className="h-4 w-4 text-primary" />
          </div>
          Target Role
        </Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearRole}  
            className="h-7 text-xs text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
          >
            Clear
          </Button>
        )}
      </div>
      <Select
        value={value || undefined}
        onValueChange={(val) => onValueChange(val as JobRole)}
      >
        <SelectTrigger 
          id="role-select" 
          className="w-full h-12"
        >
          <SelectValue 
            placeholder="Choose your target role..." 
          />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {jobRoles.map((role) => (
            <SelectItem 
              key={role} 
              value={role}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 py-1">
                <span className="text-lg">{roleIcons[role]}</span>
                <span className="font-medium">{role}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-sm font-medium"
          >
            <span className="mr-2">{roleIcons[value]}</span>
            {value}
          </Badge>
        </div>
      )}
    </div>
  );
}