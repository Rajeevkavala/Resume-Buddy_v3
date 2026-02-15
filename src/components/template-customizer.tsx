'use client';

import React, { useState } from 'react';
import { ColorScheme, FontPairing, TemplateCustomization, SectionOrder } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Type, Layout, Sliders } from 'lucide-react';

interface TemplateCustomizerProps {
  customization: TemplateCustomization;
  onChange: (customization: TemplateCustomization) => void;
}

const FONT_OPTIONS = {
  heading: ['Inter', 'Roboto', 'Poppins', 'Georgia', 'Montserrat', 'Playfair Display', 'Open Sans'],
  body: ['Roboto', 'Open Sans', 'Lato', 'Arial', 'Source Sans Pro', 'Merriweather', 'Inter'],
};

const SECTION_OPTIONS: { value: SectionOrder; label: string }[] = [
  { value: 'header', label: 'Header' },
  { value: 'summary', label: 'Professional Summary' },
  { value: 'skills', label: 'Skills' },
  { value: 'experience', label: 'Experience' },
  { value: 'educationAndCertifications', label: 'Education & Certifications' },
  { value: 'projects', label: 'Projects' },
];

export function TemplateCustomizer({ customization, onChange }: TemplateCustomizerProps) {
  const updateColorScheme = (key: keyof ColorScheme, value: string) => {
    onChange({
      ...customization,
      colorScheme: {
        ...customization.colorScheme,
        [key]: value,
      },
    });
  };

  const updateFonts = (key: keyof FontPairing, value: string) => {
    onChange({
      ...customization,
      fonts: {
        ...customization.fonts,
        [key]: value,
      },
    });
  };

  const updateSpacing = (value: 'compact' | 'normal' | 'relaxed') => {
    onChange({
      ...customization,
      spacing: value,
    });
  };

  const updateFontSize = (value: 'small' | 'medium' | 'large') => {
    onChange({
      ...customization,
      fontSize: value,
    });
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...customization.sectionOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange({
      ...customization,
      sectionOrder: newOrder,
    });
  };

  const moveSectionDown = (index: number) => {
    if (index === customization.sectionOrder.length - 1) return;
    const newOrder = [...customization.sectionOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange({
      ...customization,
      sectionOrder: newOrder,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Customize Template</CardTitle>
        <CardDescription>
          Personalize your resume template with colors, fonts, and layout options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">
              <Palette className="w-4 h-4 mr-2" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="fonts">
              <Type className="w-4 h-4 mr-2" />
              Fonts
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Layout className="w-4 h-4 mr-2" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="spacing">
              <Sliders className="w-4 h-4 mr-2" />
              Spacing
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="primary-color"
                    type="color"
                    value={customization.colorScheme.primary}
                    onChange={(e) => updateColorScheme('primary', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={customization.colorScheme.primary}
                    onChange={(e) => updateColorScheme('primary', e.target.value)}
                    placeholder="#1A73E8"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for headings and key elements
                </p>
              </div>

              <div>
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={customization.colorScheme.secondary}
                    onChange={(e) => updateColorScheme('secondary', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={customization.colorScheme.secondary}
                    onChange={(e) => updateColorScheme('secondary', e.target.value)}
                    placeholder="#333333"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for secondary text and accents
                </p>
              </div>

              <div>
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="accent-color"
                    type="color"
                    value={customization.colorScheme.accent}
                    onChange={(e) => updateColorScheme('accent', e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={customization.colorScheme.accent}
                    onChange={(e) => updateColorScheme('accent', e.target.value)}
                    placeholder="#F1F3F4"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for backgrounds and highlights
                </p>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  onChange({
                    ...customization,
                    colorScheme: {
                      primary: '#1A73E8',
                      secondary: '#333333',
                      accent: '#F1F3F4',
                    },
                  });
                }}
              >
                Reset to Default Colors
              </Button>
            </div>
          </TabsContent>

          {/* Fonts Tab */}
          <TabsContent value="fonts" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="heading-font">Heading Font</Label>
                <Select
                  value={customization.fonts.heading}
                  onValueChange={(value) => updateFonts('heading', value)}
                >
                  <SelectTrigger id="heading-font" className="mt-1">
                    <SelectValue placeholder="Select heading font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.heading.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Font used for section headings and your name
                </p>
              </div>

              <div>
                <Label htmlFor="body-font">Body Font</Label>
                <Select
                  value={customization.fonts.body}
                  onValueChange={(value) => updateFonts('body', value)}
                >
                  <SelectTrigger id="body-font" className="mt-1">
                    <SelectValue placeholder="Select body font" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.body.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Font used for all body text and descriptions
                </p>
              </div>

              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Select
                  value={customization.fontSize}
                  onValueChange={updateFontSize}
                >
                  <SelectTrigger id="font-size" className="mt-1">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (More content fits)</SelectItem>
                    <SelectItem value="medium">Medium (Recommended)</SelectItem>
                    <SelectItem value="large">Large (Better readability)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4 pt-4">
            <div>
              <Label>Section Order</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Drag sections to reorder them in your resume
              </p>
              <div className="space-y-2">
                {customization.sectionOrder.map((section, index) => {
                  const sectionInfo = SECTION_OPTIONS.find(s => s.value === section);
                  return (
                    <div 
                      key={section} 
                      className="flex items-center gap-2 p-2 bg-secondary rounded-md"
                    >
                      <div className="flex-1">{sectionInfo?.label || section}</div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSectionUp(index)}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSectionDown(index)}
                          disabled={index === customization.sectionOrder.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="spacing">Content Spacing</Label>
              <Select
                value={customization.spacing}
                onValueChange={updateSpacing}
              >
                <SelectTrigger id="spacing" className="mt-1">
                  <SelectValue placeholder="Select spacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">
                    Compact (Fit more content)
                  </SelectItem>
                  <SelectItem value="normal">
                    Normal (Balanced)
                  </SelectItem>
                  <SelectItem value="relaxed">
                    Relaxed (More whitespace)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust spacing between sections and content
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
