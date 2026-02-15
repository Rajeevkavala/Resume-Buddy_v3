'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SummaryFormProps {
  value: string;
  onChange: (value: string) => void;
}

export function SummaryForm({ value, onChange }: SummaryFormProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="summary" className="text-sm">Professional Summary</Label>
      <Textarea
        id="summary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="A brief 2-3 sentence summary of your professional experience, skills, and career goals..."
        rows={4}
        className="border-border/60 resize-none"
      />
      <p className="text-xs text-muted-foreground">
        {value.length}/500 characters (recommended: 150-300)
      </p>
    </div>
  );
}
