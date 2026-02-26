'use client';

/**
 * Live Code Editor
 * 
 * Simple but functional code editor for DSA live interviews.
 * Uses a textarea with syntax-friendly styling (no heavy Monaco dependency).
 * Shows problem info: hints, constraints, expected complexity, examples.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Code2, Play, Lightbulb, ChevronDown, ChevronUp, Target,
  Clock, HardDrive, Send,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS, type CodeLanguage } from '@/lib/types/interview';

interface LiveCodeEditorProps {
  code: string;
  codeTemplate: string;
  onChange: (code: string) => void;
  onSubmit: (code: string) => void;
  language?: CodeLanguage;
  hints?: string[];
  examples?: any[];
  constraints?: string[];
  expectedComplexity?: { time?: string; space?: string } | null;
  questionCategory?: string;
  disabled?: boolean;
}

export function LiveCodeEditor({
  code,
  codeTemplate,
  onChange,
  onSubmit,
  language = 'javascript',
  hints = [],
  examples = [],
  constraints = [],
  expectedComplexity,
  questionCategory,
  disabled = false,
}: LiveCodeEditorProps) {
  const [showHints, setShowHints] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [selectedLang, setSelectedLang] = useState<CodeLanguage>(language);

  const handleReset = () => {
    onChange(codeTemplate || '');
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Problem Info Panel */}
      {(hints.length > 0 || constraints.length > 0 || examples.length > 0) && (
        <Card className="border-border/40">
          <CardHeader className="py-2 px-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Problem Details
                {questionCategory && (
                  <Badge variant="secondary" className="text-[10px]">{questionCategory}</Badge>
                )}
              </CardTitle>
              {showInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </CardHeader>
          {showInfo && (
            <CardContent className="py-2 px-4 space-y-3 text-sm">
              {/* Expected Complexity */}
              {expectedComplexity && (
                <div className="flex gap-4">
                  {expectedComplexity.time && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Time: <code className="font-mono text-foreground">{expectedComplexity.time}</code>
                    </div>
                  )}
                  {expectedComplexity.space && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <HardDrive className="h-3.5 w-3.5" />
                      Space: <code className="font-mono text-foreground">{expectedComplexity.space}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Examples */}
              {examples.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                  {examples.map((ex, i) => (
                    <div key={i} className="bg-muted/50 rounded-md p-2 text-xs font-mono">
                      {typeof ex === 'string' ? ex : (
                        <>
                          <span className="text-muted-foreground">Input: </span>{ex.input}<br />
                          <span className="text-muted-foreground">Output: </span>{ex.output}
                          {ex.explanation && (
                            <><br /><span className="text-muted-foreground">Explanation: </span><span className="text-foreground/70 font-sans">{ex.explanation}</span></>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {constraints.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Constraints:</p>
                  <ul className="text-xs space-y-0.5">
                    {constraints.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-0.5">•</span>
                        <code className="font-mono">{c}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints */}
              {hints.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    {showHints ? 'Hide hints' : `Show ${hints.length} hint${hints.length > 1 ? 's' : ''}`}
                  </button>
                  {showHints && (
                    <ul className="mt-1.5 text-xs space-y-1 text-muted-foreground">
                      {hints.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-primary font-medium">{i + 1}.</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Code Editor */}
      <Card className="flex-1 flex flex-col border-border/40">
        <CardHeader className="py-2 px-4 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            Code Editor
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedLang} onValueChange={v => setSelectedLang(v as CodeLanguage)}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CODE_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang} className="text-xs">
                    {CODE_LANGUAGE_LABELS[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-2 pt-0">
          <textarea
            value={code}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            spellCheck={false}
            className="w-full h-full min-h-[200px] bg-muted/30 border border-border/40 rounded-lg p-3 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
            placeholder={`Write your ${CODE_LANGUAGE_LABELS[selectedLang]} solution here...`}
          />
        </CardContent>

        {/* Submit */}
        <div className="flex items-center justify-between p-3 pt-0">
          <p className="text-xs text-muted-foreground">
            Explain your approach using voice or text after submitting.
          </p>
          <Button
            size="sm"
            onClick={() => onSubmit(code)}
            disabled={disabled || !code.trim()}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Submit Code
          </Button>
        </div>
      </Card>
    </div>
  );
}
