'use client';

import { useState } from 'react';
import type { GenerateInterviewQuestionsOutput, GenerateInterviewQuestionsInput } from '@/ai/flows/generate-interview-questions';
import type { InterviewType, DifficultyLevel } from '@/app/interview/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Sparkles, Check, X, RefreshCw, Code, Users, Award, Brain, Trophy, Star, Zap, User, Crown, Target, Lightbulb, Clock, ChevronDown, ChevronUp, Plus, Minus, SkipForward, Send } from 'lucide-react';

import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { useSubscription } from '@/context/subscription-context';
import { UpgradePrompt, ProBadge } from '@/components/upgrade-prompt';

interface InterviewTabProps {
  interview: GenerateInterviewQuestionsOutput | null;
  onGenerate: (config: Omit<GenerateInterviewQuestionsInput, 'resumeText' | 'jobDescription'>) => void;
  isLoading: boolean;
}

const interviewTypes: { id: InterviewType, title: string, description: string, icon: any, color: string }[] = [
    { id: 'Technical', title: 'Technical', description: 'System design, coding, architecture', icon: Code, color: 'from-blue-500 to-indigo-600' },
    { id: 'Behavioral', title: 'Behavioral', description: 'STAR method, soft skills', icon: Users, color: 'from-green-500 to-emerald-600' },
    { id: 'Leadership', title: 'Leadership', description: 'Management, strategy, vision', icon: Award, color: 'from-purple-500 to-violet-600' },
    { id: 'General', title: 'General', description: 'Mixed question types', icon: Brain, color: 'from-orange-500 to-red-600' },
];

const difficultyLevels: { id: DifficultyLevel, title: string, description: string, icon: any, color: string }[] = [
    { id: 'Entry', title: 'Entry Level', description: '0-2 years experience', icon: Star, color: 'from-cyan-500 to-blue-600' },
    { id: 'Mid', title: 'Mid Level', description: '3-7 years experience', icon: Zap, color: 'from-yellow-500 to-orange-600' },
    { id: 'Senior', title: 'Senior Level', description: '8-15 years experience', icon: Trophy, color: 'from-red-500 to-pink-600' },
    { id: 'Executive', title: 'Executive', description: '15+ years experience', icon: Crown, color: 'from-violet-500 to-purple-600' },
];

function ConfigurationPanel({ onGenerate, isLoading, isRegenerating = false }: Pick<InterviewTabProps, 'onGenerate' | 'isLoading'> & { isRegenerating?: boolean }) {
  const [interviewType, setInterviewType] = useState<InterviewType>('General');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('Mid');
  const [numQuestions, setNumQuestions] = useState(5);
  
  const handleGenerateClick = () => {
    onGenerate({ interviewType, difficultyLevel, numQuestions });
  };

  const buttonText = isRegenerating ? 'Regenerate Quiz' : 'Generate Interview Quiz';
  const buttonIcon = isRegenerating ? <RefreshCw className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />;

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", 
      isRegenerating ? "p-6" : "p-12 border-2 border-dashed border-primary/20 rounded-xl min-h-[600px] bg-gradient-to-br from-primary/5 to-transparent")}>
      {!isRegenerating && (
        <>
          <div className="mb-6 p-4 rounded-full bg-primary/10 backdrop-blur-sm">
            <Target className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            AI-Powered Interview Quiz
          </h3>
          <p className="text-muted-foreground mb-8 max-w-lg leading-relaxed">
            Test your knowledge with personalized interview questions tailored to your resume and the target role.
          </p>
        </>
      )}

      <div className="w-full max-w-4xl space-y-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Interview Types */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-left">Interview Type</h4>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {interviewTypes.map(type => {
                const IconComponent = type.icon;
                const isSelected = interviewType === type.id;
                return (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md transform scale-[1.02]' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setInterviewType(type.id)}
                  >
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h5 className="font-semibold text-sm sm:text-base truncate">{type.title}</h5>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{type.description}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Difficulty Levels */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-left">Difficulty Level</h4>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {difficultyLevels.map(level => {
                const IconComponent = level.icon;
                const isSelected = difficultyLevel === level.id;
                return (
                  <Card 
                    key={level.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md transform scale-[1.02]' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setDifficultyLevel(level.id)}
                  >
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h5 className="font-semibold text-sm sm:text-base truncate">{level.title}</h5>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-tight">{level.description}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Question Count - Desktop (Slider) */}
        <Card className="p-6 bg-card/50 backdrop-blur-sm hidden md:block">
          <div className="space-y-4">
            <div className="text-center">
              <Label htmlFor="numQuestions" className="text-lg font-semibold">
                Number of Questions: <span className="text-primary font-bold text-xl">{numQuestions}</span>
              </Label>
              <p className="text-sm text-muted-foreground mt-1">Select the length of your interview quiz</p>
            </div>
            <div className="px-4">
              <Slider
                id="numQuestions"
                min={3}
                max={15}
                step={1}
                value={[numQuestions]}
                onValueChange={(val) => setNumQuestions(val[0])}
                disabled={isLoading}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                <span>3 - Quick</span>
                <span>8 - Standard</span>
                <span>15 - Comprehensive</span>
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
                onClick={() => setNumQuestions(Math.max(3, numQuestions - 1))}
                disabled={numQuestions <= 3 || isLoading}
                className="h-10 w-10 p-0"
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
                onClick={() => setNumQuestions(Math.min(15, numQuestions + 1))}
                disabled={numQuestions >= 15 || isLoading}
                className="h-10 w-10 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center">
              <span className="text-xs text-muted-foreground">
                {numQuestions <= 5 ? 'Quick' : numQuestions <= 10 ? 'Standard' : 'Comprehensive'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Button 
        onClick={handleGenerateClick} 
        disabled={isLoading} 
        size="lg"
        className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isLoading ? (
          <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-3"></div>Generating {numQuestions} questions...</>
        ) : (
          <>{buttonIcon} {buttonText}</>
        )}
      </Button>
    </div>
  );
}

function QuizView({ quiz, onRestart }: { quiz: GenerateInterviewQuestionsOutput, onRestart: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(false);
  const [expandedAnswers, setExpandedAnswers] = useState<Set<number>>(new Set());

  // Helper functions for mobile UI
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const highlightKeywords = (text: string) => {
    const keywords = ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'CSS', 'HTML', 'SQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'API', 'REST', 'GraphQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redux', 'Vue', 'Angular', 'Next.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel'];
    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<mark class="bg-primary/20 text-primary font-medium px-1 rounded">$&</mark>`);
    });
    return highlightedText;
  };

  const toggleAnswerExpansion = (index: number) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedAnswers(newExpanded);
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerSelect = (optionIndex: number) => {
    if (selectedAnswer !== null) return; // Prevent changing answer
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setExpandedQuestion(false); // Reset question expansion for next question
      setExpandedAnswers(new Set()); // Reset answer expansions
    } else {
      setShowResults(true);
    }
  };

  const handleSkip = () => {
    // Skip without selecting an answer
    handleNext();
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers(Array(quiz.questions.length).fill(null));
    setShowResults(false);
  }

  if (showResults) {
    const score = selectedAnswers.reduce((acc: number, answer, index) => {
        return answer === quiz.questions[index].correctAnswerIndex ? acc + 1 : acc;
    }, 0);
    const scorePercentage = Math.round((score / quiz.questions.length) * 100);
    
    const getScoreColor = (percentage: number) => {
      if (percentage >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    };

    const getScoreMessage = (percentage: number) => {
      if (percentage >= 90) return { message: 'Outstanding!', emoji: '🎉', description: 'You\'re ready to ace any interview!' };
      if (percentage >= 80) return { message: 'Excellent!', emoji: '🚀', description: 'Great job! You\'re well-prepared.' };
      if (percentage >= 70) return { message: 'Good Job!', emoji: '👍', description: 'Solid performance with room for improvement.' };
      if (percentage >= 60) return { message: 'Keep Practicing!', emoji: '📚', description: 'You\'re on the right track.' };
      return { message: 'More Study Needed', emoji: '💪', description: 'Don\'t give up! Practice makes perfect.' };
    };

    const scoreMessage = getScoreMessage(scorePercentage);

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-6 rounded-full bg-primary/10 w-fit">
                    <Trophy className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Quiz Completed! {scoreMessage.emoji}
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                    {scoreMessage.message} You scored {score} out of {quiz.questions.length} questions correctly.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
                <div className={`text-center p-8 rounded-2xl ${getScoreColor(scorePercentage)} border-2 border-primary/20`}>
                    <div className="text-6xl font-bold mb-2">{scorePercentage}%</div>
                    <p className="text-sm font-medium">{scoreMessage.description}</p>
                </div>
                
                <Progress value={scorePercentage} className="w-full max-w-md h-3" />
                
                <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-md text-center">
                    <div className="space-y-1 sm:space-y-2">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{score}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Correct</div>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                        <div className="text-xl sm:text-2xl font-bold text-red-600">{quiz.questions.length - score}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Incorrect</div>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                        <div className="text-xl sm:text-2xl font-bold text-primary">{quiz.questions.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 w-full sm:w-auto">
                    <Button onClick={handleRetake} className="bg-gradient-to-r from-primary to-primary/80 w-full sm:w-auto">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retake Quiz
                    </Button>
                    <Button onClick={onRestart} variant="outline" className="w-full sm:w-auto">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start New Quiz
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 relative">
      {/* Desktop Header */}
      <CardHeader className="pb-4 hidden md:block">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Question {currentQuestionIndex + 1} of {quiz.questions.length}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
                {currentQuestion.category}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <CardDescription className="text-sm sm:text-lg text-foreground font-medium leading-relaxed p-3 sm:p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
            {currentQuestion.question}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Mobile Sticky Header */}
      <div className="md:hidden sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-primary/20">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-semibold">Q{currentQuestionIndex + 1} of {quiz.questions.length}</span>
            </div>
            <div className="text-xs font-medium bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
              {currentQuestion.category}
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-primary to-primary/80 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Question Content */}
      <div className="md:hidden p-4 pb-20">
        <Card className="border-l-4 border-primary bg-muted/30">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: expandedQuestion 
                    ? highlightKeywords(currentQuestion.question)
                    : highlightKeywords(truncateText(currentQuestion.question, 120))
                }}
              />
              {currentQuestion.question.length > 120 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedQuestion(!expandedQuestion)}
                  className="h-auto p-0 text-primary hover:bg-transparent"
                >
                  {expandedQuestion ? (
                    <>Read Less <ChevronUp className="ml-1 h-3 w-3" /></>
                  ) : (
                    <>Read More <ChevronDown className="ml-1 h-3 w-3" /></>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Desktop Answer Options */}
      <CardContent className="space-y-6 hidden md:block">
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = currentQuestion.correctAnswerIndex === index;
            const showAsCorrect = selectedAnswer !== null && isCorrect;
            const showAsIncorrect = selectedAnswer !== null && isSelected && !isCorrect;

            return (
              <div
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={cn(
                  "flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group",
                  "hover:shadow-md hover:border-primary/50",
                  selectedAnswer === null ? "border-border hover:bg-muted/30" : "cursor-default",
                  showAsCorrect && "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-green-100 dark:shadow-green-900/20",
                  showAsIncorrect && "bg-red-50 dark:bg-red-900/20 border-red-500 shadow-red-100 dark:shadow-red-900/20",
                  isSelected && selectedAnswer === null && "border-primary bg-primary/5",
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm transition-all",
                  showAsCorrect && "bg-green-500 border-green-500 text-white",
                  showAsIncorrect && "bg-red-500 border-red-500 text-white",
                  !showAsCorrect && !showAsIncorrect && "border-muted-foreground/30 group-hover:border-primary group-hover:bg-primary/10"
                )}>
                    {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-grow text-xs sm:text-sm leading-relaxed break-words">{option}</div>
                <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  {showAsCorrect && <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
                  {showAsIncorrect && <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Mobile Answer Options */}
      <div className="md:hidden px-4 space-y-3">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = currentQuestion.correctAnswerIndex === index;
          const showAsCorrect = selectedAnswer !== null && isCorrect;
          const showAsIncorrect = selectedAnswer !== null && isSelected && !isCorrect;
          const isExpanded = expandedAnswers.has(index);
          const shouldTruncate = option.length > 80;

          return (
            <Card
              key={index}
              className={cn(
                "cursor-pointer transition-all duration-300 border-2",
                "active:scale-[0.98]",
                selectedAnswer === null ? "border-border hover:border-primary/50 hover:shadow-md" : "cursor-default",
                showAsCorrect && "bg-green-50 dark:bg-green-900/20 border-green-500 shadow-md",
                showAsIncorrect && "bg-red-50 dark:bg-red-900/20 border-red-500 shadow-md",
                isSelected && selectedAnswer === null && "border-primary bg-primary/5 shadow-md",
              )}
              onClick={() => selectedAnswer === null && handleAnswerSelect(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all",
                    showAsCorrect && "bg-green-500 border-green-500 text-white",
                    showAsIncorrect && "bg-red-500 border-red-500 text-white",
                    !showAsCorrect && !showAsIncorrect && isSelected && selectedAnswer === null && "bg-primary border-primary text-white",
                    !showAsCorrect && !showAsIncorrect && !isSelected && "border-muted-foreground/30"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm leading-relaxed break-words"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightKeywords(
                          shouldTruncate && !isExpanded 
                            ? truncateText(option, 80)
                            : option
                        )
                      }}
                    />
                    {shouldTruncate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAnswerExpansion(index);
                        }}
                        className="h-auto p-0 mt-2 text-xs text-primary hover:bg-transparent"
                      >
                        {isExpanded ? 'Show Less' : 'Show More'}
                      </Button>
                    )}
                  </div>

                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {showAsCorrect && <Check className="h-5 w-5 text-green-600" />}
                    {showAsIncorrect && <X className="h-5 w-5 text-red-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Explanation */}
      <CardContent className="hidden md:block">
        {selectedAnswer !== null && (
          <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <h4 className="font-semibold text-base sm:text-lg text-blue-900 dark:text-blue-100">Explanation</h4>
            </div>
            <p className="text-foreground leading-relaxed text-sm sm:text-base break-words" dangerouslySetInnerHTML={{ __html: highlightKeywords(currentQuestion.explanation) }} />
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          </div>
          <Button 
            onClick={handleNext} 
            disabled={selectedAnswer === null}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <>Next Question <Target className="ml-2 h-4 w-4" /></>
            ) : (
              <>Finish Quiz <Trophy className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Mobile Explanation */}
      {selectedAnswer !== null && (
        <div className="md:hidden px-4 pb-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Explanation</h4>
              </div>
              <p className="text-foreground leading-relaxed text-sm break-words" dangerouslySetInnerHTML={{ __html: highlightKeywords(currentQuestion.explanation) }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Sticky Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-primary/20 p-4 z-20">
        <div className="flex gap-3">
          <Button 
            onClick={handleSkip}
            variant="outline"
            className="flex-1 h-12"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Skip
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={selectedAnswer === null}
            className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            {selectedAnswer === null ? (
              <>
                <Send className="mr-2 h-4 w-4" />
                Select Answer
              </>
            ) : currentQuestionIndex < quiz.questions.length - 1 ? (
              <>
                <Target className="mr-2 h-4 w-4" />
                Next Question
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Finish Quiz
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}


export default function InterviewTab({
  interview,
  onGenerate,
  isLoading,
}: InterviewTabProps) {
  const [newQuizCollapsed, setNewQuizCollapsed] = useState(true);
  const { canAccessFeature, isLoading: subscriptionLoading } = useSubscription();
  
  // Check if Interview feature is accessible (Pro only)
  const hasAccess = canAccessFeature('generate-questions');

  const handleRestart = () => {
    // This is a bit of a hack to force a re-render of the configuration panel
    // A better solution would involve lifting state up, but this is simpler for now.
    // By calling onGenerate with a dummy config, we reset the parent page's 'interview' state to null.
    onGenerate({ interviewType: 'General', difficultyLevel: 'Mid', numQuestions: -1 });
  };

  // Show upgrade prompt for free users
  if (!subscriptionLoading && !hasAccess) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Interview Quiz</h2>
          <ProBadge />
        </div>
        <UpgradePrompt 
          feature="generate-questions"
          title="Unlock Interview Quiz"
          description="Practice with AI-generated interview questions tailored to your experience level. Get instant feedback and ace your next interview."
        />
      </div>
    );
  }

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-primary/20 rounded-xl min-h-[500px] bg-gradient-to-br from-primary/5 to-transparent">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="mt-8 space-y-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Generating Your Interview Quiz...
              </h3>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                Creating personalized questions based on your resume and selected preferences. This may take a moment.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                <Target className="h-4 w-4" />
                <span>Analyzing your profile</span>
              </div>
            </div>
        </div>
      )
  }

  if (!interview || !interview.questions || interview.questions.length === 0) {
    return <ConfigurationPanel onGenerate={onGenerate} isLoading={isLoading} />;
  }

  return (
    <div className="space-y-6">
      
      {/* Interview Quiz Section - Always Expanded When Active */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Interview Quiz</CardTitle>
              <CardDescription>
                Test your knowledge with AI-generated interview questions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <QuizView quiz={interview} onRestart={handleRestart} />
        </CardContent>
      </Card>
      
      {/* Start New Quiz Section - Collapsible */}
      <Collapsible open={!newQuizCollapsed} onOpenChange={setNewQuizCollapsed}>
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Start a New Quiz</CardTitle>
                    <CardDescription className="md:block hidden">
                      Generate a new set of questions with different settings and difficulty levels.
                    </CardDescription>
                    {/* Mobile: Show single line description when collapsed */}
                    <CardDescription className="md:hidden">
                      {newQuizCollapsed ? 'Tap to configure new quiz settings' : 'Generate a new set of questions with different settings and difficulty levels.'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {newQuizCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
               <ConfigurationPanel onGenerate={onGenerate} isLoading={isLoading} isRegenerating={true} />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
