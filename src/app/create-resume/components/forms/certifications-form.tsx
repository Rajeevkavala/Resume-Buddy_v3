'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ResumeData } from '@/lib/types';

type Certification = NonNullable<ResumeData['certifications']>[number];

interface CertificationsFormProps {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}

export function CertificationsForm({ certifications, onChange }: CertificationsFormProps) {
  const addCertification = () => {
    onChange([
      ...certifications,
      {
        name: '',
        issuer: '',
        date: '',
        credentialId: '',
        url: ''
      }
    ]);
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const deleteCertification = (index: number) => {
    onChange(certifications.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {certifications.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border/60 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">No certifications added</p>
          <Button variant="outline" size="sm" onClick={addCertification} className="border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>
      ) : (
        <>
          {certifications.map((cert, certIndex) => (
            <div key={certIndex} className="p-4 border border-border/60 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-sm font-medium">Certification {certIndex + 1}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteCertification(certIndex)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Certification Name *</Label>
                  <Input
                    value={cert.name || ''}
                    onChange={(e) => updateCertification(certIndex, 'name', e.target.value)}
                    placeholder="AWS Solutions Architect"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Issuing Organization *</Label>
                  <Input
                    value={cert.issuer || ''}
                    onChange={(e) => updateCertification(certIndex, 'issuer', e.target.value)}
                    placeholder="Amazon Web Services"
                    className="border-border/60"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Date</Label>
                  <Input
                    value={cert.date || ''}
                    onChange={(e) => updateCertification(certIndex, 'date', e.target.value)}
                    placeholder="Jan 2024"
                    className="border-border/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Credential ID</Label>
                  <Input
                    value={cert.credentialId || ''}
                    onChange={(e) => updateCertification(certIndex, 'credentialId', e.target.value)}
                    placeholder="ABC123XYZ"
                    className="border-border/60"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Verification URL</Label>
                <Input
                  value={cert.url || ''}
                  onChange={(e) => updateCertification(certIndex, 'url', e.target.value)}
                  placeholder="https://www.credly.com/badges/..."
                  className="border-border/60"
                />
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" onClick={addCertification} className="w-full border-border/60">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Certification
          </Button>
        </>
      )}
    </div>
  );
}
