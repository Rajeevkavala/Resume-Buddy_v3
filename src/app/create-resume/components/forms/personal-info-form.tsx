'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ResumeData } from '@/lib/types';

type PersonalInfo = ResumeData['personalInfo'];

const defaultPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
};

interface PersonalInfoFormProps {
  data?: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export function PersonalInfoForm({ data = defaultPersonalInfo, onChange }: PersonalInfoFormProps) {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm">Full Name *</Label>
          <Input
            id="fullName"
            value={data.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="John Doe"
            className="border-border/60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">Email *</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="john@example.com"
            className="border-border/60"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm">Phone</Label>
          <Input
            id="phone"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="border-border/60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm">Location</Label>
          <Input
            id="location"
            value={data.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="San Francisco, CA"
            className="border-border/60"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
          <Input
            id="linkedin"
            value={data.linkedin || ''}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            placeholder="linkedin.com/in/johndoe"
            className="border-border/60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="github" className="text-sm">GitHub</Label>
          <Input
            id="github"
            value={data.github || ''}
            onChange={(e) => handleChange('github', e.target.value)}
            placeholder="github.com/johndoe"
            className="border-border/60"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="portfolio" className="text-sm">Portfolio / Website</Label>
        <Input
          id="portfolio"
          value={data.portfolio || data.website || ''}
          onChange={(e) => handleChange('portfolio', e.target.value)}
          placeholder="https://johndoe.com"
          className="border-border/60"
        />
      </div>
    </div>
  );
}
