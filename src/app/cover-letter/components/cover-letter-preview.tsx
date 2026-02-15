'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Copy, 
  Check,
  FileText,
  Lightbulb,
  Clock,
  Hash,
  Sparkles,
  RefreshCw,
  Loader2,
  Eye,
  Code
} from 'lucide-react';
import { toast } from 'sonner';
import type { GenerateCoverLetterOutput } from '@/ai/flows/generate-cover-letter';
import { cn } from '@/lib/utils';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

interface CoverLetterPreviewProps {
  coverLetter: GenerateCoverLetterOutput;
  companyName?: string;
  onRegenerate: () => void;
}

export function CoverLetterPreview({ coverLetter, companyName, onRegenerate }: CoverLetterPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter.coverLetter);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // Dynamic import for PDF generation (client-side only)
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set up document styling
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25;
      const contentWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Helper function to add wrapped text
      const addWrappedText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', lineHeight: number = 6) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        
        const lines = doc.splitTextToSize(text, contentWidth);
        
        for (const line of lines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        }
      };

      // Add header
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(today, margin, yPosition);
      yPosition += 15;

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Add cover letter content with proper paragraph spacing
      const paragraphs = coverLetter.coverLetter.split('\n\n').filter(p => p.trim());
      
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        
        // Check if it's a greeting or closing (shorter lines)
        const isGreeting = paragraph.toLowerCase().startsWith('dear') || paragraph.toLowerCase().startsWith('to whom');
        const isClosing = paragraph.toLowerCase().startsWith('sincerely') || 
                         paragraph.toLowerCase().startsWith('best regards') ||
                         paragraph.toLowerCase().startsWith('regards') ||
                         paragraph.toLowerCase().startsWith('thank you');
        
        if (isGreeting || isClosing) {
          addWrappedText(paragraph, 11, 'normal', 6);
          yPosition += 8;
        } else {
          addWrappedText(paragraph, 11, 'normal', 6);
          yPosition += 6;
        }
      }

      // Generate filename
      const filename = companyName 
        ? `Cover_Letter_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        : 'Cover_Letter.pdf';

      // Save the PDF
      doc.save(filename);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={staggerChildren}
      className="space-y-6"
    >
      {/* Stats Bar */}
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="gap-1.5 py-1">
          <Hash className="w-3 h-3" />
          {coverLetter.wordCount} words
        </Badge>
        <Badge variant="secondary" className="gap-1.5 py-1">
          <Clock className="w-3 h-3" />
          {coverLetter.estimatedReadTime} read
        </Badge>
        <Badge variant="secondary" className="gap-1.5 py-1">
          <Sparkles className="w-3 h-3" />
          {coverLetter.matchedSkills.length} skills matched
        </Badge>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Highlights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-0">
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Your Cover Letter
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="gap-1.5"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Export PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div 
                  ref={contentRef}
                  className="prose prose-sm dark:prose-invert max-w-none"
                >
                  {/* Render cover letter with proper formatting */}
                  <div className="space-y-4 font-serif leading-relaxed text-foreground">
                    {coverLetter.coverLetter.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-sm sm:text-base">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Key Highlights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Key Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {coverLetter.keyHighlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <span className="text-muted-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Matched Skills */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    Skills Addressed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {coverLetter.matchedSkills.map((skill, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Paragraph Breakdown */}
              <Card className="sm:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-500" />
                    Letter Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Opening</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{coverLetter.openingParagraph}</p>
                  </div>
                  {coverLetter.bodyParagraphs.map((body, index) => (
                    <div key={index}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Body {index + 1}</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{body}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Closing</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{coverLetter.closingParagraph}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Regenerate Option */}
      <motion.div variants={fadeInUp} className="flex justify-center pt-2">
        <Button 
          variant="outline" 
          onClick={onRegenerate}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Generate New Version
        </Button>
      </motion.div>
    </motion.div>
  );
}
