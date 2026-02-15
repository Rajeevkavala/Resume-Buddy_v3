'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  Wand2,
  Target,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { ResumeData } from '@/lib/types';

interface AIContentAssistantProps {
  resumeData: ResumeData;
  currentSection: string;
  currentContent?: string;
  onSuggestionApply: (content: string) => void;
  className?: string;
}

interface ContentSuggestion {
  id: string;
  type: 'achievement' | 'summary' | 'skill' | 'improvement';
  content: string;
  category: string;
  confidence: number;
  reasoning: string;
}

// Mock AI suggestions - in a real app, this would call your AI service
const mockSuggestions: ContentSuggestion[] = [
  {
    id: '1',
    type: 'achievement',
    content: 'Increased system performance by 40% through optimization of database queries and implementation of Redis caching strategies',
    category: 'Technical Achievement',
    confidence: 95,
    reasoning: 'Includes specific metrics and technical details that recruiters look for'
  },
  {
    id: '2',
    type: 'achievement',
    content: 'Led cross-functional team of 8 developers to deliver critical features 2 weeks ahead of schedule, resulting in 15% revenue increase',
    category: 'Leadership',
    confidence: 92,
    reasoning: 'Demonstrates leadership skills with quantified business impact'
  },
  {
    id: '3',
    type: 'summary',
    content: 'Results-driven Full-Stack Developer with 5+ years of experience building scalable web applications. Proven track record of optimizing system performance and leading high-impact projects that drive business growth.',
    category: 'Professional Summary',
    confidence: 88,
    reasoning: 'Concise, impactful summary that highlights key strengths and experience'
  },
  {
    id: '4',
    type: 'improvement',
    content: 'Consider adding specific technologies used (e.g., React, Node.js, AWS) to make your skills more searchable by ATS systems',
    category: 'ATS Optimization',
    confidence: 90,
    reasoning: 'Adding specific technology keywords improves ATS matching'
  }
];

export function AIContentAssistant({ 
  resumeData, 
  currentSection, 
  currentContent = '',
  onSuggestionApply,
  className = ''
}: AIContentAssistantProps) {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [customPrompt, setCustomPrompt] = useState('');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  const generateSuggestions = async (prompt?: string) => {
    setIsGenerating(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call your AI service
      // const result = await generateContentSuggestions({
      //   section: currentSection,
      //   currentContent,
      //   resumeData,
      //   customPrompt: prompt,
      //   jobRole: resumeData.jobRole,
      //   targetIndustry: resumeData.industry
      // });
      
      // For now, use mock suggestions with some filtering based on section
      const filteredSuggestions = mockSuggestions.filter(suggestion => {
        if (currentSection === 'summary') return suggestion.type === 'summary';
        if (currentSection === 'experience') return suggestion.type === 'achievement';
        return true;
      });
      
      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [id]: type }));
    // In a real app, send feedback to improve AI suggestions
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Show success toast
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getSectionSpecificPrompts = () => {
    const prompts: Record<string, string[]> = {
      summary: [
        'Write a compelling professional summary',
        'Create an executive summary highlighting leadership',
        'Write a summary focusing on technical skills',
        'Create an entry-level professional summary'
      ],
      experience: [
        'Write achievement bullets with metrics',
        'Improve this job description with action verbs',
        'Add quantifiable results to achievements',
        'Rewrite using industry keywords'
      ],
      skills: [
        'Suggest relevant technical skills',
        'Organize skills by category',
        'Add trending skills for this industry',
        'Optimize skills for ATS'
      ],
      projects: [
        'Write compelling project descriptions',
        'Add technical details and impact',
        'Highlight business value',
        'Include relevant metrics'
      ]
    };

    return prompts[currentSection] || [
      'Improve the content quality',
      'Add more specific details',
      'Make it more impactful',
      'Optimize for ATS'
    ];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800';
    if (confidence >= 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Writing Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get AI-powered suggestions to improve your {currentSection} section
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions">
              <Lightbulb className="w-4 h-4 mr-1" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="improve">
              <TrendingUp className="w-4 h-4 mr-1" />
              Improve
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Target className="w-4 h-4 mr-1" />
              Custom
            </TabsTrigger>
          </TabsList>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="mt-4">
            <div className="space-y-4">
              <Button 
                onClick={() => generateSuggestions()}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating suggestions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Suggestions
                  </>
                )}
              </Button>

              {suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div 
                      key={suggestion.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.category}
                          </Badge>
                          <Badge 
                            className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                          >
                            {suggestion.confidence}% confidence
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuggestionFeedback(suggestion.id, 'up')}
                            className={feedback[suggestion.id] === 'up' ? 'text-green-600' : ''}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuggestionFeedback(suggestion.id, 'down')}
                            className={feedback[suggestion.id] === 'down' ? 'text-red-600' : ''}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm leading-relaxed">
                        {suggestion.content}
                      </p>

                      <p className="text-xs text-muted-foreground italic">
                        💡 {suggestion.reasoning}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSuggestionApply(suggestion.content)}
                        >
                          <Wand2 className="w-4 h-4 mr-1" />
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(suggestion.content)}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {suggestions.length === 0 && !isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Generate AI Suggestions" to get personalized content recommendations</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Improve Current Content Tab */}
          <TabsContent value="improve" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Current Content
                </label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {currentContent || 'No content selected. Select text in your resume to improve it.'}
                </div>
              </div>

              <Button 
                onClick={() => generateSuggestions(`Improve this content: ${currentContent}`)}
                disabled={isGenerating || !currentContent}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Improving content...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Improve This Content
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                {getSectionSpecificPrompts().map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => generateSuggestions(prompt)}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Custom Prompt Tab */}
          <TabsContent value="custom" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Custom Instructions
                </label>
                <Textarea
                  placeholder="E.g., 'Write a bullet point about improving database performance with specific metrics' or 'Create a summary for a senior software engineer transitioning to management'"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={() => generateSuggestions(customPrompt)}
                disabled={isGenerating || !customPrompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Generate Custom Content
                  </>
                )}
              </Button>

              <div className="bg-muted p-3 rounded-lg">
                <h5 className="font-medium text-sm mb-1">
                  💡 Tips for better results
                </h5>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Be specific about what you want (e.g., "achievement with metrics")</li>
                  <li>• Mention your industry or role for relevant suggestions</li>
                  <li>• Include context about the company or project if relevant</li>
                  <li>• Ask for specific formats (bullets, paragraphs, etc.)</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Simplified inline version for quick suggestions
interface InlineAIAssistantProps {
  onSuggestion: (content: string) => void;
  sectionType: string;
  placeholder?: string;
}

export function InlineAIAssistant({ 
  onSuggestion, 
  sectionType, 
  placeholder = "Get AI suggestions..." 
}: InlineAIAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQuickSuggestion = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const suggestions = {
        achievement: 'Increased system performance by 40% through optimization of database queries and implementation of caching strategies',
        summary: 'Results-driven developer with 5+ years of experience building scalable applications and leading cross-functional teams',
        skill: 'JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, PostgreSQL'
      };
      
      onSuggestion(suggestions[sectionType as keyof typeof suggestions] || 'Sample content generated by AI');
    } catch (error) {
      console.error('Failed to generate suggestion:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={generateQuickSuggestion}
      disabled={isGenerating}
      className="text-xs"
    >
      {isGenerating ? (
        <>
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3 mr-1" />
          {placeholder}
        </>
      )}
    </Button>
  );
}