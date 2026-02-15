'use client';

/**
 * Code Editor Component
 * 
 * Monaco editor (lazy loaded) for DSA coding questions.
 * Supports JavaScript, Python, Java, C++.
 * No code execution — AI static analysis only.
 */

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, RotateCcw, Copy, Check } from 'lucide-react';
import { CODE_LANGUAGES, CODE_LANGUAGE_LABELS, type CodeLanguage } from '@/lib/types/interview';
import dynamic from 'next/dynamic';

// Lazy-load Monaco to keep initial bundle small
const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg border border-border/60">
      <p className="text-sm text-muted-foreground">Loading editor...</p>
    </div>
  ),
});

interface CodeEditorProps {
  initialCode?: string;
  language: CodeLanguage;
  onLanguageChange: (lang: CodeLanguage) => void;
  onSubmit: (code: string) => void;
  disabled?: boolean;
  isEvaluating?: boolean;
}

export function CodeEditor({
  initialCode = '',
  language,
  onLanguageChange,
  onSubmit,
  disabled = false,
  isEvaluating = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleReset = useCallback(() => {
    setCode(initialCode);
    if (editorRef.current) {
      editorRef.current.setValue(initialCode);
    }
  }, [initialCode]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const monacoLangMap: Record<CodeLanguage, string> = {
    javascript: 'javascript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Select value={language} onValueChange={(v) => onLanguageChange(v as CodeLanguage)}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
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

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={handleReset}
            title="Reset to template"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-border/60 rounded-lg overflow-hidden">
        <MonacoEditor
          height="300px"
          language={monacoLangMap[language]}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>

      {/* Submit */}
      <Button
        onClick={() => onSubmit(code)}
        disabled={disabled || isEvaluating || !code.trim()}
        className="w-full gap-2"
      >
        {isEvaluating ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Evaluating Code...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Submit Solution
          </>
        )}
      </Button>
    </div>
  );
}
