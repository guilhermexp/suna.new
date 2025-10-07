'use client';

import React, { useState } from 'react';
import { CodeBlockCode } from './code-block';
import { Button } from './button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  showHeader?: boolean;
}

export const ModernCodeBlock: React.FC<ModernCodeBlockProps> = ({
  code,
  language = 'plaintext',
  filename,
  className,
  showHeader = true,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const displayLabel = filename || language;

  return (
    <div className={cn('rounded-lg border border-border bg-background overflow-hidden my-3', className)}>
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {displayLabel}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/80"
            onClick={handleCopy}
            title={isCopied ? 'Copied!' : 'Copy code'}
          >
            {isCopied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <CodeBlockCode
          code={code}
          language={language}
          className="[&_pre]:!bg-transparent [&_pre]:!border-0"
        />
      </div>
    </div>
  );
};
