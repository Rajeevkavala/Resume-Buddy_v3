'use client';

/**
 * Enhanced Interview Session Configuration Panel
 * 
 * Configures type, difficulty, question count, DSA categories, code language,
 * and voice preferences for the new AI interview sessions.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain,
  Code2,
  Users,
  Server,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  Loader2,
} from 'lucide-react';
import {
  DSA_CATEGORIES,
  DSA_CATEGORY_LABELS,
  CODE_LANGUAGES,
  CODE_LANGUAGE_LABELS,
  ANSWER_FORMATS,
  ANSWER_FORMAT_LABELS,
  type InterviewSessionType,
  type InterviewDifficulty,
  type DSACategory,
  type CodeLanguage,
  type AnswerFormat,
  type InterviewConfig,
} from '@/lib/types/interview';
import { detectBrowserSupport } from '@/lib/speech/browser-support';

const INTERVIEW_TYPES: {
  value: InterviewSessionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'dsa',
    label: 'DSA / Coding',
    icon: <Code2 className="h-4 w-4" />,
    description: 'Data structures & algorithms with code editor',
  },
  {
    value: 'behavioral',
    label: 'Behavioral',
    icon: <Users className="h-4 w-4" />,
    description: 'STAR format, teamwork, conflict resolution',
  },
  {
    value: 'technical',
    label: 'Technical',
    icon: <Brain className="h-4 w-4" />,
    description: 'System knowledge, best practices, architecture',
  },
  {
    value: 'system-design',
    label: 'System Design',
    icon: <Server className="h-4 w-4" />,
    description: 'Design scalable systems and APIs',
  },
];

const DIFFICULTY_LEVELS: { value: InterviewDifficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-green-600/10 text-green-700 border-green-600/20' },
  { value: 'medium', label: 'Medium', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'hard', label: 'Hard', color: 'bg-destructive/10 text-destructive border-destructive/20' },
];

interface SessionConfigPanelProps {
  onStart: (config: InterviewConfig) => void;
  isLoading: boolean;
  resumeText?: string;
  jobDescription?: string;
}

export function SessionConfigPanel({
  onStart,
  isLoading,
  resumeText,
  jobDescription,
}: SessionConfigPanelProps) {
  const [type, setType] = useState<InterviewSessionType>('behavioral');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [answerFormat, setAnswerFormat] = useState<AnswerFormat>('text');
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('javascript');
  const [selectedCategories, setSelectedCategories] = useState<DSACategory[]>([]);
  const [useVoice, setUseVoice] = useState(true);

  const browserSupport = detectBrowserSupport();

  const toggleCategory = (cat: DSACategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleStart = () => {
    onStart({
      type,
      difficulty,
      questionCount,
      answerFormat,
      codeLanguage: type === 'dsa' ? codeLanguage : undefined,
      dsaCategories: type === 'dsa' && selectedCategories.length > 0 ? selectedCategories : undefined,
      useVoice: useVoice && browserSupport.tts,
      resumeText,
      jobDescription,
    });
  };

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Configure Your Session</CardTitle>
        <CardDescription>
          Set up the interview type, difficulty, and preferences before starting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interview Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Interview Type</label>
          <div className="grid grid-cols-2 gap-2">
            {INTERVIEW_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${
                  type === t.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border/60 hover:border-border hover:bg-muted/30'
                }`}
              >
                <div
                  className={`p-1.5 rounded ${
                    type === t.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTY_LEVELS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  difficulty === d.value ? d.color : 'border-border/60 text-muted-foreground hover:bg-muted/30'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Questions</label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setQuestionCount(Math.max(3, questionCount - 1))}
              disabled={questionCount <= 3}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-lg font-accent font-bold w-8 text-center">{questionCount}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setQuestionCount(Math.min(15, questionCount + 1))}
              disabled={questionCount >= 15}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* DSA-specific options */}
        {type === 'dsa' && (
          <>
            {/* Code Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Code Language</label>
              <Select value={codeLanguage} onValueChange={(v) => setCodeLanguage(v as CodeLanguage)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {CODE_LANGUAGE_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DSA Categories */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Topics <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DSA_CATEGORIES.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => toggleCategory(cat)}
                  >
                    {DSA_CATEGORY_LABELS[cat]}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Answer Format (for non-DSA interviews) */}
        {type !== 'dsa' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Answer Format</label>
            <div className="grid grid-cols-3 gap-2">
              {ANSWER_FORMATS.map((format) => (
                <button
                  key={format}
                  onClick={() => setAnswerFormat(format)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                    answerFormat === format
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30'
                  }`}
                >
                  {ANSWER_FORMAT_LABELS[format]}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {answerFormat === 'mcq' && 'AI will generate multiple choice questions'}
              {answerFormat === 'text' && 'Type your answers in a text box'}
              {answerFormat === 'voice' && 'Record your voice answers (requires microphone)'}
            </p>
          </div>
        )}

        {/* Voice Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Voice Questions</label>
          <button
            onClick={() => setUseVoice(!useVoice)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-200 ${
              useVoice
                ? 'border-primary/40 bg-primary/5 text-primary'
                : 'border-border/60 text-muted-foreground'
            }`}
          >
            {useVoice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {useVoice ? 'AI reads questions aloud' : 'Text-only mode'}
          </button>
          {useVoice && !browserSupport.tts && (
            <p className="text-xs text-muted-foreground">
              Voice output not available in your browser. Questions will be text-only.
            </p>
          )}
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Questions...
            </>
          ) : (
            'Start Interview Session'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
