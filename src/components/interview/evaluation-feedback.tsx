'use client';

/**
 * Evaluation Feedback Card
 * Displays AI evaluation results for an answer.
 */

import { CheckCircle2, XCircle, AlertTriangle, Code2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { AnswerEvaluation } from '@/lib/types/interview';

interface EvaluationFeedbackProps {
  evaluation: AnswerEvaluation;
}

export function EvaluationFeedback({ evaluation }: EvaluationFeedbackProps) {
  const scoreColor =
    evaluation.score >= 80
      ? 'text-green-600'
      : evaluation.score >= 60
        ? 'text-primary'
        : 'text-destructive';

  const scoreBg =
    evaluation.score >= 80
      ? 'bg-green-600/10 border-green-600/20'
      : evaluation.score >= 60
        ? 'bg-primary/10 border-primary/20'
        : 'bg-destructive/10 border-destructive/20';

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className={`p-4 rounded-lg border ${scoreBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {evaluation.isCorrect ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <span className="font-medium">
              {evaluation.isCorrect ? 'Correct' : 'Needs Improvement'}
            </span>
          </div>
          <span className={`text-2xl font-accent font-bold ${scoreColor}`}>
            {evaluation.score}/100
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground/80">{evaluation.feedback}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.strengths.length > 0 && (
          <div className="p-3 rounded-lg bg-green-600/5 border border-green-600/15">
            <h4 className="text-sm font-medium text-green-700 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-xs text-foreground/70">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.improvements.length > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
            <h4 className="text-sm font-medium text-primary mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              To Improve
            </h4>
            <ul className="space-y-1">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="text-xs text-foreground/70">
                  • {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Code Analysis */}
      {evaluation.codeAnalysis && (
        <div className="p-3 rounded-lg border border-border/60">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
            <Code2 className="h-3.5 w-3.5 text-primary" />
            Code Analysis
          </h4>
          <div className="space-y-2.5">
            {(['correctness', 'efficiency', 'readability'] as const).map((metric) => (
              <div key={metric} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{metric}</span>
                  <span className="font-accent font-medium">
                    {evaluation.codeAnalysis![metric]}%
                  </span>
                </div>
                <Progress value={evaluation.codeAnalysis![metric]} className="h-1.5" />
              </div>
            ))}
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span>Time: <span className="font-accent">{evaluation.codeAnalysis.timeComplexity}</span></span>
              <span>Space: <span className="font-accent">{evaluation.codeAnalysis.spaceComplexity}</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Communication Score */}
      {evaluation.communicationScore != null && (
        <div className="p-3 rounded-lg border border-border/60">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            Communication: <span className="font-accent">{evaluation.communicationScore}/100</span>
          </h4>
          {evaluation.communicationFeedback && (
            <p className="text-xs text-muted-foreground">
              {evaluation.communicationFeedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
