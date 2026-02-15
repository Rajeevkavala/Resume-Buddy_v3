'use client';

import { useState } from 'react';
import type { GenerateResumeQAOutput, QATopic } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {Button} from './ui/button';
import {FileQuestion, MessageSquareQuote, CheckSquare, Tags, Briefcase, Code, Award, Target, GraduationCap, User, RefreshCw, Sparkles, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';

import { Label } from './ui/label';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useSubscription } from '@/context/subscription-context';
import { UpgradePrompt, ProBadge } from '@/components/upgrade-prompt';

// Helper function to safely validate QA pair structure
const validateQAPair = (pair: any) => {
  return {
    question: pair?.question || "Question not available",
    answer: pair?.answer || "Answer not available",
    relatedSections: Array.isArray(pair?.relatedSections) ? pair.relatedSections : [],
    keyPoints: Array.isArray(pair?.keyPoints) ? pair.keyPoints : []
  };
};

interface QATabProps {
  qa: Record<QATopic, GenerateResumeQAOutput | null> | null;
  onGenerate: (topic: QATopic, numQuestions: number) => void;
  isLoading: boolean;
  hasDataChanged?: boolean;
  selectedTopic: QATopic;
  setSelectedTopic: (topic: QATopic) => void;
}

const topics: { id: QATopic, title: string, description: string, icon: any, color: string }[] = [
    { id: 'General', title: 'General', description: 'Career progression and professional overview', icon: User, color: 'from-blue-500 to-indigo-600' },
    { id: 'Technical', title: 'Technical', description: 'Technology expertise and implementation', icon: Code, color: 'from-green-500 to-emerald-600' },
    { id: 'Work Experience', title: 'Work Experience', description: 'Detailed role and project discussions', icon: Briefcase, color: 'from-purple-500 to-violet-600' },
    { id: 'Projects', title: 'Projects', description: 'Specific project deep-dives and outcomes', icon: Target, color: 'from-orange-500 to-red-600' },
    { id: 'Career Goals', title: 'Career Goals', description: 'Future aspirations and motivation', icon: Award, color: 'from-pink-500 to-rose-600' },
    { id: 'Education', title: 'Education', description: 'Academic achievements and learning', icon: GraduationCap, color: 'from-teal-500 to-cyan-600' },
];

export default function QATab({qa, onGenerate, isLoading, hasDataChanged, selectedTopic, setSelectedTopic}: QATabProps) {
  const [numQuestions, setNumQuestions] = useState(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { canAccessFeature, isLoading: subscriptionLoading } = useSubscription();
  
  // Check if Q&A feature is accessible (Pro only)
  const hasAccess = canAccessFeature('generate-qa');
  
  const handleGenerateClick = (topic: QATopic) => {
    onGenerate(topic, numQuestions);
    setCurrentQuestionIndex(0); // Reset to first question when generating new Q&As
  }

  const incrementQuestions = () => {
    if (numQuestions < 10) setNumQuestions(numQuestions + 1);
  };

  const decrementQuestions = () => {
    if (numQuestions > 3) setNumQuestions(numQuestions - 1);
  };

  const currentTopicData = qa?.[selectedTopic];
  const totalQuestions = currentTopicData?.qaPairs?.length || 0;
  
  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const noDataGenerated = !qa || Object.values(qa).every(val => val === null);

  // Show upgrade prompt for free users
  if (!subscriptionLoading && !hasAccess) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Q&A Preparation</h2>
          <ProBadge />
        </div>
        <UpgradePrompt 
          feature="generate-qa"
          title="Unlock Q&A Preparation"
          description="Generate personalized interview questions and expertly crafted answers based on your resume. Practice with topic-specific Q&A pairs to ace your next interview."
        />
      </div>
    );
  }

  if (noDataGenerated || hasDataChanged) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-primary/20 rounded-xl min-h-[600px] bg-gradient-to-br from-primary/5 to-transparent">
        <div className="mb-6 p-4 rounded-full bg-primary/10 backdrop-blur-sm">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          {hasDataChanged ? 'Content Updated - Regenerate Q&A' : 'AI-Powered Interview Preparation'}
        </h3>
        
        <p className="text-muted-foreground mb-8 max-w-lg leading-relaxed">
          {hasDataChanged
            ? 'Your resume or job description has been updated. Select a topic below and regenerate to get fresh, relevant Q&A pairs.'
            : 'Choose a focus area below to generate tailored interview questions and expertly crafted answers based on your resume content.'}
        </p>

        <div className="w-full max-w-4xl space-y-8 mb-8">
            {/* Topic Selection - Desktop (Cards) */}
            <div className="space-y-4 hidden md:block">
              <h4 className="text-lg font-semibold text-center">Choose Your Focus Area</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {topics.map(topic => {
                  const IconComponent = topic.icon;
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <Card 
                      key={topic.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md transform scale-[1.02]' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTopic(topic.id)}
                    >
                      <CardContent className="p-3 sm:p-4 text-center space-y-2 sm:space-y-3">
                        <div className={`mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${topic.color} flex items-center justify-center mb-2 sm:mb-3`}>
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-xs sm:text-sm">{topic.title}</h5>
                        <p className="text-xs text-muted-foreground leading-relaxed hidden sm:block">{topic.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Topic Selection - Mobile (Dropdown) */}
            <div className="space-y-4 md:hidden">
              <h4 className="text-lg font-semibold text-center">Choose Your Focus Area</h4>
              <Card className="p-4 bg-card/50 backdrop-blur-sm">
                <div className="space-y-3">
                  <Label htmlFor="topic-select" className="text-sm font-medium">Focus Area</Label>
                  <Select value={selectedTopic} onValueChange={(value: QATopic) => setSelectedTopic(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a focus area" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(topic => {
                        const IconComponent = topic.icon;
                        return (
                          <SelectItem key={topic.id} value={topic.id}>
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${topic.color} flex items-center justify-center`}>
                                <IconComponent className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <div className="font-medium">{topic.title}</div>
                                <div className="text-xs text-muted-foreground">{topic.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            </div>

            {/* Question Count - Desktop (Slider) */}
            <Card className="p-6 bg-card/50 backdrop-blur-sm hidden md:block">
              <div className="space-y-4">
                <div className="text-center">
                  <Label htmlFor="numQuestions" className="text-lg font-semibold">
                    Number of Questions: <span className="text-primary font-bold text-xl">{numQuestions}</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">Adjust the number of interview questions to generate</p>
                </div>
                <div className="px-4">
                  <Slider
                    id="numQuestions"
                    min={3}
                    max={10}
                    step={1}
                    value={[numQuestions]}
                    onValueChange={(val) => setNumQuestions(val[0])}
                    disabled={isLoading}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                    <span>3 - Quick Prep</span>
                    <span>6 - Balanced</span>
                    <span>10 - Comprehensive</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Question Count - Mobile (Stepper) */}
            <Card className="p-4 bg-card/50 backdrop-blur-sm md:hidden">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-center block">Number of Questions</Label>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decrementQuestions}
                    disabled={numQuestions <= 3 || isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary min-w-[2rem] text-center">{numQuestions}</span>
                    <span className="text-sm text-muted-foreground">questions</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={incrementQuestions}
                    disabled={numQuestions >= 10 || isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">
                    {numQuestions <= 4 ? 'Quick Prep' : numQuestions <= 7 ? 'Balanced' : 'Comprehensive'}
                  </span>
                </div>
              </div>
            </Card>
        </div>
        
        <Button 
          onClick={() => handleGenerateClick(selectedTopic)} 
          disabled={isLoading} 
          size="lg" 
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isLoading ? (
            <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3"></div>Generating {numQuestions} questions for '{selectedTopic}'...</>
          ) : (
             <><FileQuestion className="mr-3 h-5 w-5" /> Generate {numQuestions} Q&A pairs for '{selectedTopic}'</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interview Q&A Preparation</h2>
          <p className="text-muted-foreground">AI-generated questions and answers tailored to your resume</p>
        </div>
      </div> */}

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Topic Selection & Settings</CardTitle>
              <CardDescription>Choose your focus area and customize the number of questions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Desktop Topic Pills */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {topics.map((topic) => {
                const IconComponent = topic.icon;
                const isSelected = selectedTopic === topic.id;
                return (
                  <Button
                    key={topic.id}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`flex flex-col items-center gap-1 sm:gap-2 h-auto py-2 sm:py-3 px-1 sm:px-2 transition-all duration-300 ${
                      isSelected 
                        ? 'shadow-md transform scale-[1.02] bg-primary text-primary-foreground' 
                        : 'hover:shadow-sm hover:border-primary/50'
                    }`}
                  >
                    <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs font-medium text-center leading-tight">{topic.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Mobile Topic Dropdown */}
          <div className="md:hidden">
            <Label className="text-sm font-medium mb-2 block">Focus Area</Label>
            <Select value={selectedTopic} onValueChange={(value: QATopic) => setSelectedTopic(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a focus area" />
              </SelectTrigger>
              <SelectContent>
                {topics.map(topic => {
                  const IconComponent = topic.icon;
                  return (
                    <SelectItem key={topic.id} value={topic.id}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${topic.color} flex items-center justify-center`}>
                          <IconComponent className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{topic.title}</div>
                          <div className="text-xs text-muted-foreground">{topic.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop Question Count Slider */}
          <Card className="bg-card/50 backdrop-blur-sm hidden md:block">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <Label htmlFor="numQuestions" className="text-sm font-semibold">
                  Generate <span className="text-primary font-bold text-lg">{numQuestions}</span> questions
                </Label>
                <Slider
                  id="numQuestions"
                  min={3}
                  max={10}
                  step={1}
                  value={[numQuestions]}
                  onValueChange={(val) => setNumQuestions(val[0])}
                  disabled={isLoading}
                  className="w-full max-w-xs mx-auto"
                />
                <div className="flex justify-between text-xs text-muted-foreground max-w-xs mx-auto">
                  <span>Quick (3)</span>
                  <span>Balanced (6)</span>
                  <span>Deep (10)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Question Count Stepper */}
          <Card className="bg-card/50 backdrop-blur-sm md:hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-center block">Number of Questions</Label>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decrementQuestions}
                    disabled={numQuestions <= 3 || isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary min-w-[2rem] text-center">{numQuestions}</span>
                    <span className="text-sm text-muted-foreground">questions</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={incrementQuestions}
                    disabled={numQuestions >= 10 || isLoading}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground">
                    {numQuestions <= 4 ? 'Quick Prep' : numQuestions <= 7 ? 'Balanced' : 'Comprehensive'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-4">
          {/* Desktop Header - Horizontal Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${topics.find(t => t.id === selectedTopic)?.color || 'from-primary/20 to-primary/10'}`}>
                {(() => {
                  const IconComponent = topics.find(t => t.id === selectedTopic)?.icon || FileQuestion;
                  return <IconComponent className="h-5 w-5 text-white" />;
                })()}
              </div>
              <div>
                <CardTitle className="text-xl">Interview Questions: {selectedTopic}</CardTitle>
                <CardDescription className="text-sm">
                  {topics.find(t => t.id === selectedTopic)?.description}
                </CardDescription>
              </div>
            </div>
            {qa?.[selectedTopic] && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {qa[selectedTopic]!.qaPairs.length} questions
                </span>
                <Button 
                  onClick={() => handleGenerateClick(selectedTopic)} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/5"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>Regenerating...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Header - Vertical Layout */}
          <div className="md:hidden space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${topics.find(t => t.id === selectedTopic)?.color || 'from-primary/20 to-primary/10'}`}>
                {(() => {
                  const IconComponent = topics.find(t => t.id === selectedTopic)?.icon || FileQuestion;
                  return <IconComponent className="h-6 w-6 text-white" />;
                })()}
              </div>
              <div>
                <CardTitle className="text-lg">Interview Questions: {selectedTopic}</CardTitle>
                <CardDescription className="text-sm">
                  {topics.find(t => t.id === selectedTopic)?.description}
                </CardDescription>
              </div>
            </div>
            {qa?.[selectedTopic] && (
              <div className="flex flex-col items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {qa[selectedTopic]!.qaPairs.length} questions
                </span>
                <Button 
                  onClick={() => handleGenerateClick(selectedTopic)} 
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/5"
                >
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>Regenerating...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Navigation Controls - Show only when Q&A exists and not loading */}
          {qa?.[selectedTopic] && qa[selectedTopic]?.qaPairs && Array.isArray(qa[selectedTopic]?.qaPairs) && !isLoading && (
            <div className="md:hidden mb-6">
              <div className="flex justify-between items-center bg-card/50 rounded-lg p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <span className="text-sm font-medium text-center">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextQuestion}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {isLoading && qa?.[selectedTopic] === null ? (
            <div className="flex flex-col items-center justify-center text-center p-12 min-h-[300px] bg-gradient-to-br from-primary/5 to-transparent rounded-lg border-2 border-dashed border-primary/20">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="mt-6 space-y-2">
                  <p className="font-medium">Generating {numQuestions} personalized questions</p>
                  <p className="text-sm text-muted-foreground">Tailored for '{selectedTopic}' based on your resume</p>
                </div>
            </div>
          ) : qa?.[selectedTopic] && qa[selectedTopic]?.qaPairs && Array.isArray(qa[selectedTopic]?.qaPairs) ? (
            <>
              {/* Desktop View - Accordion */}
              <div className="hidden md:block">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {qa[selectedTopic]!.qaPairs.map((pairData: any, index: number) => {
                    const pair = validateQAPair(pairData);
                    return (
                    <AccordionItem 
                      value={`item-${selectedTopic}-${index}`} 
                      key={index}
                      className="border rounded-lg bg-card/50 hover:bg-card/80 transition-colors duration-300"
                    >
                      <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-start gap-3 sm:gap-4 w-full">
                          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                            <span className="text-xs sm:text-sm font-bold text-primary">Q{index + 1}</span>
                          </div>
                          <span className="flex-1 pr-2 sm:pr-4 leading-relaxed">{pair.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
                        <div className="ml-9 sm:ml-12">
                          <div className='space-y-4'>
                            <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                              <h4 className="font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-sm sm:text-base">
                                <MessageSquareQuote className='h-3 w-3 sm:h-4 sm:w-4 text-green-600'/> 
                                Your Tailored Answer
                              </h4>
                              <p className="text-foreground whitespace-pre-wrap text-xs sm:text-sm leading-relaxed break-words">
                                {pair.answer}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-sm sm:text-base">
                                  <Tags className='h-3 w-3 sm:h-4 sm:w-4 text-blue-600'/> 
                                  Related Resume Sections
                                </h4>
                                <ul className="space-y-1 sm:space-y-2">
                                  {pair.relatedSections.length > 0 ? pair.relatedSections.map((section: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                      <span className="break-words">{section}</span>
                                    </li>
                                  )) : (
                                    <li className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0"></div>
                                      <span>No related sections available</span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                              
                              <div className="p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                                <h4 className="font-semibold flex items-center gap-2 mb-2 sm:mb-3 text-sm sm:text-base">
                                  <CheckSquare className='h-3 w-3 sm:h-4 sm:w-4 text-purple-600'/> 
                                  Key Points to Emphasize
                                </h4>
                                <ul className="space-y-1 sm:space-y-2">
                                  {pair.keyPoints.length > 0 ? pair.keyPoints.map((point: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                                      <span className="break-words">{point}</span>
                                    </li>
                                  )) : (
                                    <li className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0"></div>
                                      <span>No key points available</span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    )
                  })}
                </Accordion>
              </div>

              {/* Mobile View - Single Question with Navigation */}
              <div className="md:hidden space-y-4">
                {/* Progress Indicator */}
                <div className="flex items-center justify-between bg-card/50 rounded-lg p-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i === currentQuestionIndex ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Current Question */}
                {(() => {
                  const currentPair = validateQAPair(qa[selectedTopic]!.qaPairs[currentQuestionIndex]);
                  return (
                    <div className="space-y-4">
                      {/* Question */}
                      <Card className="border rounded-lg bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                              <span className="text-sm font-bold text-primary">Q{currentQuestionIndex + 1}</span>
                            </div>
                            <p className="flex-1 text-sm font-semibold leading-relaxed">{currentPair.question}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Answer */}
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                        <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                          <MessageSquareQuote className='h-4 w-4 text-green-600'/> 
                          Your Tailored Answer
                        </h4>
                        <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed break-words">
                          {currentPair.answer}
                        </p>
                      </div>
                      
                      {/* Related Sections and Key Points */}
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                          <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                            <Tags className='h-4 w-4 text-blue-600'/> 
                            Related Resume Sections
                          </h4>
                          <ul className="space-y-2">
                            {currentPair.relatedSections.length > 0 ? currentPair.relatedSections.map((section: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                <span className="break-words">{section}</span>
                              </li>
                            )) : (
                              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0"></div>
                                <span>No related sections available</span>
                              </li>
                            )}
                          </ul>
                        </div>
                        
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                          <h4 className="font-semibold flex items-center gap-2 mb-3 text-sm">
                            <CheckSquare className='h-4 w-4 text-purple-600'/> 
                            Key Points to Emphasize
                          </h4>
                          <ul className="space-y-2">
                            {currentPair.keyPoints.length > 0 ? currentPair.keyPoints.map((point: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                                <span className="break-words">{point}</span>
                              </li>
                            )) : (
                              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-300 flex-shrink-0"></div>
                                <span>No key points available</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 min-h-[300px] bg-gradient-to-br from-muted/30 to-transparent rounded-lg border-2 border-dashed">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <FileQuestion className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No questions generated yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Generate personalized interview questions for {selectedTopic} based on your resume content.
              </p>
              <Button 
                onClick={() => handleGenerateClick(selectedTopic)} 
                disabled={isLoading}
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {isLoading ? 
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>Generating {numQuestions} questions...</> : 
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate {numQuestions} Questions</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
