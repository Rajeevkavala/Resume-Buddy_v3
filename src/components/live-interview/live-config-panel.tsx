'use client';

/**
 * Live Interview Configuration Panel
 * 
 * Setup panel for configuring a real-time voice interview.
 * Supports all 4 interview types with Sarvam AI voice settings.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain, Code2, Users, Server, Minus, Plus,
  Mic, MicOff, Loader2, Radio, Sparkles, Volume2, Zap,
} from 'lucide-react';
import {
  DSA_CATEGORIES,
  DSA_CATEGORY_LABELS,
  CODE_LANGUAGES,
  CODE_LANGUAGE_LABELS,
  type InterviewSessionType,
  type InterviewDifficulty,
  type DSACategory,
  type CodeLanguage,
} from '@/lib/types/interview';
import type { LiveConfig } from '@/hooks/use-live-interview';

const INTERVIEW_TYPES: {
  value: InterviewSessionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  tagline: string;
}[] = [
  {
    value: 'dsa',
    label: 'DSA / Coding',
    icon: <Code2 className="h-5 w-5" />,
    description: 'Data structures & algorithms with code editor',
    tagline: 'Solve problems live with voice explanation',
  },
  {
    value: 'behavioral',
    label: 'Behavioral',
    icon: <Users className="h-5 w-5" />,
    description: 'STAR format, teamwork, conflict resolution',
    tagline: 'Natural conversation about your experiences',
  },
  {
    value: 'technical',
    label: 'Technical',
    icon: <Brain className="h-5 w-5" />,
    description: 'System knowledge, best practices, architecture',
    tagline: 'Deep-dive into your technical expertise',
  },
  {
    value: 'system-design',
    label: 'System Design',
    icon: <Server className="h-5 w-5" />,
    description: 'Design scalable systems and APIs',
    tagline: 'Think out loud as you architect solutions',
  },
];

const DIFFICULTY_LEVELS: { value: InterviewDifficulty; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'bg-green-600/10 text-green-700 border-green-600/20' },
  { value: 'medium', label: 'Medium', color: 'bg-primary/10 text-primary border-primary/20' },
  { value: 'hard', label: 'Hard', color: 'bg-destructive/10 text-destructive border-destructive/20' },
];

const SPEAKERS = [
  { value: 'shubh', label: 'Shubh', description: 'Default male voice (v3)' },
  { value: 'rahul', label: 'Rahul', description: 'Professional male voice' },
  { value: 'priya', label: 'Priya', description: 'Friendly female voice' },
  { value: 'amit', label: 'Amit', description: 'Casual male voice' },
  { value: 'shreya', label: 'Shreya', description: 'Expressive female voice' },
  { value: 'rohan', label: 'Rohan', description: 'Calm male voice' },
];

interface LiveConfigPanelProps {
  onStart: (config: LiveConfig) => void;
  isLoading: boolean;
  resumeText?: string;
  jobDescription?: string;
}

export function LiveConfigPanel({
  onStart,
  isLoading,
  resumeText,
  jobDescription,
}: LiveConfigPanelProps) {
  const [type, setType] = useState<InterviewSessionType>('behavioral');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('javascript');
  const [selectedCategories, setSelectedCategories] = useState<DSACategory[]>([]);
  const [enableAudio, setEnableAudio] = useState(true);
  const [speaker, setSpeaker] = useState('shubh');

  const toggleCategory = (cat: DSACategory) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleStart = () => {
    onStart({
      type,
      difficulty,
      questionCount,
      codeLanguage: type === 'dsa' ? codeLanguage : undefined,
      dsaCategories: type === 'dsa' && selectedCategories.length > 0 ? selectedCategories : undefined,
      resumeText,
      jobDescription,
      speaker,
      enableAudio,
      useSarvamTTS: true, // Always use Sarvam TTS (Phase 2: Sarvam-only)
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-3 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Live AI Interview
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight">
          Real-Time Voice Interview
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Have a natural conversation with an AI interviewer. Speak your answers
          naturally, and get comprehensive feedback when the session ends.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-headline flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Configure Your Interview
          </CardTitle>
          <CardDescription>
            Choose your interview type and preferences to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interview Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Interview Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERVIEW_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                    type === t.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm'
                      : 'border-border/60 hover:border-border hover:bg-muted/30'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    type === t.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{t.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    {type === t.value && (
                      <p className="text-xs text-primary mt-1 font-medium">{t.tagline}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty Level</label>
            <div className="flex gap-2">
              {DIFFICULTY_LEVELS.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
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
            <label className="text-sm font-medium">Number of Questions</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline" size="sm" className="h-9 w-9 p-0"
                onClick={() => setQuestionCount(Math.max(3, questionCount - 1))}
                disabled={questionCount <= 3}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-xl font-accent font-bold w-8 text-center">{questionCount}</span>
              <Button
                variant="outline" size="sm" className="h-9 w-9 p-0"
                onClick={() => setQuestionCount(Math.min(15, questionCount + 1))}
                disabled={questionCount >= 15}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                ~{questionCount * 3}-{questionCount * 5} min
              </span>
            </div>
          </div>

          {/* DSA-specific options */}
          {type === 'dsa' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code Language</label>
                <Select value={codeLanguage} onValueChange={v => setCodeLanguage(v as CodeLanguage)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CODE_LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {CODE_LANGUAGE_LABELS[lang]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Topics <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DSA_CATEGORIES.map(cat => (
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

          {/* Voice Settings */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                Voice Settings
              </label>
              <button
                onClick={() => setEnableAudio(!enableAudio)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  enableAudio
                    ? 'border-primary/40 bg-primary/5 text-primary'
                    : 'border-border/60 text-muted-foreground'
                }`}
              >
                {enableAudio ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                {enableAudio ? 'Voice Enabled' : 'Text Only'}
              </button>
            </div>

            {enableAudio && (
              <div className="space-y-3">
                {/* Sarvam Speaker Selection (always shown when audio enabled) */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">AI Interviewer Voice (Sarvam AI)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SPEAKERS.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setSpeaker(s.value)}
                        className={`p-2 rounded-lg border text-xs text-left transition-all ${
                          speaker === s.value
                            ? 'border-primary/40 bg-primary/5 text-foreground'
                            : 'border-border/40 text-muted-foreground hover:border-border'
                        }`}
                      >
                        <p className="font-medium">{s.label}</p>
                        <p className="text-muted-foreground">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Starting Interview...
              </>
            ) : (
              <>
                <Radio className="h-5 w-5" />
                Start Live Interview
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
