'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ContextUsageIndicatorProps {
  usedTokens: number; // prompt tokens used in the last LLM call (after compression)
  contextWindow: number; // model context window
  className?: string;
}

// Mirror backend reserve logic in ContextManager.compress_messages
function effectivePromptLimit(contextWindow: number): number {
  if (contextWindow >= 1_000_000) return Math.max(1, contextWindow - 300_000);
  if (contextWindow >= 400_000) return Math.max(1, contextWindow - 64_000);
  if (contextWindow >= 200_000) return Math.max(1, contextWindow - 32_000);
  if (contextWindow >= 100_000) return Math.max(1, contextWindow - 16_000);
  return Math.max(1, contextWindow - 8_000);
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export const ContextUsageIndicator: React.FC<ContextUsageIndicatorProps> = ({ usedTokens, contextWindow, className }) => {
  const limit = effectivePromptLimit(contextWindow);
  const pct = Math.max(0, Math.min(100, (usedTokens / limit) * 100));
  const pctText = `${pct.toFixed(1)}%`;

  // CSS ring using conic-gradient
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(var(--ring-color, hsl(221 83% 53%)) ${pct}%, hsl(0 0% 92% / 40%) 0)`
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn('relative h-6 px-2 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-2 select-none', className)}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-valuenow={usedTokens}
            aria-label="Context usage"
          >
            <div className="relative w-4 h-4" aria-hidden>
              <div className="absolute inset-0 rounded-full" style={ringStyle} />
              <div className="absolute inset-[2px] rounded-full bg-background" />
            </div>
            <span className="text-[11px] leading-none tabular-nums">{pctText}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex items-center gap-1">
            <span>{pctText} • {formatTokensShort(usedTokens)} / {formatTokensShort(limit)} context used</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};